import { GameMod } from '../constants'

export const defaultFabricMods = [
  'fabric-api',
  'fancymenu',
  'iris',
  'konkrete',
  'litematica',
  'malilib',
  'melody',
  'meteor-client',
  'replaymod',
  'sodium',
]

export const defaultShaderpacks = ['bsl-shaders', 'photon-shader']

export const modExtras: Record<
  string,
  (version: string) => Record<string, string>
> = {
  baritone: () => ({
    'baritone/settings.txt':
      'https://github.com/AngleOpera/meteor-archive/blob/12c09d0c10b869477220494ba2266c61ac3ba355/default/baritone/settings.txt?raw=true',
  }),
  fancymenu: () => ({
    'config/fancymenu/options.txt':
      'https://github.com/AngleOpera/meteor-archive/blob/626061ca24725129e79b0edae070211aa9da3fc8/default/config/fancymenu/options.txt?raw=true',
  }),
  'meteor-client': () => ({
    'meteor-client/macros.nbt':
      'https://github.com/AngleOpera/meteor-archive/blob/12c09d0c10b869477220494ba2266c61ac3ba355/default/meteor-client/macros.nbt?raw=true',
    'meteor-client/modules.nbt':
      'https://github.com/AngleOpera/meteor-archive/blob/12c09d0c10b869477220494ba2266c61ac3ba355/default/meteor-client/modules.nbt?raw=true',
  }),
}

export const modDownloads: Record<string, Record<string, Partial<GameMod>>> = {
  baritone: {
    '1.20.6': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.20.6-SNAPSHOT.jar?raw=true',
    },
    '1.20.1': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.20.1-SNAPSHOT.jar?raw=true',
    },
    '1.20': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.20-SNAPSHOT.jar?raw=true',
    },
    '1.19.4': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.19.4-SNAPSHOT.jar?raw=true',
    },
    '1.19.3': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.19.3-SNAPSHOT.jar?raw=true',
    },
    '1.19.2': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.19.2-SNAPSHOT.jar?raw=true',
    },
    '1.19': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.19-SNAPSHOT.jar?raw=true',
    },
    '1.18.2': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.18.2-SNAPSHOT.jar?raw=true',
    },
    '1.16.5': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/baritone/baritone-1.16.5-SNAPSHOT.jar?raw=true',
    },
  },
  'meteor-client': {
    '1.20.6': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.7.jar?raw=true',
    },
    '1.20.4': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.6.jar?raw=true',
    },
    '1.20.2': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.5.jar?raw=true',
    },
    '1.20.1': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.4.jar?raw=true',
    },
    '1.20': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.4.jar?raw=true',
    },
    '1.19.4': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.3.jar?raw=true',
    },
    '1.19.3': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.2.jar?raw=true',
    },
    '1.19.2': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.1.jar?raw=true',
    },
    '1.19': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.5.0.jar?raw=true',
    },
    '1.18.2': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.4.9.jar?raw=true',
    },
    '1.17.1': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.4.6.jar?raw=true',
    },
    '1.16': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-0.4.4.jar?raw=true',
    },
    '1.15.2': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-meteor-client-0.2.6-1.15.2.jar?raw=true',
    },
    '1.14.4': {
      url: 'https://github.com/AngleOpera/meteor-archive/blob/6da1d84dea90fa02a91b9ffb0a706725e5b5caa1/files/meteor-client/meteor-client-meteor-client-0.2.8-1.14.4.jar?raw=true',
    },
  },
}
