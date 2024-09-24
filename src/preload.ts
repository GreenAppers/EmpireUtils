// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron/renderer'
import { clipboardTextUpdatedChannel } from './constants'

export const api = {
  onClipboardTextUpdated: (callback: (text: string) => void) =>
    ipcRenderer.on(clipboardTextUpdatedChannel, (_event, value) =>
      callback(value)
    ),
  removeClipboardTextUpdatedListener: () => {
    ipcRenderer.removeAllListeners(clipboardTextUpdatedChannel)
  },
}

process.once('loaded', () => {
  contextBridge.exposeInMainWorld('api', api)
})
