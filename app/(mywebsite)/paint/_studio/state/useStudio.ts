import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { InkSettings, SmudgeStroke } from '../engine/ink'
import type { FaceShape, KnifeSettings } from '../engine/knife'
import { fullMask, loadPhoto, loadPhotoFromUrl, type LoadedPhoto } from '../lib/imageSource'
import { RenderCancelled, RenderClient } from '../lib/renderClient'
import { findFaces } from '../lib/faceLandmarks'
import { findSubject, warmUpSubjectFinder } from '../lib/segmentation'
import type { EffectId, RenderSettings } from '../worker/protocol'
import { initialStudioState, scopeOf, studioReducer, type EditAction, type MaskStatus, type Scope, type StudioState } from './studio'

const RENDER_DELAY_MS = 220

export interface Sample {
  id: string
  name: string
  photoUrl: string
}

interface FoundFaces {
  photo: LoadedPhoto
  faces: FaceShape[]
}

function useFaces(photo: LoadedPhoto | null, wanted: boolean): FaceShape[] | null {
  const [found, setFound] = useState<FoundFaces | null>(null)
  const started = useRef<LoadedPhoto | null>(null)
  useEffect(() => {
    if (!photo || !wanted || started.current === photo) return
    started.current = photo
    findFaces(photo.image)
      .then((faces) => setFound({ photo, faces }))
      .catch(() => setFound({ photo, faces: [] }))
  }, [photo, wanted])
  if (!photo) return null
  return found?.photo === photo ? found.faces : null
}

const SAMPLE_ATTEMPTS = 3
const RETRY_DELAY_MS = 700

async function withRetries<T>(load: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await load()
    } catch (error) {
      if (attempt >= SAMPLE_ATTEMPTS) throw error
      console.warn(`Sample load attempt ${attempt} failed, retrying`, error)
      await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }
  }
}

async function loadSample(sample: Sample): Promise<{ photo: LoadedPhoto; mask: Float32Array | null }> {
  return { photo: await loadPhotoFromUrl(sample.photoUrl, sample.name), mask: null }
}

function jobFor(effect: EffectId, knife: KnifeSettings, ink: InkSettings): RenderSettings {
  return effect === 'knife' ? { effect: 'knife', settings: knife } : { effect: 'ink', settings: ink }
}

function maskFor(photo: LoadedPhoto | null, scope: Scope, maskStatus: MaskStatus, mask: Float32Array | null): Float32Array | null {
  if (!photo) return null
  if (scope === 'whole') return fullMask(photo.image)
  return maskStatus === 'ready' ? mask : null
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function isResultCurrent(state: StudioState, job: RenderSettings, mask: Float32Array | null): boolean {
  const { result } = state
  return result !== null && result.photo === state.photo && result.job === job && result.mask === mask
}

function useSubjectFinder(state: StudioState, dispatch: (action: Parameters<typeof studioReducer>[1]) => void) {
  const started = useRef<LoadedPhoto | null>(null)
  const { photo, maskStatus } = state
  const scope = scopeOf(state)
  useEffect(() => {
    if (!photo || scope !== 'subject' || maskStatus !== 'idle' || started.current === photo) return
    started.current = photo
    dispatch({ type: 'maskFinding', photo, progress: 0 })
    findSubject(photo.image, (progress) => dispatch({ type: 'maskFinding', photo, progress }))
      .then((mask) => dispatch({ type: 'maskFound', photo, mask }))
      .catch((error) => dispatch({ type: 'maskFailed', photo, message: `Couldn’t find the subject: ${errorMessage(error)}` }))
  }, [photo, scope, maskStatus, dispatch])
}

const WARM_UP_DELAY_MS = 2500

function useWarmSubjectFinder(): void {
  useEffect(() => {
    const timer = window.setTimeout(() => void warmUpSubjectFinder(), WARM_UP_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])
}

export function useStudio() {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState)
  const client = useMemo(() => new RenderClient(), [])
  const loadGeneration = useRef(0)
  const renderRevision = useRef(0)
  const nextRevision = useCallback(() => ++renderRevision.current, [])
  useSubjectFinder(state, dispatch)
  useWarmSubjectFinder()

  const currentScope = scopeOf(state)
  const mask = useMemo(() => maskFor(state.photo, currentScope, state.maskStatus, state.mask), [state.photo, currentScope, state.maskStatus, state.mask])
  const job = useMemo(() => jobFor(state.effect, state.knife, state.ink), [state.effect, state.knife, state.ink])
  const faces = useFaces(state.photo, state.effect === 'knife')
  const waitingForFaces = state.effect === 'knife' && faces === null

  useEffect(() => {
    const photo = state.photo
    if (!photo || !mask || waitingForFaces) return
    const timer = window.setTimeout(() => {
      const revision = nextRevision()
      dispatch({ type: 'renderStarted', revision })
      client
        .render(photo.image, mask, job, { onProgress: (fraction, stage) => dispatch({ type: 'renderProgress', revision, fraction, stage }) }, faces ?? [])
        .then((outcome) => dispatch({ type: 'renderFinished', revision, result: { ...outcome, width: photo.image.width, height: photo.image.height, photo, job, mask } }))
        .catch((error) => {
          if (!(error instanceof RenderCancelled)) dispatch({ type: 'renderFailed', revision, message: errorMessage(error) })
        })
    }, RENDER_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      client.cancel()
      dispatch({ type: 'renderInvalidated', revision: nextRevision() })
    }
  }, [client, state.photo, mask, job, nextRevision, faces, waitingForFaces])

  const edit = useCallback((change: EditAction) => dispatch({ type: 'edited', edit: change, at: Date.now() }), [])

  const openPhoto = useCallback(async (load: () => Promise<{ photo: LoadedPhoto; mask: Float32Array | null }>, failure: string) => {
    const generation = ++loadGeneration.current
    dispatch({ type: 'photoLoading' })
    try {
      const { photo, mask: loadedMask } = await load()
      if (generation === loadGeneration.current) dispatch({ type: 'photoLoaded', photo, mask: loadedMask })
    } catch (error) {
      console.warn(failure, error)
      if (generation === loadGeneration.current) dispatch({ type: 'loadFailed', message: failure })
    }
  }, [])

  const openFile = useCallback(
    (file: File) => openPhoto(async () => ({ photo: await loadPhoto(file, file.name), mask: null }), 'Unable to open that file. Choose a JPEG, PNG, WebP or HEIC photo.'),
    [openPhoto],
  )

  const openSample = useCallback(
    (sample: Sample) => openPhoto(() => withRetries(() => loadSample(sample)), 'Unable to load the sample. Check your connection and try again.'),
    [openPhoto],
  )

  return {
    state,
    resultIsCurrent: isResultCurrent(state, job, mask),
    findingFaces: waitingForFaces && state.photo !== null,
    openFile,
    openSample,
    clearPhoto: useCallback(() => {
      loadGeneration.current++
      dispatch({ type: 'photoCleared' })
    }, []),
    setScope: useCallback((scope: Scope) => edit({ type: 'scopeChanged', scope }), [edit]),
    setEffect: useCallback((effect: EffectId) => edit({ type: 'effectChanged', effect }), [edit]),
    updateKnife: useCallback((changes: Partial<KnifeSettings>) => edit({ type: 'knifeChanged', changes }), [edit]),
    updateInk: useCallback((changes: Partial<InkSettings>) => edit({ type: 'inkChanged', changes }), [edit]),
    pickInk: useCallback((color: [number, number, number]) => edit({ type: 'inkPicked', color }), [edit]),
    removeInk: useCallback((index: number) => edit({ type: 'inkRemoved', index }), [edit]),
    addSmudge: useCallback((stroke: SmudgeStroke) => edit({ type: 'smudgeAdded', stroke }), [edit]),
    clearSmudges: useCallback(() => edit({ type: 'smudgesCleared' }), [edit]),
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    undo: useCallback(() => dispatch({ type: 'undone' }), []),
    redo: useCallback(() => dispatch({ type: 'redone' }), []),
  }
}

export type Studio = ReturnType<typeof useStudio>
