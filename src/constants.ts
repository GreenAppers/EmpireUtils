import type { StoreSchema } from './types'

export const clipboardTextUpdatedChannel = 'clipboard-text-updated'
export const electronStoreGet = 'electron-store-get'
export const electronStoreSet = 'electron-store-set'
export const openBrowserWindowChannel = 'open-browser-window'
export const openFileDialogChannel = 'open-file-dialog'
export const getLogfilePathChannel = 'get-logfile-path'
export const readGameLogsChannel = 'read-game-logs'

export const STORE_KEYS: { [key: string]: keyof StoreSchema } = {
  gameLogDirectories: 'gameLogDirectories',
}
