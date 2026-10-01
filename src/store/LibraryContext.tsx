import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Album, LegacyStoredPost, Post, StoredPost } from '../types'
import { loadAllPosts, removePost, savePost } from '../lib/db'
import { makeSeed } from '../lib/seed'
import { albumFromPreset } from '../lib/albums'
import { readJSON, writeJSON } from '../lib/storage'

export interface NewPhoto {
  blob: Blob
  takenAt: string
}

interface LibraryCtx {
  posts: Post[]
  albums: Album[]
  ready: boolean
  addPhotos: (photos: NewPhoto[], albumId: string, caption: string) => Promise<void>
  deletePost: (id: string) => void
  movePost: (id: string, albumId: string) => void
  updateCaption: (id: string, caption: string) => void
  createAlbum: (a: Pick<Album, 'name' | 'emoji' | 'theme'>) => Album
  updateAlbum: (id: string, patch: Partial<Pick<Album, 'name' | 'emoji' | 'theme'>>) => void
  deleteAlbum: (id: string) => void
}

const Ctx = createContext<LibraryCtx | null>(null)

const ALBUMS_KEY = 'bs:albums'
const SEEDED_KEY = 'bs:seeded'

// Shared across StrictMode's double effect so we seed / migrate / create object URLs once.
let loading: Promise<{ posts: StoredPost[]; albums: Album[] }> | null = null
function loadOnce() {
  loading ??= (async () => {
    const albums = readJSON<Album[]>(ALBUMS_KEY, [])
    if (!readJSON(SEEDED_KEY, false)) {
      const seed = makeSeed()
      await Promise.all(seed.posts.map(savePost))
      albums.push(...seed.albums)
      writeJSON(SEEDED_KEY, true)
    }
    const ensure = (key: string) => {
      const a = albumFromPreset(key)
      if (!albums.some((x) => x.id === a.id)) albums.push(a)
      return a.id
    }
    const raw = (await loadAllPosts()) as LegacyStoredPost[]
    const posts = await Promise.all(
      raw.map(async (p) => {
        if (p.albumId && albums.some((a) => a.id === p.albumId)) return p as StoredPost
        // v1 photo (milestone, no album) or photo whose album vanished
        const { milestone, ...rest } = p
        const next: StoredPost = { ...rest, albumId: ensure(milestone ?? 'everyday') }
        await savePost(next)
        return next
      }),
    )
    writeJSON(ALBUMS_KEY, albums)
    return { posts, albums }
  })()
  return loading
}

const toView = ({ blob, seedSrc, ...rest }: StoredPost, src?: string): Post => ({
  id: rest.id,
  caption: rest.caption ?? '',
  albumId: rest.albumId,
  takenAt: rest.takenAt,
  createdAt: rest.createdAt,
  src: src ?? (blob ? URL.createObjectURL(blob) : (seedSrc ?? '')),
})

const byNewest = (a: Post, b: Post) => b.takenAt.localeCompare(a.takenAt) || b.createdAt - a.createdAt

export function LibraryProvider({ children }: { children: ReactNode }) {
  const stored = useRef(new Map<string, StoredPost>())
  const [posts, setPosts] = useState<Post[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    loadOnce()
      .then((lib) => {
        if (!alive) return
        lib.posts.forEach((p) => stored.current.set(p.id, p))
        setPosts(lib.posts.map((p) => toView(p)).sort(byNewest))
        setAlbums(lib.albums)
      })
      .catch(() => {
        // IndexedDB unavailable (e.g. strict private mode): run with samples in memory.
        const seed = makeSeed()
        seed.posts.forEach((p) => stored.current.set(p.id, p))
        if (!alive) return
        setPosts(seed.posts.map((p) => toView(p)).sort(byNewest))
        setAlbums(seed.albums)
      })
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (ready) writeJSON(ALBUMS_KEY, albums)
  }, [albums, ready])

  const mutate = useCallback((id: string, fn: (p: StoredPost) => StoredPost) => {
    const cur = stored.current.get(id)
    if (!cur) return
    const next = fn(cur)
    stored.current.set(id, next)
    void savePost(next).catch(() => {})
    setPosts((ps) => ps.map((p) => (p.id === id ? toView(next, p.src) : p)))
  }, [])

  const addPhotos = useCallback(async (photos: NewPhoto[], albumId: string, caption: string) => {
    const now = Date.now()
    const items: StoredPost[] = photos.map((ph, i) => ({
      id: crypto.randomUUID(),
      blob: ph.blob,
      takenAt: ph.takenAt,
      caption,
      albumId,
      createdAt: now + i,
    }))
    await Promise.all(items.map(savePost))
    items.forEach((p) => stored.current.set(p.id, p))
    setPosts((ps) => [...items.map((p) => toView(p)), ...ps].sort(byNewest))
  }, [])

  const deletePosts = useCallback((ids: string[]) => {
    const gone = new Set(ids)
    ids.forEach((id) => {
      stored.current.delete(id)
      void removePost(id).catch(() => {})
    })
    setPosts((ps) => {
      ps.forEach((p) => gone.has(p.id) && p.src.startsWith('blob:') && URL.revokeObjectURL(p.src))
      return ps.filter((p) => !gone.has(p.id))
    })
  }, [])

  const createAlbum = useCallback((a: Pick<Album, 'name' | 'emoji' | 'theme'>) => {
    const album: Album = { ...a, id: crypto.randomUUID(), createdAt: Date.now() }
    setAlbums((as) => [...as, album])
    return album
  }, [])

  const value = useMemo<LibraryCtx>(
    () => ({
      posts,
      albums,
      ready,
      addPhotos,
      createAlbum,
      deletePost: (id) => deletePosts([id]),
      movePost: (id, albumId) => mutate(id, (p) => ({ ...p, albumId })),
      updateCaption: (id, caption) => mutate(id, (p) => ({ ...p, caption })),
      updateAlbum: (id, patch) => setAlbums((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a))),
      deleteAlbum: (id) => {
        deletePosts(posts.filter((p) => p.albumId === id).map((p) => p.id))
        setAlbums((as) => as.filter((a) => a.id !== id))
      },
    }),
    [posts, albums, ready, addPhotos, createAlbum, deletePosts, mutate],
  )

  return <Ctx value={value}>{children}</Ctx>
}

export function useLibrary() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return ctx
}
