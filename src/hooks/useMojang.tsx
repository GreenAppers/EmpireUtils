import { useQuery } from '@tanstack/react-query'
import {
  mojangVersionManifests,
  MojangVersionManifests,
  QUERY_KEYS,
} from '../constants'
import axios from 'axios'

export const useMojangVersionManifestsQuery = () =>
  useQuery<MojangVersionManifests>({
    queryKey: [QUERY_KEYS.useMojangVersionManifests],
    queryFn: async () => {
      const { data } = await axios.get(
        'https://launchermeta.mojang.com/mc/game/version_manifest.json'
      )
      return mojangVersionManifests.parse(data)
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
