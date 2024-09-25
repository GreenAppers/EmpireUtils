import { api } from './preload'

interface Chunk {
  x: number
  z: number
}

interface ChunkDirection {
  x: 1 | -1
  z: 1 | -1
}

interface Vector3 {
  x: number
  y: number
  z: number
}

interface Corner {
  chunk: Chunk
  position: Vector3
}

declare global {
  interface Window {
    api: typeof api
  }
}
