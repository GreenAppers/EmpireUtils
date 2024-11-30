import { app } from 'electron'
import fs from 'fs'
import { glob } from 'glob'
import path from 'path'
import { BILINEAR, createICNS } from 'png2icons'
import UPNG from 'png2icons/lib/UPNG'
import Resize from 'png2icons/lib/resize3'
import { GameInstall } from '../constants'
import { checkFileExists, ensureDirectory, sha1File } from './downloader'

export const getInstallIconPath = (install: GameInstall) =>
  path.join(install.path, 'icon.png')

export async function getRandomIcon() {
  const icons = await glob(
    path.join(app.getAppPath(), 'images', 'icons', '*.png')
  )
  return icons[Math.floor(Math.random() * icons.length)]
}

export function resamplePNG(
  inputBuffer: Buffer,
  width: number,
  height: number
): Buffer {
  const decoded = UPNG.decode(inputBuffer)
  const input = {
    width: decoded.width,
    height: decoded.height,
    data: new Uint8Array(UPNG.toRGBA8(decoded)[0]),
  }
  const output = {
    width,
    height,
    data: new Uint8Array(width * height * 4),
  }
  Resize.bilinearInterpolation(input, output)
  return Buffer.from(UPNG.encode([output.data], width, height, 0, [], true))
}

export async function setupIcon(install: GameInstall) {
  const iconPath = getInstallIconPath(install)
  if (!(await checkFileExists(iconPath))) {
    await fs.promises.copyFile(
      await getRandomIcon(),
      getInstallIconPath(install)
    )
  }

  const iconHash = await sha1File(iconPath)
  const iconHashMatched = !!iconHash && iconHash === install.iconHash
  const fancymenuAssets = path.join(
    install.path,
    'config',
    'fancymenu',
    'assets'
  )
  const fancymenuIcon16 = path.join(fancymenuAssets, 'icon16.png')
  const fancymenuIcon32 = path.join(fancymenuAssets, 'icon32.png')
  const fancymenuIconIcns = path.join(fancymenuAssets, 'icon.icns')

  let iconBuffer: Buffer | undefined
  if (!iconHashMatched || !(await checkFileExists(fancymenuIcon16))) {
    if (!iconBuffer) iconBuffer = await fs.promises.readFile(iconPath)
    await ensureDirectory(fancymenuAssets)
    await fs.promises.writeFile(
      fancymenuIcon16,
      resamplePNG(iconBuffer, 16, 16)
    )
  }
  if (!iconHashMatched || !(await checkFileExists(fancymenuIcon32))) {
    if (!iconBuffer) iconBuffer = await fs.promises.readFile(iconPath)
    await ensureDirectory(fancymenuAssets)
    await fs.promises.writeFile(
      fancymenuIcon32,
      resamplePNG(iconBuffer, 32, 32)
    )
  }
  if (!iconHashMatched || !(await checkFileExists(fancymenuIconIcns))) {
    if (!iconBuffer) iconBuffer = await fs.promises.readFile(iconPath)
    await ensureDirectory(fancymenuAssets)
    const icnsBuffer = createICNS(iconBuffer, BILINEAR, 0)
    if (icnsBuffer) await fs.promises.writeFile(fancymenuIconIcns, icnsBuffer)
  }

  if (!iconHashMatched) {
    install.iconHash = iconHash
  }
}
