import Store, { Schema } from 'electron-store'
import type { StoreSchema } from './constants'
import { getDefaultGameLogDirectories } from './utils/gamelog'

export const schema: Schema<StoreSchema> = {
  gameInstalls: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        path: { type: 'string' },
        uuid: { type: 'string' },
        versionManifest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            url: { type: 'string' },
            time: { type: 'string' },
            releaseTime: { type: 'string' },
          },
        },
        fabricLoaderVersion: { type: 'string', default: '' },
        mods: { type: 'array', items: { type: 'string' }, default: [] },
      },
    },
    default: [],
  },
  gameLogDirectories: {
    type: 'array',
    items: { type: 'string' },
    default: getDefaultGameLogDirectories(),
  },
}

export const newStore = () => new Store<StoreSchema>({ schema })
