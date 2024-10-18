import fs from 'fs'
import path from 'path'
import { Tail } from 'tail'
import type { GameLog } from '../types'

export interface GameLogContext {
  serverName: string
  userName: string
  files: GameLog[]
  tail: Tail[]
  cycle: number
}

const vanillaTimestamp = /^\[(\d\d:\d\d:\d\d)\]/
const lunarTimestamp = /^\[(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.\d\d\d)\]/

const connectingTo = /Connecting to (\S+),/
const settingUser = /Setting user: (\S+)/

const contentDelimiter = ': '

const gameLogDirectories = [
  `${process.env.HOME}/Library/Application Support/minecraft/logs`,
  `${process.env.HOME}/.lunarclient/logs/game`,
].filter((path) => {
  try {
    return fs.statSync(path).isDirectory()
  } catch {
    return false
  }
})

export const newGameLogContext = (): GameLogContext => ({
  serverName: '',
  userName: '',
  files: [],
  tail: [],
  cycle: 0,
})

export function resetGameLogContext(
  context: GameLogContext,
  files: GameLog[] = []
) {
  const tails = context.tail
  context.cycle++
  context.serverName = ''
  context.userName = ''
  context.files = files
  context.tail = []
  for (const tail of tails) tail.unwatch()
}

export async function findGameLogFiles(
  startDate?: Date,
  endDate?: Date
): Promise<GameLog[]> {
  const logFiles = gameLogDirectories.flatMap((dir) => {
    try {
      return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.log'))
        .map((file) => path.join(dir, file))
    } catch {
      return []
    }
  })
  const logFilesWithMtime: GameLog[] = logFiles.map((path) => ({
    path,
    mtimeMs: fs.statSync(path).mtimeMs,
  }))
  logFilesWithMtime.sort((a, b) => a.mtimeMs - b.mtimeMs)
  return logFilesWithMtime.filter(
    (x) =>
      (!startDate || x.mtimeMs >= startDate.getTime()) &&
      (!endDate || x.mtimeMs <= endDate.getTime())
  )
}

export async function readGameLogs(
  context: GameLogContext,
  gamelogs: GameLog[],
  callback: (context: GameLogContext, content: string, timestamp: Date, path: string) => void
) {
  resetGameLogContext(context, gamelogs)
  const myCycle = context.cycle
  for (const gamelog of context.files) {
    if (context.cycle !== myCycle) return
    const tail = new Tail(gamelog.path, { fromBeginning: true, follow: true })
    tail.on('line', (line) => {
      if (context.cycle !== myCycle) return
      const parsed = parseGameLogLine(context, line)
      if (parsed) callback(context, parsed.content, parsed.timestamp, gamelog.path)
    })
    tail.on('error', (error) => {
      console.error(`Error tailing ${gamelog.path}`, error)
    })
    context.tail.push(tail)
  }
}

export function parseGameLogLine(
  context: GameLogContext,
  line: string,
  now = new Date()
) {
  const vanillaTimestampMatch = line.match(vanillaTimestamp)
  let timestamp: Date
  if (vanillaTimestampMatch)
    timestamp = new Date(
      new Date().toLocaleDateString() + ' ' + vanillaTimestampMatch[1]
    )
  const lunarTimestampMatch = line.match(lunarTimestamp)
  if (lunarTimestampMatch) timestamp = new Date(lunarTimestampMatch[1])
  if (!timestamp) timestamp = now

  const contentDelimiterIndex = line.indexOf(contentDelimiter)
  if (contentDelimiterIndex < 0) return
  const content = line.slice(contentDelimiterIndex + contentDelimiter.length)

  const connectingToMatch = content.match(connectingTo)
  if (connectingToMatch) context.serverName = connectingToMatch[1]

  const settingUserMatch = content.match(settingUser)
  if (settingUserMatch) context.userName = settingUserMatch[1]

  return { timestamp, content, context }
}
