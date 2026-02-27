import type { RouteLocationRaw } from 'vue-router'
import { valid as isValidSingleVersion } from 'semver'
import { splitPackageName } from '~/utils/package-name'

export function packageRoute(
  packageName: string,
  version?: string | null,
  hash?: string,
): RouteLocationRaw {
  const { org, name } = splitPackageName(packageName)

  if (version) {
    if (isValidSingleVersion(version)) {
      return {
        name: 'package-version',
        params: {
          org,
          name,
          version,
        },
      }
    }

    // If we have a version param but it isn't a *specific, single version* (e.g. 1.2.3), treat it
    // as a semver specifier (e.g. ^1.2.3 or * or 3||4 or >3<=5) and route to the package page with
    // the semver query param, which will pre-populate the version selector and show matching versions.
    return {
      name: 'package',
      params: {
        org,
        name,
      },
      query: { semver: version },
      hash: hash ?? '#versions',
    }
  }

  return {
    name: 'package',
    params: {
      org,
      name,
    },
  }
}

/** Full version history page (`/package/.../versions`) */
export function packageVersionsRoute(packageName: string): RouteLocationRaw {
  const [org, name = ''] = packageName.startsWith('@') ? packageName.split('/') : ['', packageName]
  return { name: 'package-versions', params: { org, name } }
}

export function diffRoute(
  packageName: string,
  fromVersion: string,
  toVersion: string,
): RouteLocationRaw {
  const { org, name } = splitPackageName(packageName)

  return {
    name: 'diff',
    params: {
      org: org || undefined,
      packageName: name,
      versionRange: `${fromVersion}...${toVersion}`,
    },
  }
}
