import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// remote paths
export const BH_DEPLOY_DIRECTORY = '/deployments'
export const BH_NEXT_DEPLOY_PATH = `${BH_DEPLOY_DIRECTORY}/next`
export const BH_BACKUPS_PATH = `${BH_DEPLOY_DIRECTORY}/backups`
export const BH_BROKEN_DEPLOY_PATH = `${BH_DEPLOY_DIRECTORY}/broken`
export const BH_PRODUCTION_PATH = '/public_html/site'
export const PRODUCTION_URL = 'https://kingnitram.com/site/'

// local paths
export const PROJECT_RELATIVE_PATH = `/../..`
export const PROJECT_ROOT = resolve(
  `${dirname(fileURLToPath(import.meta.url))}${PROJECT_RELATIVE_PATH}`
)
export const LOCAL_BUILD_DIRECTORY = 'out'
export const LOCAL_BUILD_PATH = `${PROJECT_ROOT}/${LOCAL_BUILD_DIRECTORY}`
export const DEPLOY_SETTINGS_FILE = 'deploy-settings.json'
export const DEPLOY_SETTINGS_PATH = `${PROJECT_ROOT}/${DEPLOY_SETTINGS_FILE}`
