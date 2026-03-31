import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import * as c from './consts.mjs'
import {
  markCacheInvalid,
  markCacheValid,
} from './settings-manager.mjs'
import * as sshManager from './ssh-manager.mjs'

const argv = yargs(hideBin(process.argv)).argv

const cmd = argv.c
const deployHost = argv.h
const deployUser = argv.u
const sshKeyName = argv.k
const sshPort = argv.s

async function deploy() {
  console.time('deploy')

  try {
    await sshManager.prepareDestination(null, c.BH_NEXT_DEPLOY_PATH, {
      host: deployHost,
      key: sshKeyName,
      port: sshPort,
      user: deployUser,
    })

    console.log('Syncing build with destination')
    await sshManager.syncToDestination(c.LOCAL_BUILD_PATH, c.BH_NEXT_DEPLOY_PATH, {
      host: deployHost,
      key: sshKeyName,
      port: sshPort,
      user: deployUser,
    })

    console.timeEnd('deploy')
    markCacheValid()
  } catch (err) {
    console.log(err)
    markCacheInvalid()
    throw new Error('Deploy failed')
  }
}

switch (cmd) {
  case 'deploy':
    await deploy()
    break
  case 'invalidate-cache':
    markCacheInvalid()
    break
}
