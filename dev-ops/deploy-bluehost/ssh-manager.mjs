import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'

export async function prepareDestination(
  productionPath,
  nextDeployPath,
  { host, user, key, port }
) {
  console.log('Preparing destination')
  return new Promise((resolve, reject) => {
    execFile(
      'sh',
      [
        'prepare-destination.sh',
        '-u',
        `${user}@${host}`,
        '-k',
        key,
        '-p',
        port,
        '-s',
        productionPath,
        '-d',
        nextDeployPath,
      ],
      {
        cwd: dirname(fileURLToPath(import.meta.url)),
      },
      (err, stdout, stderr) => {
        console.log(`STDOUT\n${stdout}\nSTDERR\n${stderr}`)
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

export async function syncToDestination(
  sourcePath,
  nextDeployPath,
  { host, user, key, port }
) {
  console.log('Sync to destination')
  return new Promise((resolve, reject) => {
    execFile(
      'sh',
      [
        'sync-to-destination.sh',
        '-u',
        `${user}@${host}`,
        '-k',
        key,
        '-p',
        port,
        '-s',
        sourcePath,
        '-d',
        nextDeployPath,
      ],
      {
        cwd: dirname(fileURLToPath(import.meta.url)),
      },
      (err, stdout, stderr) => {
        console.log(`STDOUT\n${stdout}\nSTDERR\n${stderr}`)
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

export async function pruneStaleBackups(
  backupsPath,
  { host, user, key, port }
) {
  console.log('Pruning stale backups')
  return new Promise((resolve, reject) => {
    execFile(
      'sh',
      [
        'prune-stale-backups.sh',
        '-u',
        `${user}@${host}`,
        '-k',
        key,
        '-p',
        port,
        '-b',
        backupsPath,
      ],
      {
        cwd: dirname(fileURLToPath(import.meta.url)),
      },
      (err, stdout, stderr) => {
        console.log(`STDOUT\n${stdout}\nSTDERR\n${stderr}`)
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}
