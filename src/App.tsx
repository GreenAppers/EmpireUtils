import React, { useEffect, useState } from 'react'
import {
  ScatterChart,
  CartesianGrid,
  Legend,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Corner } from './types'

function App() {
  const [corners, setCorners] = useState([] as Corner[])

  useEffect(() => {
    window.api.onClipboardTextUpdated((text: string) => {
      const match = text.match(/X: (-?\d+) Y: (-?\d+) Z: (-?\d+)/)
      if (!match) return

      const x = parseInt(match[1])
      const y = parseInt(match[2])
      const z = parseInt(match[3])

      const corner: Corner = {
        chunk: { x: Math.floor(x / 16), z: Math.floor(z / 16) },
        position: { x, y, z },
      }

      setCorners((corners) => [...corners, corner])
    })
    return () => window.api.removeClipboardTextUpdatedListener()
  }, [])

  let minX, maxX, minZ, maxZ
  for (const corner of corners) {
    if (minX === undefined || corner.chunk.x < minX) minX = corner.chunk.x
    if (maxX === undefined || corner.chunk.x > maxX) maxX = corner.chunk.x
    if (minZ === undefined || corner.chunk.z < minZ) minZ = corner.chunk.z
    if (maxZ === undefined || corner.chunk.z > maxZ) maxZ = corner.chunk.z
  }

  return (
    <div>
      <h1>🥧📡 Anti/PieRay Helper</h1>
      <p>
        Setup bind for <a href="https://www.lunarclient.com/">Lunar Client</a> mod{' '}
        <a href="https://lunarclient.dev/apollo/developers/mods/coordinates">
          Coordinates
        </a>{' '}
        to "Copy Coords to Clipboard".
      </p>
      <ScatterChart
        width={730}
        height={250}
        margin={{
          top: 20,
          right: 20,
          bottom: 10,
          left: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          name="x"
          domain={[minX - 1, maxX + 1]}
          allowDecimals={false}
        />
        <YAxis
          dataKey="z"
          type="number"
          name="z"
          domain={[minZ - 1, maxZ + 1]}
          allowDecimals={false}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter
          name="Corners"
          data={corners.map((x) => x.chunk)}
          fill="#8884d8"
        />
      </ScatterChart>
      <ul>
        {corners.map((c) => (
          <li>
            Position: {c.position.x}, {c.position.z}, Chunk: {c.chunk.x},{' '}
            {c.chunk.z}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
