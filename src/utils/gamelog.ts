import fs from 'fs'
import { glob } from 'glob'
import os from 'os'
import path from 'path'
import split2 from 'split2'
import stream from 'stream'
import { Tail } from 'tail'
import zlib from 'zlib'
import { GameAnalyticsPattern } from '../constants'
import type { GameLog, GameLogLine } from '../types'

export interface GameLogContext {
  serverName: string
  userName: string
  files: GameLog[]
  tail: Tail[]
  cycle: number
}

const vanillaTimestamp = /^\[(\d\d:\d\d:\d\d)\]/
const lunarTimestamp = /^\[(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.\d\d\d)\]/
const dateFilename = /^(\d\d\d\d-\d\d-\d\d)-\d\.log\.gz/

const connectingTo = /Connecting to (\S+),/
const settingUser = /Setting user: (\S+)/

const contentDelimiter = ': '
const activeGameLogMaxLastModified = 10 * 60 * 1000

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

export function getDefaultGameLogDirectories() {
  const paths: string[] = []

  switch (os.platform()) {
    case 'darwin':
      paths.push(
        `${process.env.HOME}/Library/Application Support/minecraft/logs`
      )
      paths.push(`${process.env.HOME}/.lunarclient/offline/multiver/logs`)
      paths.push('/Applications/MultiMC.app/Data/instances/*/.minecraft/logs')
      break
  }

  return paths
}

export function getDefaultAnalyticsPatterns(): GameAnalyticsPattern[] {
  return [
    {
      name: 'sold',
      pattern: /Successfully sold a container worth: \$([,\d]+.\d+)!/,
      valueIndex: 1,
    },
    {
      name: 'sold',
      pattern: /Sold \d+ item\(s\) for \$([,\d]+.\d+)!/,
      valueIndex: 1,
    },
    {
      name: 'deaths',
      pattern: /(\S+) has been killed by (\S+) with ([.\d]+) health left./,
      usernameIndex: 1,
    },
    {
      name: 'kills',
      pattern: /(\S+) has been killed by (\S+) with ([.\d]+) health left./,
      usernameIndex: 2,
    },
  ]
}

export async function findGameLogFiles(
  gameLogDirectories: string[],
  startDate?: Date,
  endDate?: Date
): Promise<GameLog[]> {
  const logFiles: string[] = []
  for (const dir of gameLogDirectories) {
    try {
      const pattern = path.join(dir, '*.{log,log.gz}')
      const files = await glob(pattern)
      logFiles.push(...files)
    } catch {
      continue
    }
  }

  const logFilesWithMtime: GameLog[] = []
  for (const path of logFiles) {
    logFilesWithMtime.push({
      path,
      mtimeMs: (await fs.promises.stat(path)).mtimeMs,
    })
  }
  logFilesWithMtime.sort((a, b) => a.mtimeMs - b.mtimeMs)
  const result = logFilesWithMtime.filter(
    (x) =>
      (!startDate || x.mtimeMs >= startDate.getTime()) &&
      (!endDate || x.mtimeMs <= endDate.getTime())
  )
  console.log('findGameLogFiles', startDate, endDate, result)
  return result
}

export async function readGameLogs(
  context: GameLogContext,
  gamelogs: GameLog[],
  callback: (lines: GameLogLine[]) => void
) {
  const handleGameLogLine = (line: string, path: string) => {
    const parsed = parseGameLogLine(context, line, path)
    if (!parsed) return
    callback([
      {
        userName: parsed.context.userName,
        serverName: parsed.context.serverName,
        content: parsed.content,
        timestamp: parsed.timestamp,
        source: path,
      },
    ])
  }

  resetGameLogContext(context, gamelogs)
  const myCycle = context.cycle
  const now = new Date()

  for (const gamelog of context.files) {
    if (context.cycle !== myCycle) return
    const isGzipped = gamelog.path.endsWith('.gz')
    await stream.promises.pipeline([
      fs.createReadStream(gamelog.path),
      ...(isGzipped ? [zlib.createGunzip()] : []),
      split2(),
      new stream.Transform({
        objectMode: true,
        transform(line, _, callback) {
          handleGameLogLine(line, gamelog.path)
          callback()
        },
      }),
    ])
    if (
      isGzipped ||
      now.getTime() - gamelog.mtimeMs > activeGameLogMaxLastModified
    )
      continue

    const tail = new Tail(gamelog.path, { fromBeginning: false, follow: true })
    tail.on('line', (line) => {
      if (context.cycle !== myCycle) return
      handleGameLogLine(line, gamelog.path)
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
  source: string,
  now = new Date()
) {
  const contentDelimiterIndex = line.indexOf(contentDelimiter)
  if (contentDelimiterIndex < 0) return
  const content = line.slice(contentDelimiterIndex + contentDelimiter.length)

  let timestamp: Date | undefined
  const vanillaTimestampMatch = line.match(vanillaTimestamp)
  if (vanillaTimestampMatch) {
    const dateFilenameMatch = path.basename(source).match(dateFilename)
    const day = dateFilenameMatch
      ? dateFilenameMatch[1]
      : new Date().toLocaleDateString()
    timestamp = new Date(`${day} ${vanillaTimestampMatch[1]}`)
  }
  const lunarTimestampMatch = line.match(lunarTimestamp)
  if (lunarTimestampMatch) {
    timestamp = new Date(lunarTimestampMatch[1])
  }
  if (!timestamp) {
    console.error('No timestamp found in line', line)
    timestamp = now
  }

  const connectingToMatch = content.match(connectingTo)
  if (connectingToMatch) context.serverName = connectingToMatch[1]

  const settingUserMatch = content.match(settingUser)
  if (settingUserMatch) context.userName = settingUserMatch[1]

  return { timestamp, content, context }
}
