import { z } from 'zod'

export const mojangVersionManifest = z.object({
  id: z.string(),
  type: z.string(),
  url: z.string(),
  time: z.string(),
  releaseTime: z.string(),
})

export const mojangVersionManifests = z.object({
  latest: z.object({
    release: z.string(),
    snapshot: z.string(),
  }),
  versions: z.array(mojangVersionManifest),
})

export const gameInstall = z.object({
  name: z.string(),
  path: z.string(),
  uuid: z.string(),
  versionManifest: mojangVersionManifest,
})

export type MojangVersionManifest = z.infer<typeof mojangVersionManifest>
export type MojangVersionManifests = z.infer<typeof mojangVersionManifests>
export type GameInstall = z.infer<typeof gameInstall>

export type StoreSchema = {
  gameInstalls: GameInstall[]
  gameLogDirectories: string[]
}

export const STORE_KEYS: { [key: string]: keyof StoreSchema } = {
  gameInstalls: 'gameInstalls',
  gameLogDirectories: 'gameLogDirectories',
}

export const QUERY_KEYS = {
  useGameInstalls: 'useGameInstalls',
  useGameLogDirectories: 'useGameLogDirectories',
  useMojangVersionManifests: 'useMojangVersionManifests',
}

export const CHANNELS = {
  clipboardTextUpdated: 'clipboard-text-updated',
  createGameInstall: 'create-game-install',
  deleteGameInstall: 'delete-game-install',
  electronStoreGet: 'electron-store-get',
  electronStoreSet: 'electron-store-set',
  launchGameInstall: 'launch-game-install',
  openBrowserWindow: 'open-browser-window',
  openFileDialog: 'open-file-dialog',
  getLogfilePath: 'get-logfile-path',
  readGameLogs: 'read-game-logs',
}

export const LAUNCH_CHANNEL = (uuid: string) => `launch-game-install-${uuid}`
