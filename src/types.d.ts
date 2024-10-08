import { api } from './preload'

interface Chunk {
  x: number
  z: number
}

interface ChunkDirection {
  x: Direction
  z: Direction
}

type Direction = 1 | -1 | 0

interface Sample {
  chunk: Chunk
  direction?: ChunkDirection
  position: Vector3
}

interface Solution {
  minX?: number
  maxX?: number
  minZ?: number
  maxZ?: number
  distX?: number
  distZ?: number
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
