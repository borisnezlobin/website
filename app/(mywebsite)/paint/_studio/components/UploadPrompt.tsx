import { CircleNotch, ImageSquare } from '@phosphor-icons/react'
import Image from 'next/image'
import { useRef } from 'react'
import { assetUrl } from '../lib/assets'
import { Button } from './Button'

interface UploadPromptProps {
  loading: boolean
  onOpenFile: (file: File) => void
}

export function UploadPrompt({ loading, onOpenFile }: UploadPromptProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  return (
    <div className="grid size-full place-items-center p-4 sm:p-8">
      <div className="flex max-w-sm flex-col items-center gap-5 text-center">
        <Image src={assetUrl('/thumbs/knife.jpg')} alt="A portrait painted with a palette knife" width={360} height={360} priority className="size-56 rounded-[var(--radius-stage)] object-cover [box-shadow:var(--paint-shadow-stage)]" />
        <p className="text-section [text-wrap:balance]">Open a photo of a person or a pet</p>
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
        <Button
          variant="primary"
          disabled={loading}
          icon={loading ? <CircleNotch size={18} weight="bold" className="animate-spin motion-reduce:animate-none" /> : <ImageSquare size={18} weight="bold" />}
          onClick={() => fileInput.current?.click()}
        >
          {loading ? 'Opening your photo' : 'Open your photo'}
        </Button>
        <p className="text-caption [text-wrap:pretty]">You can also drop it here. It never leaves your device.</p>
      </div>
    </div>
  )
}
