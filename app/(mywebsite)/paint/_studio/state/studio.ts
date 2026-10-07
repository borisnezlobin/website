import { defaultInkSettings, type InkSettings, type SmudgeStroke } from '../engine/ink'
import { defaultKnifeSettings, type KnifeSettings } from '../engine/knife'
import type { LoadedPhoto } from '../lib/imageSource'
import type { EffectId, RenderSettings } from '../worker/protocol'
import { editKey, emptyHistory, recordEdit, sameSnapshot, stepBack, stepForward, type EditHistory, type EditSnapshot, type Restored } from './history'

export type Scope = 'subject' | 'whole'
export type MaskStatus = 'idle' | 'finding' | 'ready' | 'failed'

export interface RenderedImage {
  pixels: Uint8ClampedArray
  width: number
  height: number
  milliseconds: number
  photo: LoadedPhoto
  job: RenderSettings
  mask: Float32Array
}

export interface RenderState {
  status: 'idle' | 'rendering' | 'error'
  fraction: number
  stage: string
  message?: string
}

export function scopeOf(state: StudioState): Scope {
  return state.scopes[state.effect]
}

export interface StudioState {
  photo: LoadedPhoto | null
  mask: Float32Array | null
  maskStatus: MaskStatus
  maskProgress: number
  scopes: Record<EffectId, Scope>
  effect: EffectId
  knife: KnifeSettings
  ink: InkSettings
  result: RenderedImage | null
  render: RenderState
  renderRevision: number
  history: EditHistory
  loadingPhoto: boolean
}

export type EditAction =
  | { type: 'scopeChanged'; scope: Scope }
  | { type: 'effectChanged'; effect: EffectId }
  | { type: 'knifeChanged'; changes: Partial<KnifeSettings> }
  | { type: 'inkChanged'; changes: Partial<InkSettings> }
  | { type: 'smudgeAdded'; stroke: SmudgeStroke }
  | { type: 'inkPicked'; color: [number, number, number] }
  | { type: 'inkRemoved'; index: number }
  | { type: 'smudgesCleared' }

export type StudioAction =
  | { type: 'photoLoading' }
  | { type: 'photoLoaded'; photo: LoadedPhoto; mask: Float32Array | null }
  | { type: 'photoCleared' }
  | { type: 'maskFinding'; photo: LoadedPhoto; progress: number }
  | { type: 'maskFound'; photo: LoadedPhoto; mask: Float32Array }
  | { type: 'maskFailed'; photo: LoadedPhoto; message: string }
  | { type: 'edited'; edit: EditAction; at: number }
  | { type: 'undone' }
  | { type: 'redone' }
  | { type: 'renderInvalidated'; revision: number }
  | { type: 'renderStarted'; revision: number }
  | { type: 'renderProgress'; revision: number; fraction: number; stage: string }
  | { type: 'renderFinished'; revision: number; result: RenderedImage }
  | { type: 'loadFailed'; message: string }
  | { type: 'renderFailed'; revision: number; message: string }

export const initialStudioState: StudioState = {
  photo: null,
  mask: null,
  maskStatus: 'idle',
  maskProgress: 0,
  scopes: { knife: 'subject', ink: 'whole' },
  effect: 'knife',
  knife: defaultKnifeSettings,
  ink: defaultInkSettings,
  result: null,
  render: { status: 'idle', fraction: 0, stage: '' },
  renderRevision: 0,
  history: emptyHistory,
  loadingPhoto: false,
}

type EditHandler<K extends EditAction['type']> = (state: StudioState, edit: Extract<EditAction, { type: K }>) => StudioState

const editHandlers: { [K in EditAction['type']]: EditHandler<K> } = {
  scopeChanged: (state, { scope }) => ({ ...state, scopes: { ...state.scopes, [state.effect]: scope } }),
  effectChanged: (state, { effect }) => ({ ...state, effect }),
  knifeChanged: (state, { changes }) => ({ ...state, knife: { ...state.knife, ...changes } }),
  inkChanged: (state, { changes }) => ({ ...state, ink: { ...state.ink, ...changes } }),
  smudgeAdded: (state, { stroke }) => ({ ...state, ink: { ...state.ink, smudges: [...state.ink.smudges, stroke] } }),
  smudgesCleared: (state) => ({ ...state, ink: { ...state.ink, smudges: [] } }),
  inkPicked: (state, { color }) => ({ ...state, ink: { ...state.ink, wetColors: [...state.ink.wetColors, color].slice(-6) } }),
  inkRemoved: (state, { index }) => ({ ...state, ink: { ...state.ink, wetColors: state.ink.wetColors.filter((_, i) => i !== index) } }),
}

function applyEdit(state: StudioState, edit: EditAction): StudioState {
  const handler = editHandlers[edit.type] as EditHandler<typeof edit.type>
  return handler(state, edit as never)
}

function snapshotOf(state: StudioState): EditSnapshot {
  return { effect: state.effect, scopes: state.scopes, knife: state.knife, ink: state.ink }
}

function restore(state: StudioState, restored: Restored | null): StudioState {
  return restored ? { ...state, ...restored.snapshot, history: restored.history } : state
}

type Handler<K extends StudioAction['type']> = (state: StudioState, action: Extract<StudioAction, { type: K }>) => StudioState

const handlers: { [K in StudioAction['type']]: Handler<K> } = {
  photoLoaded: (state, { photo, mask }) => ({
    ...state,
    photo,
    mask,
    maskStatus: mask ? 'ready' : 'idle',
    maskProgress: 0,
    render: { status: 'idle', fraction: 0, stage: '' },
    ink: { ...state.ink, smudges: [], wetColors: [] },
    result: null,
    history: emptyHistory,
    loadingPhoto: false,
  }),
  photoLoading: (state) => ({ ...state, loadingPhoto: true }),
  photoCleared: (state) => ({ ...state, photo: null, mask: null, maskStatus: 'idle', result: null, render: { status: 'idle', fraction: 0, stage: '' }, history: emptyHistory, loadingPhoto: false }),
  maskFinding: (state, { photo, progress }) => (state.photo === photo ? { ...state, maskStatus: 'finding', maskProgress: progress } : state),
  maskFound: (state, { photo, mask }) => (state.photo === photo && mask.length === photo.image.width * photo.image.height ? { ...state, mask, maskStatus: 'ready', maskProgress: 1 } : state),
  maskFailed: (state, { photo, message }) => (state.photo === photo ? { ...state, maskStatus: 'failed', render: { ...state.render, status: 'error', message } } : state),
  edited: (state, { edit, at }) => {
    const before = snapshotOf(state)
    const after = applyEdit(state, edit)
    return sameSnapshot(before, snapshotOf(after)) ? state : { ...after, history: recordEdit(state.history, before, editKey(edit), at) }
  },
  undone: (state) => restore(state, stepBack(state.history, snapshotOf(state))),
  redone: (state) => restore(state, stepForward(state.history, snapshotOf(state))),
  renderInvalidated: (state, { revision }) => ({ ...state, renderRevision: revision }),
  renderStarted: (state, { revision }) => ({ ...state, renderRevision: revision, render: { status: 'rendering', fraction: 0, stage: 'Starting' } }),
  renderProgress: (state, { revision, fraction, stage }) => (revision === state.renderRevision ? { ...state, render: { status: 'rendering', fraction, stage } } : state),
  renderFinished: (state, { revision, result }) =>
    revision === state.renderRevision && state.photo === result.photo ? { ...state, result, render: { status: 'idle', fraction: 1, stage: '' } } : state,
  loadFailed: (state, { message }) => ({ ...state, loadingPhoto: false, render: { status: 'error', fraction: 0, stage: '', message } }),
  renderFailed: (state, { revision, message }) => (revision === state.renderRevision ? { ...state, render: { status: 'error', fraction: 0, stage: '', message } } : state),
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  const handler = handlers[action.type] as Handler<typeof action.type>
  return handler(state, action as never)
}
