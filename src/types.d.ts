import { api } from './preload'

interface Chunk {
  x: number
  z: number
}

interface ChunkDirection {
  x: 1 | -1
  z: 1 | -1
}

interface Corner {
  chunk: Chunk
  position: Vector3
}

interface Solution {
  minX?: number
  maxX?: number
  minZ?: number
  maxZ?: number
  foundX?: number
  foundZ?: number
}

interface Vector3 {
  x: number
  y: number
  z: number
}

declare global {
  interface Window {
    api: typeof api
  }
}
