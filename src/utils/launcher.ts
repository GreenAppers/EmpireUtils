import { spawn } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import pSettle from 'p-settle'
import { v4 as uuidv4 } from 'uuid'

import {
  fabricVersionDetails,
  GameInstall,
  mojangVersionDetails,
  parseLibraryName,
  updateVersionDetailsLibrary,
} from '../constants'
import {
  checkFileExists,
  download,
  downloadIfMissing,
  ensureDirectory,
} from './downloader'
import {
  allowRules,
  applyArgumentsTemplate,
  filterBlankArguments,
  getOsArch,
  getOsName,
} from './template'
import axios from 'axios'

const launchRunning: Record<string, GameInstall> = {}

export const getLibrariesPath = () =>
  path.join(app.getPath('userData'), 'libraries')

export const getClientJarPath = (version: string) =>
  path.join(
    getLibrariesPath(),
    `com/mojang/minecraft/${version}/minecraft-${version}-client.jar`
  )

export const getMinecraftVersionJsonPath = (install: GameInstall) =>
  path.join(install.path, `${install.versionManifest.id}.json`)

export const getFabricVersionJsonPath = (install: GameInstall) =>
  path.join(install.path, `fabric-${install.fabricLoaderVersion}.json`)

export async function setupFabricInstall(install: GameInstall) {
  if (!(await checkFileExists(getFabricVersionJsonPath(install)))) {
    const loaders = await axios.get(
      `https://meta.fabricmc.net/v2/versions/loader/${install.versionManifest.id}/`
    )
    install.fabricLoaderVersion = loaders.data[0].loader.version
    await download(
      `https://meta.fabricmc.net/v2/versions/loader/${install.versionManifest.id}/${install.fabricLoaderVersion}/profile/json`,
      getFabricVersionJsonPath(install)
    )
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

  const versionDetailsFilename = getMinecraftVersionJsonPath(install)
  if (!(await checkFileExists(versionDetailsFilename))) {
    await download(install.versionManifest.url, versionDetailsFilename)
  }

  if (install.fabricLoaderVersion) await setupFabricInstall(install)
}

export async function updateInstall(install: GameInstall) {
  await setupInstall(install)

  const versionDetailsFilename = getMinecraftVersionJsonPath(install)
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
  downloadLibraries.push(() =>
    downloadIfMissing(
      versionDetails.downloads.client.url,
      getClientJarPath(versionDetails.id),
      versionDetails.downloads.client.sha1
    )
  )

  if (install.fabricLoaderVersion) {
    const fabricDetailsFilename = getFabricVersionJsonPath(install)
    const fabricDetails = fabricVersionDetails.parse(
      JSON.parse(await fs.promises.readFile(fabricDetailsFilename, 'utf-8'))
    )
    for (const library of fabricDetails.libraries) {
      const { jarOrg, jarName, jarVersion } = parseLibraryName(library.name)
      const jarPath = path.join(
        `${jarOrg.replaceAll('.', '/')}/${jarName}/${jarVersion}`,
        `${jarName}-${jarVersion}.jar`
      )
      const url = library.url + jarPath
      updateVersionDetailsLibrary(versionDetails, {
        name: library.name,
        downloads: {
          artifact: {
            path: jarPath,
            sha1: '',
            size: 0,
            url,
          },
        },
      })
      downloadLibraries.push(() =>
        downloadIfMissing(url, path.join(librariesPath, jarPath))
      )
    }
    // https://github.com/FabricMC/fabric/releases/download/0.107.0%2B1.21.3/fabric-api-0.107.0+1.21.3.jar
    for (const argument of fabricDetails.arguments.jvm) {
      versionDetails.arguments.jvm.push(argument)
    }
    for (const argument of fabricDetails.arguments.game) {
      versionDetails.arguments.game.push(argument)
    }
    versionDetails.mainClass = fabricDetails.mainClass
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

    const osArch = getOsArch()
    const osName = getOsName()
    const librariesPath = getLibrariesPath()
    const template = {
      auth_player_name: '',
      version_name: install.versionManifest.id,
      game_directory: install.path,
      assets_root: '',
      assets_index_name: '1.21',
      auth_uuid: '',
      auth_access_token: '0',
      clientid: '',
      auth_xuid: '',
      user_type: '',
      version_type: '',
      natives_directory: path.join(install.path, 'natives'),
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
    appendClasspath(getClientJarPath(versionDetails.id))

    let command = ['java']
    applyArgumentsTemplate(
      { osName, osArch },
      versionDetails.arguments.jvm,
      template,
      command
    )
    command.push(versionDetails.mainClass)
    applyArgumentsTemplate(
      { osName, osArch },
      versionDetails.arguments.game,
      template,
      command
    )
    command = filterBlankArguments(command)
    callback('Launching install: ' + command.join(' '))

    const child = spawn(command[0], command.slice(1), {
      cwd: install.path,
    })
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('error', (err: Error) => {
      throw new Error(`launch:${launchId} failed to start! ${err}`)
    })
    child.on('exit', (code: number) => {
      if (code === 0) {
        console.info(`launch:${launchId} exited`)
      } else {
        console.info(`launch:${launchId} exited with code ${code}`)
      }
    })
    callback(`Complete: ${child.pid}`)
  } catch (error) {
    console.log('launchInstall error', error)
    throw error
  } finally {
    delete launchRunning[launchId]
  }
}
