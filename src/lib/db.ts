import { createStore, del, set, values } from 'idb-keyval'
import type { StoredPost } from '../types'

const posts = createStore('baby-stories', 'posts')

export const loadAllPosts = () => values<StoredPost>(posts)
export const savePost = (p: StoredPost) => set(p.id, p, posts)
export const removePost = (id: string) => del(id, posts)
