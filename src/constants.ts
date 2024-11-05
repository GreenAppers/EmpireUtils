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

export const mojangRule = z.object({
  action: z.string(),
  features: z.optional(z.record(z.string(), z.boolean())),
  os: z.optional(z.object({
    arch: z.optional(z.string()),
    name: z.optional(z.string()),
  })),
})

export const mojangStringsTemplate = z.array(
  z.union([
    z.string(),
    z.object({
      rules: z.array(mojangRule),
      value: z.union([z.string(), z.array(z.string())]),
    }),
  ])
)

export const mojangHash = z.object({
  sha1: z.string(),
  size: z.number(),
  url: z.string(),
})

export const mojangArtifact = mojangHash.extend({
  path: z.string(),
})

export const mojangVersionDetails = z.object({
  arguments: z.object({
    game: mojangStringsTemplate,
    jvm: mojangStringsTemplate,
  }),
  assetIndex: mojangHash.extend({
    id: z.string(),
    totalSize: z.number(),
  }),
  assets: z.string(),
  complianceLevel: z.number(),
  downloads: z.record(z.string(), mojangHash),
  id: z.string(),
  javaVersion: z.object({
    component: z.string(),
    majorVersion: z.number(),
  }),
  libraries: z.array(
    z.object({
      downloads: z.object({
        artifact: mojangArtifact,
      }),
      name: z.string(),
      rules: z.optional(z.array(mojangRule)),
    })
  ),
  logging: z.object({
    client: z.object({
      argument: z.string(),
      file: mojangHash.extend({ id: z.string() }),
      type: z.string(),
    }),
  }),
  mainClass: z.string(),
  minimumLauncherVersion: z.number(),
  releaseTime: z.string(),
  time: z.string(),
  type: z.string(),
})

export const gameInstall = z.object({
  name: z.string(),
  path: z.string(),
  uuid: z.string(),
  versionManifest: mojangVersionManifest,
})

export type MojangRule = z.infer<typeof mojangRule>
export type MojangStringsTemplate = z.infer<typeof mojangStringsTemplate>
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
