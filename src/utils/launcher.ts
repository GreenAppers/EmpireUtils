import axios from 'axios'
import { spawn } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import pSettle from 'p-settle'
import { v4 as uuidv4 } from 'uuid'

import {
  fabricVersionDetails,
  GameInstall,
  LAUNCH_STATUS,
  mojangVersionDetails,
  parseLibraryName,
  updateVersionDetailsLibrary,
} from '../constants'
import { AuthProvider } from '../msal/AuthProvider'
import { getActiveGameAccount, Store, StoreSchema } from '../store'
import type { LaunchStatusMessage } from '../types'
import { loginToMinecraft } from './auth'
import {
  checkFileExists,
  download,
  downloadIfMissing,
  ensureDirectory,
} from './downloader'
import { setupIcon } from './icon'
import {
  allowRules,
  applyArgumentsTemplate,
  filterBlankArguments,
  getOsArch,
  getOsName,
} from './template'

const launchRunning: Record<string, GameInstall> = {}

export const getInstallsPath = () =>
  path.join(app.getPath('userData'), 'installs')

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
    install.path = path.join(getInstallsPath(), install.uuid)
  }
  await ensureDirectory(install.path)

  const versionDetailsFilename = getMinecraftVersionJsonPath(install)
  if (!(await checkFileExists(versionDetailsFilename))) {
    await download(install.versionManifest.url, versionDetailsFilename)
  }

  await setupIcon(install)
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
    for (const argument of fabricDetails.arguments.jvm) {
      versionDetails.arguments.jvm.push(argument)
    }
    for (const argument of fabricDetails.arguments.game) {
      versionDetails.arguments.game.push(argument)
    }
    versionDetails.mainClass = fabricDetails.mainClass
  }

  const modsPath = path.join(install.path, 'mods')
  for (const mod of install.mods ?? []) {
    const url = new URL(mod.url)
    downloadLibraries.push(() =>
      downloadIfMissing(
        mod.url,
        path.join(modsPath, path.basename(url.pathname))
      )
    )
    for (const [filePath, url] of Object.entries(mod.extraFiles ?? {})) {
      downloadLibraries.push(() =>
        downloadIfMissing(url, path.join(install.path, filePath))
      )
    }
  }

  const shaderpacksPath = path.join(install.path, 'shaderpacks')
  for (const shaderpack of install.shaderpacks ?? []) {
    const url = new URL(shaderpack.url)
    downloadLibraries.push(() =>
      downloadIfMissing(
        shaderpack.url,
        path.join(shaderpacksPath, path.basename(url.pathname))
      )
    )
  }

  await pSettle(downloadLibraries, { concurrency: 8 })
  return versionDetails
}

export async function launchInstall(
  launchId: string,
  install: GameInstall,
  authProvider: AuthProvider,
  store: Store<StoreSchema>,
  callback: (message: LaunchStatusMessage) => void
) {
  try {
    if (launchRunning[launchId]) {
      console.log(`Launch ${launchId} already running`)
      return
    }
    launchRunning[launchId] = install

    callback({ message: 'Updating install' })
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

    // Get acess token
    callback({ message: 'Authenticating' })
    try {
      let gameAccount = getActiveGameAccount(store)
      if (gameAccount) {
        callback({
          message: `Found cached account: ${gameAccount.profile.name}`,
        })
      } else {
        const microsoftAuth = await authProvider.login()
        gameAccount = await loginToMinecraft(microsoftAuth?.accessToken, store)
        callback({ message: `Logged in as: ${gameAccount.profile.name}` })
      }
      template.auth_access_token = gameAccount.yggdrasilToken.access_token
      template.auth_player_name = gameAccount.profile.name
      template.auth_uuid = gameAccount.profile.id
      template.user_type = 'msa'
    } catch (error) {
      callback({ message: 'Error authenticating: ' + error.toString() })
    }

    // Prepare Java classpath
    const appendClasspath = (path: string) =>
      (template.classpath += `${template.classpath.length ? ':' : ''}${path}`)
    for (const library of versionDetails.libraries) {
      if (!allowRules({ osName, osArch }, library.rules)) continue
      appendClasspath(path.join(librariesPath, library.downloads.artifact.path))
    }
    if (install.wrapMainClass)
      appendClasspath(
        path.join(
          librariesPath,
          'com/greenappers/empirelauncher/1.0.0/empirelauncher-1.0.0.jar'
        )
      )
    appendClasspath(getClientJarPath(versionDetails.id))

    // Prepare command line
    let command = [
      // '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home/bin/java',
      // '/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java',
      'java',
    ]
    applyArgumentsTemplate(
      { osName, osArch },
      versionDetails.arguments.jvm,
      template,
      command
    )
    if (install.wrapMainClass) {
      command.push('com.greenappers.empirelauncher.EmpireLauncher')
    } else {
      command.push(versionDetails.mainClass)
    }
    applyArgumentsTemplate(
      { osName, osArch },
      versionDetails.arguments.game,
      template,
      command
    )
    if (install.extraCommandlineArguments)
      command.push(...install.extraCommandlineArguments)
    command = filterBlankArguments(command)
    callback({ message: 'Launching install: ' + command.join(' ') })

    // Launch command line
    const child = spawn(command[0], command.slice(1), {
      cwd: install.path,
      env: {
        PATH: process.env.PATH,
        EMPIRELAUNCHER_MAIN_CLASS: versionDetails.mainClass,
      },
    })
    if (child.pid) callback({ processId: child.pid })
    child.stdout.on('data', (data) => callback({ message: data.toString() }))
    child.stderr.on('data', (data) => callback({ message: data.toString() }))
    child.on('error', (err: Error) => {
      throw new Error(`launch:${launchId} failed to start! ${err}`)
    })
    child.on('exit', (code: number) => {
      if (code === 0) {
        callback({
          message: `launch:${launchId} exited`,
          status: LAUNCH_STATUS.finished,
        })
      } else {
        callback({
          message: `launch:${launchId} exited with code ${code}`,
          status: LAUNCH_STATUS.finished,
        })
      }
    })
    callback({ message: `Complete: ${child.pid}` })
  } catch (error) {
    callback({ message: 'Error launching: ' + error.toString() })
    throw error
  } finally {
    delete launchRunning[launchId]
  }
}
