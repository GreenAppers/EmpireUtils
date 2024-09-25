import {
  Heading,
  Icon,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { CheckIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons'
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
import type { Corner } from '../types'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

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

  const xSort = corners.sort((a, b) => a.chunk.x - b.chunk.x)
  const zSort = corners.sort((a, b) => a.chunk.z - b.chunk.z)

  let foundX, foundZ
  for (let i = 0; i < xSort.length - 1; i++) {
    if (xSort[i].chunk.x === xSort[i + 1].chunk.x) {
      foundZ = lerp(xSort[i].chunk.z, xSort[i + 1].chunk.z, 0.5)
      break
    }
  }
  for (let i = 0; i < zSort.length - 1; i++) {
    if (zSort[i].chunk.z === zSort[i + 1].chunk.z) {
      foundX = lerp(zSort[i].chunk.x, zSort[i + 1].chunk.x, 0.5)
      break
    }
  }

  return (
    <>
      <Heading>🥧📡 Anti/PieRay Helper</Heading>
      <p>
        Setup bind for <a href="https://www.lunarclient.com/">Lunar Client</a>{' '}
        mod{' '}
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
        {foundX && foundZ && (
          <Scatter
            name="Solution"
            data={[{ x: foundX, z: foundZ }]}
            fill="#8884d8"
          />
        )}
      </ScatterChart>
      <TableContainer>
        <Table>
          <Thead>
            <Tr>
              <Th>✔</Th>
              <Th>X</Th>
              <Th>Z</Th>
              <Th>Chunk X</Th>
              <Th>Chunk Z</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {foundX && foundZ && (
              <Tr _hover={{ backgroundColor: 'yellow.100' }}>
                <Td>
                  <Icon as={StarIcon} color="yellow.500" marginX="5px" />
                  <Td>{foundX * 16 + 8 * (foundX >= 0 ? 1 : -1)}</Td>
                  <Td>{foundZ * 16 + 8 * (foundZ >= 0 ? 1 : -1)}</Td>
                  <Td>{foundX}</Td>
                  <Td>{foundZ}</Td>
                  <Td></Td>
                </Td>
              </Tr>
            )}
            {corners.map((corner, i) => (
              <Tr _hover={{ backgroundColor: 'blue.100' }}>
                <Td>
                  <Icon as={CheckIcon} color="green.500" marginX="5px" />
                </Td>
                <Td>{corner.position.x}</Td>
                <Td>{corner.position.z}</Td>
                <Td>{corner.chunk.x}</Td>
                <Td>{corner.chunk.z}</Td>
                <Td>
                  <IconButton
                    aria-label="Remove"
                    color="red.500"
                    icon={<DeleteIcon />}
                    onClick={() =>
                      setCorners(corners.filter((_, j) => i !== j))
                    }
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  )
}

export default App
