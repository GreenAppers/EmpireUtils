// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron/renderer'
import {
  clipboardTextUpdatedChannel,
  closeTailGameLogChannel,
  findGameLogChannel,
  getLogfilePathChannel,
  openBrowserWindowChannel,
  openTailGameLogChannel,
  tailGameLogChannel,
} from './constants'
import type { GameLog } from './types'

export type StringListener = (
  event: Electron.IpcRendererEvent,
  value: string
) => void

export interface StringListenHandle {
  channel: string
  listener: StringListener
  tailGameLog?: string
}

export const api = {
  getLogfilePath: () => ipcRenderer.invoke(getLogfilePathChannel),
  onClipboardTextUpdated: (
    callback: (text: string) => void
  ): StringListenHandle => {
    const listener: StringListener = (_event, value) => callback(value)
    ipcRenderer.on(clipboardTextUpdatedChannel, listener)
    return { channel: clipboardTextUpdatedChannel, listener }
  },
  findGameLog: () =>
    ipcRenderer.invoke(findGameLogChannel) as Promise<GameLog[]>,
  onTailGameLog: (
    path: string,
    callback: (line: string) => void
  ): StringListenHandle => {
    ipcRenderer
      .invoke(openTailGameLogChannel, path)
      .catch((error) => console.log(`${openTailGameLogChannel} error`, error))
    const channel = tailGameLogChannel(path)
    const listener: StringListener = (_event, value) => callback(value)
    ipcRenderer.on(channel, listener)
    return { channel, listener, tailGameLog: path }
  },
  openBrowserWindow: (url: string) =>
    ipcRenderer.send(openBrowserWindowChannel, url),
  removeListener: (handle: StringListenHandle) => {
    if (handle.listener)
      ipcRenderer.removeListener(handle.channel, handle.listener)
    else ipcRenderer.removeAllListeners(handle.channel)
    if (handle.tailGameLog && ipcRenderer.listenerCount(handle.channel) === 0) {
      ipcRenderer.invoke(closeTailGameLogChannel)
    }
  },
}

process.once('loaded', () => {
  contextBridge.exposeInMainWorld('api', api)
})
