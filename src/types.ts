export interface Album {
  id: string
  name: string
  emoji: string
  /** theme id, see lib/themes.ts */
  theme: string
  createdAt: number
}

/** A photo as the UI sees it — `src` is always a displayable URL. */
export interface Post {
  id: string
  src: string
  caption: string
  albumId: string
  /** yyyy-mm-dd, the day the photo was taken */
  takenAt: string
  createdAt: number
}

/** A photo as it lives in IndexedDB — uploads keep the image Blob, samples keep a data URL. */
export interface StoredPost extends Omit<Post, 'src'> {
  blob?: Blob
  seedSrc?: string
}

/** Posts saved by the first version of the app used milestones instead of albums. */
export type LegacyStoredPost = Omit<StoredPost, 'albumId'> & { albumId?: string; milestone?: string }

export interface BabyProfile {
  name: string
  parentName: string
  /** yyyy-mm-dd */
  birthday: string
  bio: string
  avatar?: string
}
