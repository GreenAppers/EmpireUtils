// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron/renderer'
import {
  clipboardTextUpdatedChannel,
  electronStoreGet,
  electronStoreSet,
  getLogfilePathChannel,
  openBrowserWindowChannel,
  openFileDialogChannel,
  readGameLogsChannel,
} from './constants'

export type Listener<Args extends unknown[]> = (
  event: Electron.IpcRendererEvent,
  ...args: Args
) => void

export interface ListenHandle<Args extends unknown[]> {
  channel: string
  listener: Listener<Args>
}

export const api = {
  openBrowserWindow: (url: string) =>
    ipcRenderer.send(openBrowserWindowChannel, url),
  openFileDialog: (path: string) =>
    ipcRenderer.invoke(openFileDialogChannel, path),
  getLogfilePath: () => ipcRenderer.invoke(getLogfilePathChannel),
  onClipboardTextUpdated: (
    callback: (text: string) => void
  ): ListenHandle<[string]> => {
    const listener: Listener<[string]> = (_event, value) => callback(value)
    ipcRenderer.on(clipboardTextUpdatedChannel, listener)
    return { channel: clipboardTextUpdatedChannel, listener }
  },
  readGameLogs: (
    gameLogDirectories: string[],
    callback: (
      userName: string,
      serverName: string,
      content: string,
      timestamp: Date,
      source: string
    ) => void,
    beginDate?: Date,
    endDate?: Date
  ): ListenHandle<[string, string, string, Date, string]> => {
    ipcRenderer
      .invoke(readGameLogsChannel, gameLogDirectories, beginDate, endDate)
      .catch((error) => console.log(`${readGameLogsChannel} error`, error))
    const listener: Listener<[string, string, string, Date, string]> = (
      _event,
      userName,
      serverName,
      content,
      timestamp,
      source
    ) => callback(userName, serverName, content, timestamp, source)
    ipcRenderer.on(readGameLogsChannel, listener)
    return { channel: readGameLogsChannel, listener }
  },
  removeListener: <Args extends unknown[]>(handle: ListenHandle<Args>) => {
    if (handle.listener)
      ipcRenderer.removeListener(handle.channel, handle.listener)
    else ipcRenderer.removeAllListeners(handle.channel)
  },
  store: {
    get: (key: string) => ipcRenderer.sendSync(electronStoreGet, key),
    set: (key: string, value: unknown) =>
      ipcRenderer.send(electronStoreSet, key, value),
  },
}

process.once('loaded', () => {
  contextBridge.exposeInMainWorld('api', api)
})
