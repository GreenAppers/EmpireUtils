import { api } from './preload'

interface Chunk {
  x: number
  z: number
}

interface ChunkDirection {
  x: Direction
  z: Direction
}

interface GameLog {
  path: string
  mtimeMs: number
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

type StoreSchema = {
  gameLogDirectories: string[]
}

interface TimeValue {
  time: number
  value: number
}

interface TimeSeries {
  buckets: TimeValue[]
  duration: number
  samples: number
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
