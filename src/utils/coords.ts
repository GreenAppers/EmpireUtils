import { DependencyList, useEffect } from 'react'
import type { ChunkDirection } from '../types'

const vanillaCoords =
  /tp @s (-?\d+\.\d+) (-?\d+\.\d+) (-?\d+\.\d+) (-?\d+\.\d+)/
const lunarClientCoords = /X: (-?\d+) Y: (-?\d+) Z: (-?\d+)/

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function getDirectionFromRotation(
  rotation?: number
): ChunkDirection | undefined {
  if (typeof rotation !== 'number') return undefined
  const angleInRadians = rotation * (Math.PI / 180)
  const x = -Math.sin(angleInRadians)
  const z = Math.cos(angleInRadians)
  return {
    x: Math.abs(x) > 0.5 ? (x > 0 ? 1 : -1) : 0,
    z: Math.abs(z) > 0.5 ? (z > 0 ? 1 : -1) : 0,
  }
}

export function getDirectionArrow(direction?: ChunkDirection) {
  if (!direction) return ''
  switch (direction.z) {
    case 1:
      return direction.x === 1 ? '↗' : direction.x === -1 ? '↖' : '↑'
    case -1:
      return direction.x === 1 ? '↘' : direction.x === -1 ? '↙' : '↓'
    case 0:
      return direction.x === 1 ? '→' : direction.x === -1 ? '←' : ''
  }
}

export const usePastedCoordinates = (
  cb: (x: number, y: number, z: number, rotation?: number) => void,
  deps?: DependencyList
) =>
  useEffect(() => {
    const handle = window.api.onClipboardTextUpdated((text: string) => {
      let rotation: number | undefined
      let match = text.match(vanillaCoords)
      if (match) rotation = parseFloat(match[4])

      if (!match) match = text.match(lunarClientCoords)
      if (!match) return

      const x = parseInt(match[1])
      const y = parseInt(match[2])
      const z = parseInt(match[3])
      cb(x, y, z, rotation)
    })
    return () => window.api.removeListener(handle)
  }, deps)
