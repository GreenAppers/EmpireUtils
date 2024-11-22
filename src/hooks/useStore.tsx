import {
  GameAccount,
  GameAnalyticsPattern,
  GameInstall,
  QUERY_KEYS,
  STORE_KEYS,
  Waypoint,
} from '../constants'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

function assertValue<X>(x: X | undefined | null, name?: string): X {
  if (!x) throw new Error(`missing ${name}`)
  return x
}

export const useGameAcocuntsQuery = () =>
  useQuery<GameAccount[]>({
    queryKey: [QUERY_KEYS.useGameAccounts],
    queryFn: () => window.api.store.get(STORE_KEYS.gameAccounts),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export const useGameAnalyticsPatternsQuery = () =>
  useQuery<GameAnalyticsPattern[]>({
    queryKey: [QUERY_KEYS.useGameAnalyticsPatterns],
    queryFn: () => window.api.store.get(STORE_KEYS.gameAnalyticsPatterns),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export const useGameLogDirectoriesQuery = () =>
  useQuery<string[]>({
    queryKey: [QUERY_KEYS.useGameLogDirectories],
    queryFn: () => window.api.store.get(STORE_KEYS.gameLogDirectories),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export const useGameInstallsQuery = () =>
  useQuery<GameInstall[]>({
    queryKey: [QUERY_KEYS.useGameInstalls],
    queryFn: () => window.api.store.get(STORE_KEYS.gameInstalls),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export const useCreateGameInstallMutation = (options?: {
  callback?: (gameInstall?: GameInstall, error?: unknown) => void
}) => {
  const queryClient = useQueryClient()
  return useMutation<GameInstall, unknown, Partial<GameInstall>>({
    mutationFn: (newGameInstall) =>
      window.api.createGameInstall({
        ...newGameInstall,
        name: assertValue(
          newGameInstall.name,
          'useCreateGameInstallMutation name'
        ),
        path: newGameInstall.path || '',
        uuid: newGameInstall.uuid || '',
        versionManifest: assertValue(
          newGameInstall.versionManifest,
          'useCreateGameInstallMutation versionManifest'
        ),
      }),
    onSuccess: (gameInstall) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useGameInstalls] })
      if (options?.callback) options.callback(gameInstall, undefined)
    },
    onError: (error) => {
      if (options?.callback) options.callback(undefined, error)
    },
  })
}

export const useDeleteGameInstallMutation = (options?: {
  callback?: (error?: unknown) => void
}) => {
  const queryClient = useQueryClient()
  return useMutation<boolean, unknown, GameInstall>({
    mutationFn: (deleteGameInstall) =>
      window.api.deleteGameInstall(deleteGameInstall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.useGameInstalls] })
      if (options?.callback) options.callback(undefined)
    },
    onError: (error) => {
      if (options?.callback) options.callback(error)
    },
  })
}

export const useWaypointsQuery = () =>
  useQuery<Waypoint[]>({
    queryKey: [QUERY_KEYS.useWaypoints],
    queryFn: () => window.api.store.get(STORE_KEYS.waypoints),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
