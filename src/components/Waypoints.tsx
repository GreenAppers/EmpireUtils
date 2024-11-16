import {
  Flex,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import { QUERY_KEYS, STORE_KEYS, Waypoint } from '../constants'
import { useQuery } from '@tanstack/react-query'

export const useWaypointsQuery = () =>
  useQuery<Waypoint[]>({
    queryKey: [QUERY_KEYS.useWaypoints],
    queryFn: () => window.api.store.get(STORE_KEYS.waypoints),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export function Waypoints() {
  const waypoints = useWaypointsQuery()

  return (
    <>
      <Flex>
        <Heading>Waypoints</Heading>
      </Flex>

      <TableContainer>
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Date</Th>
              <Th>X</Th>
              <Th>Y</Th>
              <Th>Z</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(waypoints.data ?? []).map((waypoint, i) => (
              <Tr key={i} _hover={{ backgroundColor: 'blue.50' }}>
                <Td>{waypoint.name}</Td>
                <Td>{waypoint.date.toLocaleDateString()}</Td>
                <Td>{waypoint.x}</Td>
                <Td>{waypoint.y}</Td>
                <Td>{waypoint.z}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  )
}
