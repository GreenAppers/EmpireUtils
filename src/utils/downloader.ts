import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export async function checkFileExists(path: string) {
  try {
    const stat = await fs.promises.stat(path)
    return stat.isFile()
  } catch {
    return false
  }
}

export async function sha1File(filePath: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      const stream = fs.createReadStream(filePath)
      const hash = crypto.createHash('sha1')
      stream.on('error', () => resolve(undefined))
      stream.on('data', (data) => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
    } catch (error) {
      resolve(undefined)
    }
  })
}

export async function ensureDirectory(path: string) {
  // Check if path exists
  let pathStat: fs.Stats | undefined
  try {
    pathStat = await fs.promises.stat(path)
    if (pathStat.isDirectory()) return
  } catch {
    // pass
  }

  // Create path if it doesn't exist
  try {
    await fs.promises.mkdir(path, { recursive: true })
  } catch {
    throw new Error(`Failed to create directory: ${path}`)
  }

  // Verify path is a directory
  try {
    pathStat = await fs.promises.stat(path)
  } catch {
    throw new Error(`Failed to open directory: ${path}`)
  }
  if (!pathStat?.isDirectory()) {
    throw new Error(`Path is not a directory: ${path}`)
  }
}

export async function download(url: string, dest: string) {
  const response = await axios.get(url, { responseType: 'stream' })
  const file = fs.createWriteStream(dest)
  response.data.pipe(file)
  return new Promise<void>((resolve, reject) => {
    file.on('finish', () => {
      file.close()
      resolve()
    })
    file.on('error', (err) => {
      fs.unlink(dest, () => reject(err))
    })
  })
}

export async function downloadIfMissing(
  url: string,
  dest: string,
  sha1?: string
) {
  // console.log('downloadIfMissing', url, dest, sha1)
  if (sha1) {
    if ((await sha1File(dest)) === sha1) return
  } else {
    if (await checkFileExists(dest)) return
  }
  await ensureDirectory(path.dirname(dest))
  await download(url, dest)
}
