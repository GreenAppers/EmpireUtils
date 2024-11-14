import Store, { Schema } from 'electron-store'
import {
  GameAccount,
  GameInstall,
  STORE_KEYS,
  type StoreSchema,
} from './constants'
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

export const updateGameAccount = (
  store: Store<StoreSchema>,
  gameAccount: GameAccount
) =>
  store.set(STORE_KEYS.gameAccounts, [
    ...store
      .get<string, GameAccount[]>(STORE_KEYS.gameAccounts)
      .filter((x) => x.profile.id !== gameAccount.profile.id),
    ...[{ ...gameAccount }],
  ])

export const updateGameInstall = (
  store: Store<StoreSchema>,
  gameInstall: GameInstall
) =>
  store.set(STORE_KEYS.gameInstalls, [
    ...store
      .get<string, GameInstall[]>(STORE_KEYS.gameInstalls)
      .filter((x) => x.uuid !== gameInstall.uuid),
    ...[{ ...gameInstall }],
  ])

export const removeGameInstall = (
  store: Store<StoreSchema>,
  gameInstall: GameInstall
) =>
  store.set(
    STORE_KEYS.gameInstalls,
    store
      .get<string, GameInstall[]>(STORE_KEYS.gameInstalls)
      .filter((x) => x.uuid !== gameInstall.uuid)
  )
