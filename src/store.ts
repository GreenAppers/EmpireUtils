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
        version: { type: 'string' },
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
