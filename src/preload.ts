// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron/renderer'
import {
  clipboardTextUpdatedChannel,
  getLogfilePathChannel,
  openBrowserWindowChannel,
} from './constants'

export const api = {
  getLogfilePath: () => ipcRenderer.invoke(getLogfilePathChannel),
  onClipboardTextUpdated: (callback: (text: string) => void) =>
    ipcRenderer.on(clipboardTextUpdatedChannel, (_event, value) =>
      callback(value)
    ),
  openBrowserWindow: (url: string) =>
    ipcRenderer.send(openBrowserWindowChannel, url),
  removeClipboardTextUpdatedListener: () => {
    ipcRenderer.removeAllListeners(clipboardTextUpdatedChannel)
  },
}

process.once('loaded', () => {
  contextBridge.exposeInMainWorld('api', api)
})
