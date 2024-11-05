import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import pSettle from 'p-settle'
import { v4 as uuidv4 } from 'uuid'

import {
  GameInstall,
  MojangRule,
  MojangStringsTemplate,
  mojangVersionDetails,
} from '../constants'
import {
  checkFileExists,
  download,
  downloadIfMissing,
  ensureDirectory,
} from './downloader'

const launchRunning: Record<string, GameInstall> = {}

const getLibrariesPath = () => path.join(app.getPath('userData'), 'libraries')

const getOsArch = () => {
  switch (process.arch) {
    case 'ia32':
      return 'x86'
    default:
      return process.arch
  }
}

const getOsName = () => {
  switch (process.platform) {
    case 'win32':
      return 'windows'
    case 'darwin':
      return 'osx'
    case 'linux':
      return 'linux'
    default:
      return process.platform
  }
}

const allowRules = (
  context: { osName: string; osArch: string },
  rules?: MojangRule[]
) => {
  let include = true
  for (const rule of rules ?? []) {
    if (rule.action === 'allow') {
      if (!rule.os?.name || rule.os.name === context.osName) continue
      if (!rule.os?.arch || rule.os?.arch === context.osArch) continue
      include = false
      break
    }
  }
  return include
}

const replaceTemplateVariables = (
  input: string,
  values: Record<string, string>
) => input.replace(/\${(\w+)}/g, (match, key) => values[key] ?? match)

const applyArgumentsTemplate = (
  context: { osName: string; osArch: string },
  template: MojangStringsTemplate,
  values: Record<string, string>,
  output: string[]
) => {
  for (const argument of template) {
    if (typeof argument === 'string') {
      output.push(replaceTemplateVariables(argument, values))
      continue
    }
    if (!allowRules(context, argument.rules)) continue
    if (typeof argument.value === 'string')
      output.push(replaceTemplateVariables(argument.value, values))
    else
      output.push(
        ...argument.value.map((x) => replaceTemplateVariables(x, values))
      )
  }
  return output
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

  const versionJson = path.join(
    install.path,
    `${install.versionManifest.id}.json`
  )
  if (!(await checkFileExists(versionJson))) {
    await download(install.versionManifest.url, versionJson)
  }
}

export async function updateInstall(install: GameInstall) {
  await setupInstall(install)

  const versionDetailsFilename = path.join(
    install.path,
    `${install.versionManifest.id}.json`
  )
  const versionDetails = mojangVersionDetails.parse(
    JSON.parse(await fs.promises.readFile(versionDetailsFilename, 'utf-8'))
  )

  const librariesPath = getLibrariesPath()
  const downloadLibraries = []
  for (const library of versionDetails.libraries) {
    downloadLibraries.push(() =>
      downloadIfMissing(
        library.downloads.artifact.url,
        path.join(librariesPath, library.downloads.artifact.path),
        library.downloads.artifact.sha1
      )
    )
  }
  await pSettle(downloadLibraries, { concurrency: 8 })

  return versionDetails
}

export async function launchInstall(
  launchId: string,
  install: GameInstall,
  callback: (updated: string) => void
) {
  try {
    if (launchRunning[launchId]) {
      console.log('Launch already running')
      return
    }
    launchRunning[launchId] = install

    callback('Updating install')
    const versionDetails = await updateInstall(install)

    const osName = getOsName()
    const osArch = getOsArch()
    const librariesPath = getLibrariesPath()
    const template = {
      auth_player_name: '',
      version_name: install.versionManifest.id,
      game_directory: install.path,
      assets_root: '',
      assets_index_name: '',
      auth_uuid: '',
      auth_access_token: '',
      clientid: '',
      auth_xuid: '',
      user_type: '',
      version_type: '',
      natives_directory: '',
      launcher_name: 'Empire Utils',
      launcher_version: '1.0.0',
      classpath: '',
    }
    const appendClasspath = (path: string) =>
      (template.classpath += `${template.classpath.length ? ':' : ''}${path}`)
    for (const library of versionDetails.libraries) {
      if (!allowRules({ osName, osArch }, library.rules)) continue
      appendClasspath(path.join(librariesPath, library.downloads.artifact.path))
    }

    const command = ['java']
    applyArgumentsTemplate(
      { osName, osArch },
      versionDetails.arguments.game,
      template,
      command
    )
    applyArgumentsTemplate(
      { osName, osArch },
      versionDetails.arguments.jvm,
      template,
      command
    )
    command.push(versionDetails.mainClass)

    callback('Launching install: ' + command.join(' '))

    callback('Complete')
  } catch (error) {
    console.log('launchInstall error', error)
    throw error
  } finally {
    delete launchRunning[launchId]
  }
}
