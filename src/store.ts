import Store, { Schema } from 'electron-store'
import type { StoreSchema } from './types'
import { getDefaultGameLogDirectories } from './utils/gamelog'

export const schema: Schema<StoreSchema> = {
  gameLogDirectories: {
    type: 'array',
    items: { type: 'string' },
    default: getDefaultGameLogDirectories(),
  },
}

export const newStore = () => new Store<StoreSchema>({ schema })
