import { z } from 'zod'

export enum ModLoaderName {
  Fabric = 'Fabric',
  None = 'None',
}

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
  os: z.optional(
    z.object({
      arch: z.optional(z.string()),
      name: z.optional(z.string()),
    })
  ),
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

export const mojangLibrary = z.object({
  downloads: z.object({
    artifact: mojangArtifact,
  }),
  name: z.string(),
  rules: z.optional(z.array(mojangRule)),
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
  libraries: z.array(mojangLibrary),
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

export const fabricVersionDetails = z.object({
  id: z.string(),
  inheritsFrom: z.string(),
  releaseTime: z.string(),
  time: z.string(),
  type: z.string(),
  mainClass: z.string(),
  arguments: z.object({
    game: z.array(z.string()),
    jvm: z.array(z.string()),
  }),
  libraries: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      sha1: z.optional(z.string()),
      size: z.optional(z.number()),
    })
  ),
})

export const gameInstall = z.object({
  name: z.string(),
  path: z.string(),
  uuid: z.string(),
  versionManifest: mojangVersionManifest,
  fabricLoaderVersion: z.optional(z.string()),
})

export type MojangLibrary = z.infer<typeof mojangLibrary>
export type MojangRule = z.infer<typeof mojangRule>
export type MojangVersionDetails = z.infer<typeof mojangVersionDetails>
export type MojangVersionManifest = z.infer<typeof mojangVersionManifest>
export type MojangVersionManifests = z.infer<typeof mojangVersionManifests>
export type MojangStringsTemplate = z.infer<typeof mojangStringsTemplate>

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

export const getGameInstalModLoaderName = (
  gameInstall: Partial<GameInstall>
): ModLoaderName => {
  if (gameInstall.fabricLoaderVersion) return ModLoaderName.Fabric
  return ModLoaderName.None
}

export const setGameInstallModLoaderName = (
  gameInstall: Partial<GameInstall>,
  modLoaderName: string
): Partial<GameInstall> => {
  switch (modLoaderName) {
    case ModLoaderName.Fabric:
      return { ...gameInstall, fabricLoaderVersion: 'auto' }
    default:
      return { ...gameInstall, fabricLoaderVersion: undefined }
  }
}

export const parseLibraryName = (libraryName: string) => {
  const [jarOrg, jarName, jarVersion] = libraryName.split(':')
  return {
    jarOrg,
    jarName,
    jarVersion,
  }
}

export const updateVersionDetailsLibrary = (
  versionDetails: MojangVersionDetails,
  newLibrary: MojangLibrary
) => {
  const { jarOrg: newLibraryJarOrg, jarName: newLibraryJarName } =
    parseLibraryName(newLibrary.name)
  for (let i = 0; i < versionDetails.libraries.length; i++) {
    const library = versionDetails.libraries[i]
    const { jarOrg, jarName } = parseLibraryName(library.name)
    if (jarOrg === newLibraryJarOrg && jarName === newLibraryJarName) {
      versionDetails.libraries[i] = newLibrary
      return
    }
  }
  versionDetails.libraries.push(newLibrary)
}
