import { ArrowClockwise, ArrowCounterClockwise, DownloadSimple, ImageSquare, SquareSplitHorizontal } from '@phosphor-icons/react'
import Image from 'next/image'
import { useRef } from 'react'
import type { Sample } from '../state/useStudio'
import { REDO_SHORTCUT, UNDO_SHORTCUT } from '../lib/useUndoShortcuts'
import { Button } from './Button'

interface PhotoBarProps {
  samples: Sample[]
  currentName: string | null
  comparing: boolean
  canDownload: boolean
  onOpenFile: (file: File) => void
  onOpenSample: (sample: Sample) => void
  onToggleCompare: () => void
  onDownload: () => void
  hasPhoto: boolean
  history: HistoryControls
}

export interface HistoryControls {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function PhotoBar({ samples, currentName, comparing, canDownload, onOpenFile, onOpenSample, onToggleCompare, onDownload, hasPhoto, history }: PhotoBarProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-wrap items-center gap-3">
      {samples.length > 0 && (
        <div className="flex items-center gap-1.5" role="group" aria-label="Sample photos">
          {samples.map((sample) => {
            const current = sample.name === currentName
            return (
              <button
                key={sample.id}
                type="button"
                title={`Try ${sample.name}`}
                aria-label={`Try the photo of ${sample.name}`}
                aria-current={current}
                onClick={() => onOpenSample(sample)}
                className={`size-10 overflow-hidden rounded-full transition-[box-shadow,scale] duration-150 active:scale-[0.96] ${current ? '[box-shadow:var(--shadow-ring)]' : 'opacity-70 hover:opacity-100'}`}
              >
                <Image src={sample.photoUrl} alt="" width={80} height={80} className="size-full object-cover object-top" />
              </button>
            )
          })}
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onOpenFile(file)
          event.target.value = ''
        }}
      />
      {hasPhoto && (
        <Button variant="primary" icon={<ImageSquare size={18} weight="bold" />} onClick={() => fileInput.current?.click()}>
          Open your photo
        </Button>
      )}
      <div className="ms-auto flex gap-2">
        <div role="group" aria-label="History" className="flex gap-1">
          <Button variant="ghost" iconOnly icon={<ArrowCounterClockwise size={18} weight="bold" />} title={`Undo (${UNDO_SHORTCUT})`} onClick={history.onUndo} disabled={!history.canUndo}>
            Undo
          </Button>
          <Button variant="ghost" iconOnly icon={<ArrowClockwise size={18} weight="bold" />} title={`Redo (${REDO_SHORTCUT})`} onClick={history.onRedo} disabled={!history.canRedo}>
            Redo
          </Button>
        </div>
        <Button variant={comparing ? 'primary' : 'quiet'} aria-pressed={comparing} icon={<SquareSplitHorizontal size={18} weight="bold" />} onClick={onToggleCompare} disabled={!hasPhoto}>
          Compare
        </Button>
        <Button icon={<DownloadSimple size={18} weight="bold" />} onClick={onDownload} disabled={!canDownload}>
          Download PNG
        </Button>
      </div>
    </div>
  )
}
