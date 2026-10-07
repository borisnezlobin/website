export const ASSET_BASE = '/paint'

export function assetUrl(path: string): string {
  return `${ASSET_BASE}${path}`
}
