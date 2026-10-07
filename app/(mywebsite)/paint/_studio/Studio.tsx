"use client"

import { GithubLogo, ImageSquare, UserFocus, WarningCircle } from '@phosphor-icons/react'
import { useState, type DragEvent } from 'react'
import { Button } from './components/Button'
import { EffectPicker } from './components/EffectPicker'
import { InkControls, type InkTool } from './components/InkControls'
import { KnifeControls } from './components/KnifeControls'
import { PhotoBar } from './components/PhotoBar'
import { UploadPrompt } from './components/UploadPrompt'
import { Segmented } from './components/Segmented'
import { Stage, type StageTool } from './components/Stage'
import { encodePng } from './lib/imageSource'
import { useUndoShortcuts } from './lib/useUndoShortcuts'
import { isSample, SAMPLES } from './samples'
import { scopeOf, type Scope, type StudioState } from './state/studio'
import { useStudio, type Studio } from './state/useStudio'
import type { EffectId } from './worker/protocol'

const SCOPES = [
  { value: 'subject' as Scope, label: 'Just the subject', icon: <UserFocus size={18} weight="bold" /> },
  { value: 'whole' as Scope, label: 'Whole photo', icon: <ImageSquare size={18} weight="bold" /> },
]

function subjectFinderLabel(progress: number): string {
  if (progress >= 1) return 'Finding the subject'
  if (progress <= 0) return 'Getting the subject finder ready'
  return `Downloading the subject finder, ${Math.round(progress * 100)}%`
}

function busyLabelFor(state: StudioState, findingFaces: boolean): string | null {
  if (!state.photo) return null
  if (findingFaces) return 'Finding faces'
  if (scopeOf(state) === 'subject' && state.maskStatus === 'finding') return subjectFinderLabel(state.maskProgress)
  return null
}

async function download(state: StudioState): Promise<void> {
  if (!state.result || !state.photo) return
  const blob = await encodePng(state.result.pixels, state.result.width, state.result.height)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${state.photo.name.replace(/\.[^.]+$/, '')}-${state.effect === 'knife' ? 'palette-knife' : 'smear-bleed'}.png`
  link.click()
  URL.revokeObjectURL(link.href)
}

function useFileDrop(onFile: (file: File) => void) {
  const [dragging, setDragging] = useState(false)
  return {
    dragging,
    handlers: {
      onDragOver: (event: DragEvent) => {
        event.preventDefault()
        setDragging(true)
      },
      onDragLeave: (event: DragEvent) => {
        if (event.currentTarget === event.target) setDragging(false)
      },
      onDrop: (event: DragEvent) => {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files[0]
        if (file) onFile(file)
      },
    },
  }
}

function stageToolFor(studio: Studio, inkTool: InkTool, fingerRadius: number): StageTool {
  if (studio.state.effect !== 'ink' || inkTool === 'none') return { kind: 'none' }
  if (inkTool === 'pick') return { kind: 'pick', onPick: studio.pickInk }
  return { kind: 'smear', radius: fingerRadius, onStroke: studio.addSmudge }
}

export function Studio() {
  const studio = useStudio()
  const { state } = studio
  const [comparing, setComparing] = useState(false)
  const [inkTool, setInkTool] = useState<InkTool>('none')
  const [fingerRadius, setFingerRadius] = useState(36)
  const drop = useFileDrop(studio.openFile)
  useUndoShortcuts(studio.undo, studio.redo)

  const changeEffect = (effect: EffectId) => {
    studio.setEffect(effect)
    setInkTool('none')
    const showingSample = !state.photo || isSample(state.photo.name)
    if (!showingSample) return
    const sample = SAMPLES[effect][0]
    if (sample) void studio.openSample(sample)
    else studio.clearPhoto()
  }

  const isolated = scopeOf(state) === 'subject'
  const longSide = state.photo ? Math.max(state.photo.image.width, state.photo.image.height) : 1000

  return (
    <div className="grid min-h-[calc(100dvh-3rem)] grid-cols-1 grid-rows-[auto_auto] lg:h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(0,1fr)_25rem] lg:grid-rows-1" {...drop.handlers}>
      <main className="relative flex h-[70dvh] min-h-[26rem] flex-col gap-4 pt-5 lg:h-auto lg:min-h-0">
        <header className="flex flex-col gap-4 px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-3xl md:text-4xl [text-wrap:balance]">Wet Paint</h1>
            <SourceLink />
          </div>
          <PhotoBar
            samples={SAMPLES[state.effect]}
            currentName={state.photo?.name ?? null}
            comparing={comparing}
            canDownload={studio.resultIsCurrent}
            onOpenFile={studio.openFile}
            onOpenSample={(sample) => void studio.openSample(sample)}
            onToggleCompare={() => setComparing((value) => !value)}
            onDownload={() => void download(state)}
            hasPhoto={state.photo !== null}
            history={{ canUndo: studio.canUndo, canRedo: studio.canRedo, onUndo: studio.undo, onRedo: studio.redo }}
          />
        </header>
        <section aria-label="Painting" className="relative min-h-0 flex-1">
          {!state.photo && <UploadPrompt loading={state.loadingPhoto} onOpenFile={studio.openFile} />}
          {state.photo && (
            <Stage
              original={state.photo.image}
              result={state.result}
              resultIsCurrent={studio.resultIsCurrent}
              render={state.render}
              busyLabel={busyLabelFor(state, studio.findingFaces)}
              comparing={comparing}
              tool={stageToolFor(studio, inkTool, fingerRadius)}
            />
          )}
          {state.render.status === 'error' && (
            <ErrorNotice message={state.render.message ?? 'Unable to paint this photo. Try again.'} onUseWholePhoto={state.maskStatus === 'failed' ? () => studio.setScope('whole') : null} />
          )}
          {drop.dragging && <DropOverlay />}
        </section>
      </main>
      <aside aria-label="Effect settings" className="flex flex-col gap-6 bg-[rgb(var(--paint-panel))] px-5 pt-6 pb-24 lg:overflow-y-auto lg:rounded-s-[var(--radius-stage)]">
        <EffectPicker value={state.effect} onChange={changeEffect} />
        <Segmented label="What to paint" options={SCOPES} value={scopeOf(state)} onChange={studio.setScope} />
        {state.effect === 'knife' ? (
          <KnifeControls settings={state.knife} imageLongSide={longSide} isolated={isolated} onChange={studio.updateKnife} />
        ) : (
          <InkControls
            settings={state.ink}
            imageLongSide={longSide}
            isolated={isolated}
            onChange={studio.updateInk}
            onRemoveInk={studio.removeInk}
            onClearSmudges={studio.clearSmudges}
            tool={{ active: inkTool, fingerRadius, onChange: setInkTool, onFingerRadius: setFingerRadius }}
          />
        )}
      </aside>
    </div>
  )
}

function ErrorNotice({ message, onUseWholePhoto }: { message: string; onUseWholePhoto: (() => void) | null }) {
  return (
    <div role="alert" className="absolute inset-x-6 bottom-6 flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] bg-[rgb(var(--paint-raised))] p-4 [box-shadow:var(--paint-shadow-raised)]">
      <WarningCircle size={22} weight="bold" className="text-[rgb(var(--paint-accent))]" />
      <p className="min-w-0 flex-1 text-sm text-[rgb(var(--paint-ink))]">{message}</p>
      {onUseWholePhoto && (
        <Button variant="primary" onClick={onUseWholePhoto}>
          Paint the whole photo instead
        </Button>
      )}
    </div>
  )
}

function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-4 grid place-items-center rounded-[var(--radius-stage)] bg-[rgb(var(--paint-surface)/0.8)] [box-shadow:inset_0_0_0_2px_var(--color-accent)] backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-[rgb(var(--paint-ink))]">
        <ImageSquare size={48} weight="duotone" />
        <span className="text-section">Drop to paint this photo</span>
      </div>
    </div>
  )
}

const SOURCE_URL = 'https://github.com/borisnezlobin/website/tree/main/app/(mywebsite)/paint/_studio'

function SourceLink() {
  return (
    <a href={SOURCE_URL} className="inline-flex items-center gap-2 text-caption hover:text-[rgb(var(--paint-ink))]">
      <GithubLogo size={16} weight="bold" />
      Source code, free under AGPL-3.0
    </a>
  )
}
