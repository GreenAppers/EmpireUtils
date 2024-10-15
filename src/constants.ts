export const clipboardTextUpdatedChannel = 'clipboard-text-updated'
export const openBrowserWindowChannel = 'open-browser-window'
export const getLogfilePathChannel = 'get-logfile-path'
export const findGameLogChannel = 'find-game-log'
export const openTailGameLogChannel = 'open-tail-game-log'
export const closeTailGameLogChannel = 'close-tail-game-log'
export const tailGameLogChannel = (path: string) => `tail-game-log-${path}`
