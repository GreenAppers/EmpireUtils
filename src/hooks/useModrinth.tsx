import { useQuery } from '@tanstack/react-query'
import {
  modrinthProjectVersion,
  ModrinthProjectVersion,
  QUERY_KEYS,
} from '../constants'
import axios from 'axios'
import { z } from 'zod'

export const modrinthProjectVersionQuery = (project: string) => ({
  queryKey: [QUERY_KEYS.useModrinthProjectVersion, project],
  queryFn: () =>
    axios
      .get(`https://api.modrinth.com/v2/project/${project}/version`)
      .then((response) => z.array(modrinthProjectVersion).parse(response.data)),
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})

export const useModrinthProjectVersionQuery = (project: string) =>
  useQuery<ModrinthProjectVersion[]>(modrinthProjectVersionQuery(project))

export const modrinthMatchingVersion = (
  versions: ModrinthProjectVersion[],
  version: string,
  loader: string
) =>
  versions.find(
    (v) => v.game_versions.includes(version) && v.loaders.includes(loader)
  )
