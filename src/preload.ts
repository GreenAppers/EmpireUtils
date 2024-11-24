// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron/renderer'

import { CHANNELS, GameInstall, LAUNCH_CHANNEL } from './constants'
import type { GameLogLine, LaunchStatusMessage } from './types'

export type Listener<Args extends unknown[]> = (
  event: Electron.IpcRendererEvent,
  ...args: Args
) => void

export interface ListenHandle<Args extends unknown[]> {
  channel: string
  listener: Listener<Args>
}

export const api = {
  getLogfilePath: () => ipcRenderer.invoke(CHANNELS.getLogfilePath),
  createGameInstall: (gameInstall: GameInstall): Promise<GameInstall> =>
    ipcRenderer.invoke(CHANNELS.createGameInstall, gameInstall),
  deleteGameInstall: (gameInstall: GameInstall): Promise<boolean> =>
    ipcRenderer.invoke(CHANNELS.deleteGameInstall, gameInstall),
  launchGameInstall: (
    launchId: string,
    gameInstall: GameInstall,
    callback: (message: LaunchStatusMessage) => void
  ): ListenHandle<[LaunchStatusMessage]> => {
    ipcRenderer
      .invoke(CHANNELS.launchGameInstall, launchId, gameInstall)
      .catch((error) =>
        console.log(`${CHANNELS.launchGameInstall} error`, error)
      )
    const listener: Listener<[LaunchStatusMessage]> = (_event, message) =>
      callback(message)
    const channel = LAUNCH_CHANNEL(launchId)
    ipcRenderer.on(channel, listener)
    return { channel, listener }
  },
  loginToMicrosoftAccount: () =>
    ipcRenderer.send(CHANNELS.loginToMicrosoftAccount),
  openBrowserWindow: (url: string) =>
    ipcRenderer.send(CHANNELS.openBrowserWindow, url),
  openFileDialog: (path: string) =>
    ipcRenderer.invoke(CHANNELS.openFileDialog, path),
  onClipboardTextUpdated: (
    callback: (text: string) => void
  ): ListenHandle<[string]> => {
    const listener: Listener<[string]> = (_event, value) => callback(value)
    ipcRenderer.on(CHANNELS.clipboardTextUpdated, listener)
    return { channel: CHANNELS.clipboardTextUpdated, listener }
  },
  readGameLogs: (
    gameLogDirectories: string[],
    callback: (lines: GameLogLine[]) => void,
    beginDate?: Date,
    endDate?: Date
  ): ListenHandle<[GameLogLine[]]> => {
    ipcRenderer
      .invoke(CHANNELS.readGameLogs, gameLogDirectories, beginDate, endDate)
      .catch((error) => console.log(`${CHANNELS.readGameLogs} error`, error))
    const listener: Listener<[GameLogLine[]]> = (_event, lines) =>
      callback(lines)
    ipcRenderer.on(CHANNELS.readGameLogs, listener)
    return { channel: CHANNELS.readGameLogs, listener }
  },
  removeListener: <Args extends unknown[]>(handle: ListenHandle<Args>) => {
    if (handle.listener)
      ipcRenderer.removeListener(handle.channel, handle.listener)
    else ipcRenderer.removeAllListeners(handle.channel)
  },
  store: {
    get: (key: string) => ipcRenderer.invoke(CHANNELS.electronStoreGet, key),
    set: (key: string, value: unknown) =>
      ipcRenderer.send(CHANNELS.electronStoreSet, key, value),
  },
}

process.once('loaded', () => {
  contextBridge.exposeInMainWorld('api', api)
})
