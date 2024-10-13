import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Link,
  Spacer,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToken,
} from '@chakra-ui/react'
import {
  CheckIcon,
  CopyIcon,
  DeleteIcon,
  StarIcon,
  QuestionIcon,
  RepeatIcon,
  SettingsIcon,
} from '@chakra-ui/icons'
import log from 'electron-log/renderer'
import React, { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Dot,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ScatterPointItem } from 'recharts/types/cartesian/Scatter'
import type { ChunkDirection, Direction, Sample, Solution } from '../types'

const vanillaCoords =
  /tp @s (-?\d+\.\d+) (-?\d+\.\d+) (-?\d+\.\d+) (-?\d+\.\d+)/
const lunarClientCoords = /X: (-?\d+) Y: (-?\d+) Z: (-?\d+)/

function getDirectionFromRotation(
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

function getDirectionArrow(direction?: ChunkDirection) {
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const ScatterArrow = (
  props: ScatterPointItem & { fill?: string; direction?: ChunkDirection }
) => {
  const { cx, cy, fill, direction } = props
  return (
    <g>
      {direction ? (
        <g transform={`translate(${cx},${cy})`}>
          <text
            alignmentBaseline="middle"
            fill={fill}
            fontWeight="bold"
            textAnchor="middle"
          >
            {getDirectionArrow(direction)}
          </text>
        </g>
      ) : (
        <Dot cx={cx} cy={cy} r={5} fill={fill} />
      )}
    </g>
  )
}

const ScatterStar = (props: ScatterPointItem & { fill?: string }) => {
  const { cx, cy, fill } = props
  return (
    <g>
      <g transform={`translate(${cx},${cy})`}>
        <text
          alignmentBaseline="middle"
          fill={fill}
          fontWeight="bold"
          textAnchor="middle"
        >
          {'★'}
        </text>
      </g>
    </g>
  )
}

function App() {
  const [logfilePath, setLogfilePath] = useState('')
  const [samples, setSamples] = useState([] as Sample[])
  const [solution, setSolution] = useState({} as Solution)
  const [showHelp, setShowHelp] = useState(false)

  const [green500, yellow300] = useToken(
    // the key within the theme, in this case `theme.colors`
    'colors',
    // the subkey(s), resolving to `theme.colors.red.100`
    ['green.500', 'yellow.300']
    // a single fallback or fallback array matching the length of the previous arg
  )

  useEffect(() => {
    window.api.getLogfilePath().then(setLogfilePath)
  }, [setLogfilePath])

  useEffect(() => {
    window.api.onClipboardTextUpdated((text: string) => {
      let rotation: number | undefined
      let match = text.match(vanillaCoords)
      if (match) rotation = parseFloat(match[4])

      if (!match) match = text.match(lunarClientCoords)
      if (!match) return

      const x = parseInt(match[1])
      const y = parseInt(match[2])
      const z = parseInt(match[3])

      const sample: Sample = {
        chunk: { x: Math.floor(x / 16), z: Math.floor(z / 16) },
        position: { x, y, z },
        direction: getDirectionFromRotation(rotation),
      }

      setSamples((samples) => {
        for (const currentSample of samples) {
          const xDirection = sample.position.x - currentSample.position.x
          const zDirection = sample.position.z - currentSample.position.z
          if (Math.abs(xDirection) <= 1 && Math.abs(zDirection) <= 1) {
            log.info(
              `Updated direction: ${currentSample.position.x}, ${currentSample.position.z} -> ${x}, ${z}`
            )
            return samples.map((x) =>
              x === currentSample
                ? {
                    ...currentSample,
                    direction: {
                      x: xDirection as Direction,
                      z: zDirection as Direction,
                    },
                  }
                : x
            )
          }
        }
        log.info(`Added sample: ${x}, ${y}, ${z}`)
        return [...samples, sample]
      })
    })
    return () => window.api.removeClipboardTextUpdatedListener()
  }, [setSamples])

  useEffect(() => {
    let minX, maxX, minZ, maxZ
    for (const corner of samples) {
      if (minX === undefined || corner.chunk.x < minX) minX = corner.chunk.x
      if (maxX === undefined || corner.chunk.x > maxX) maxX = corner.chunk.x
      if (minZ === undefined || corner.chunk.z < minZ) minZ = corner.chunk.z
      if (maxZ === undefined || corner.chunk.z > maxZ) maxZ = corner.chunk.z
    }

    const xSort = [...samples].sort((a, b) => a.chunk.x - b.chunk.x)
    const zSort = [...samples].sort((a, b) => a.chunk.z - b.chunk.z)

    let distX, distZ, foundX, foundZ
    for (let i = 0; i < xSort.length - 1; i++) {
      if (xSort[i].chunk.x === xSort[i + 1].chunk.x) {
        foundZ = lerp(xSort[i].chunk.z, xSort[i + 1].chunk.z, 0.5)
        distZ = Math.abs(xSort[i].chunk.z - xSort[i + 1].chunk.z)
        break
      }
    }
    for (let i = 0; i < zSort.length - 1; i++) {
      if (zSort[i].chunk.z === zSort[i + 1].chunk.z) {
        foundX = lerp(zSort[i].chunk.x, zSort[i + 1].chunk.x, 0.5)
        distX = Math.abs(zSort[i].chunk.x - zSort[i + 1].chunk.x)
        break
      }
    }

    if (foundX && foundZ) log.info(`Found solution: ${foundX}, ${foundZ}`)
    setSolution({ minX, maxX, minZ, maxZ, distX, distZ, foundX, foundZ })
  }, [samples, setSamples, setSolution])

  const { minX, maxX, minZ, maxZ, distX, distZ, foundX, foundZ } = solution

  return (
    <Container>
      <Flex>
        <Heading>🥧📡 Anti/PieRay Helper</Heading>
        <Spacer />
        <Box>
          <Tooltip label="Show help">
            <IconButton
              aria-label="Help"
              icon={<QuestionIcon />}
              onClick={() => setShowHelp(!showHelp)}
            />
          </Tooltip>
          <Tooltip label="Open logfile">
            <IconButton
              aria-label="Logfile"
              icon={<CopyIcon />}
              onClick={() =>
                window.api.openBrowserWindow(
                  `file://${logfilePath.replace(/(\s+)/g, '\\$1')}`
                )
              }
            />
          </Tooltip>
          <Tooltip label="Clear">
            <IconButton
              aria-label="Clear"
              icon={<RepeatIcon />}
              onClick={() => {
                log.info(`Cleared`)
                setSamples([])
                setSolution({})
              }}
            />
          </Tooltip>
        </Box>
      </Flex>
      {showHelp && (
        <List marginTop="1rem" marginBottom=".5rem">
          <ListItem>
            <ListIcon color="blue.300">
              <SettingsIcon />
            </ListIcon>
            Press F3+C in vanilla, or setup bind for{' '}
            <Link
              onClick={() =>
                window.api.openBrowserWindow('https://www.lunarclient.com/')
              }
            >
              Lunar Client
            </Link>{' '}
            mod{' '}
            <Link
              onClick={() =>
                window.api.openBrowserWindow(
                  'https://lunarclient.dev/apollo/developers/mods/coordinates'
                )
              }
            >
              Coordinates
            </Link>{' '}
            to "Copy Coords to Clipboard".
          </ListItem>
          <ListItem>
            <ListIcon color="green.500">
              <CheckIcon />
            </ListIcon>
            Move to a "corner" showing the entity in PieChart, but where the
            entity is missing from PieChart in the neighboring chunks in the X
            and Z directions.
          </ListItem>
          <ListItem>
            <ListIcon color="green.500">
              <CheckIcon />
            </ListIcon>
            Copy the coordinates to the clipboard and the corner will be added.
          </ListItem>
          <ListItem>
            <ListIcon color="green.500">
              <CheckIcon />
            </ListIcon>
            Find two more corners: one with the same X chunk coordinate, one
            with the same Z chunk coordinate.
          </ListItem>
          <ListItem>
            <ListIcon color="yellow.300">
              <StarIcon />
            </ListIcon>
            The solution is added.
          </ListItem>
        </List>
      )}
      <ScatterChart
        width={730}
        height={250}
        margin={{
          top: 20,
          bottom: 10,
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
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        {samples.map((x, i) => (
          <Scatter
            key={i}
            name={`Corner ${i + 1}`}
            data={[{ ...x.chunk, direction: x.direction }]}
            fill={green500}
            shape={<ScatterArrow />}
          />
        ))}
        {foundX && foundZ && (
          <Scatter
            name="Solution"
            data={[{ x: foundX, z: foundZ }]}
            fill={yellow300}
            shape={<ScatterStar />}
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
              <Td>→</Td>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {foundX && foundZ && (
              <Tr _hover={{ backgroundColor: 'yellow.50' }}>
                <Td>
                  <Icon as={StarIcon} color="yellow.300" marginX="5px" />
                </Td>
                <Td>{foundX * 16 + 8 * (1 + (distX % 2))}</Td>
                <Td>{foundZ * 16 + 8 * (1 + (distZ % 2))}</Td>
                <Td>{foundX}</Td>
                <Td>{foundZ}</Td>
                <Td></Td>
                <Td></Td>
              </Tr>
            )}
            {samples.map((corner, i) => (
              <Tr key={i} _hover={{ backgroundColor: 'blue.50' }}>
                <Td>
                  <Icon as={CheckIcon} color="green.500" marginX="5px" />
                </Td>
                <Td>{corner.position.x}</Td>
                <Td>{corner.position.z}</Td>
                <Td>{corner.chunk.x}</Td>
                <Td>{corner.chunk.z}</Td>
                <Td>{getDirectionArrow(corner.direction)}</Td>
                <Td>
                  <IconButton
                    aria-label="Remove"
                    color="red.500"
                    icon={<DeleteIcon />}
                    onClick={() => {
                      log.info(
                        `Removed corner: ${corner.position.x}, ${corner.position.y}, ${corner.position.z}`
                      )
                      setSamples(samples.filter((_, j) => i !== j))
                    }}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Container>
  )
}

export default App
