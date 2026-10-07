import type { InkSettings } from '../engine/ink'
import type { KnifeSettings } from '../engine/knife'
import type { EffectId } from '../worker/protocol'
import type { EditAction, Scope } from './studio'

export interface EditSnapshot {
  effect: EffectId
  scopes: Record<EffectId, Scope>
  knife: KnifeSettings
  ink: InkSettings
}

export interface EditHistory {
  past: EditSnapshot[]
  future: EditSnapshot[]
  lastKey: string | null
  lastAt: number
}

export const emptyHistory: EditHistory = { past: [], future: [], lastKey: null, lastAt: 0 }

const HISTORY_LIMIT = 100
const MERGE_WINDOW_MS = 800

function settingsKey(prefix: string, changes: object): string {
  return `${prefix}:${Object.keys(changes).sort().join(',')}`
}

export function editKey(edit: EditAction): string | null {
  if (edit.type === 'knifeChanged') return settingsKey('knife', edit.changes)
  if (edit.type === 'inkChanged') return settingsKey('ink', edit.changes)
  return null
}

export function sameSnapshot(a: EditSnapshot, b: EditSnapshot): boolean {
  return a.effect === b.effect && a.scopes === b.scopes && a.knife === b.knife && a.ink === b.ink
}

export function recordEdit(history: EditHistory, before: EditSnapshot, key: string | null, at: number): EditHistory {
  const merges = key !== null && key === history.lastKey && at - history.lastAt < MERGE_WINDOW_MS
  return {
    past: merges ? history.past : [...history.past, before].slice(-HISTORY_LIMIT),
    future: [],
    lastKey: key,
    lastAt: at,
  }
}

export interface Restored {
  history: EditHistory
  snapshot: EditSnapshot
}

export function stepBack(history: EditHistory, current: EditSnapshot): Restored | null {
  const snapshot = history.past.at(-1)
  if (!snapshot) return null
  return { snapshot, history: { past: history.past.slice(0, -1), future: [current, ...history.future], lastKey: null, lastAt: 0 } }
}

export function stepForward(history: EditHistory, current: EditSnapshot): Restored | null {
  const snapshot = history.future[0]
  if (!snapshot) return null
  return { snapshot, history: { past: [...history.past, current], future: history.future.slice(1), lastKey: null, lastAt: 0 } }
}
