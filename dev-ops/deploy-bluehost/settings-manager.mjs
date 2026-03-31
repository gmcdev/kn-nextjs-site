import { existsSync, readFileSync, writeFileSync, rmSync } from 'fs'

import * as c from './consts.mjs'

export function loadSettings() {
  if (existsSync(c.DEPLOY_SETTINGS_PATH)) {
    return JSON.parse(readFileSync(c.DEPLOY_SETTINGS_PATH))
  }
}

export function saveSettings(settings) {
  writeFileSync(c.DEPLOY_SETTINGS_PATH, JSON.stringify(settings))
}

export function invalidateCache() {
  if (existsSync(c.LOCAL_BUILD_PATH)) {
    console.log(` Removing ${c.LOCAL_BUILD_PATH}`)
    rmSync(c.LOCAL_BUILD_PATH, { recursive: true, force: true })
  }
  console.log(`Cache clean`)
}

export function markCacheInvalid() {
  const settings = loadSettings() || {}
  settings.invalidateCache = true
  saveSettings(settings)
}

export function markCacheValid() {
  const settings = loadSettings() || {}
  settings.invalidateCache = false
  saveSettings(settings)
}

export function isCacheInvalid() {
  if (process.env.FORCE_CLEAN === 'true') {
    return true
  }
  const settings = loadSettings() || {}
  return Boolean(settings.invalidateCache)
}
