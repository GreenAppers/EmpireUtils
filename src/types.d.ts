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

interface GameLog {
  path: string
  mtimeMs: number
}

interface GameLogLine {
  userName: string
  serverName: string
  content: string
  timestamp: Date
  source: string
}

interface LaunchStatusMessage {
  message?: string
  processId?: number
  status?: string
}

interface PieRaySample {
  chunk: Chunk
  direction?: ChunkDirection
  position: Vector3
}

interface PieRaySolution {
  minX?: number
  maxX?: number
  minZ?: number
  maxZ?: number
  distX?: number
  distZ?: number
  foundX?: number
  foundZ?: number
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
