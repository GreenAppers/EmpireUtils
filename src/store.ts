import { z } from 'zod'
import Store from 'zod-electron-store'

import {
  gameAccount,
  GameAccount,
  gameAnalyticsPattern,
  gameInstall,
  GameInstall,
  STORE_KEYS,
  waypoint,
} from './constants'
import {
  getDefaultAnalyticsPatterns,
  getDefaultGameLogDirectories,
} from './utils/gamelog'

export { Store }

export const storeSchema = z.object({
  gameAccounts: z.array(gameAccount).default([]),
  gameAnalyticsPatterns: z
    .array(gameAnalyticsPattern)
    .default(getDefaultAnalyticsPatterns()),
  gameInstalls: z.array(gameInstall).default([]),
  gameLogDirectories: z
    .array(z.string())
    .default(getDefaultGameLogDirectories()),
  waypoints: z.array(waypoint).default([]),
})

export type StoreSchema = z.infer<typeof storeSchema>

export const newStore = () =>
  new Store<StoreSchema>({
    schema: storeSchema,
    serialize: (value) =>
      JSON.stringify(
        value,
        (_, x) => (x instanceof RegExp ? x.toString().slice(1, -1) : x),
        '\t'
      ),
  })

export const getActiveGameAccount = (store: Store<StoreSchema>) =>
  store
    .get<string, GameAccount[]>(STORE_KEYS.gameAccounts)
    .find(
      (x) =>
        x.active &&
        new Date().getTime() < new Date(x.minecraftToken.NotAfter).getTime()
    ) || null

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
