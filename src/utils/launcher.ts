import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { v4 as uuidv4 } from 'uuid'

import { GameInstall } from '../constants'

const statFile = util.promisify(fs.stat)
const mkdir = util.promisify(fs.mkdir)

export async function ensureDirectory(path: string) {
  // Check if path exists
  let pathStat: fs.Stats | undefined
  try {
    pathStat = await statFile(path)
    if (pathStat.isDirectory()) return
  } catch {
    // pass
  }

  // Create path if it doesn't exist
  try {
    await mkdir(path, { recursive: true })
  } catch {
    throw new Error(`Failed to create directory: ${path}`)
  }

  // Verify path is a directory
  try {
    pathStat = await statFile(path)
  } catch {
    throw new Error(`Failed to open directory: ${path}`)
  }
  if (!pathStat?.isDirectory()) {
    throw new Error(`Path is not a directory: ${path}`)
  }
}

export async function setupInstall(install: GameInstall) {
  if (!install.name) {
    throw new Error('Install name is required')
  }

  if (!install.versionManifest) {
    throw new Error('Install version manifest is required')
  }

  if (!install.uuid) {
    install.uuid = uuidv4()
  }

  if (!install.path) {
    install.path = path.join(app.getPath('userData'), 'installs', install.uuid)
  }

  await ensureDirectory(install.path)
}

export async function updateInstall(install: GameInstall) {
  await setupInstall(install)
}

export async function launchInstall(install: GameInstall, callback: (updated: string) => void) {
  await updateInstall(install)
  console.log('launching install', install)
}
