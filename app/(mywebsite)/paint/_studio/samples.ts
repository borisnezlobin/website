import { assetUrl } from './lib/assets'
import type { Sample } from './state/useStudio'
import type { EffectId } from './worker/protocol'

export const SAMPLES: Record<EffectId, Sample[]> = {
  knife: [],
  ink: [
    { id: 'bloom', name: 'Morning flowers', photoUrl: assetUrl('/samples/designs/bloom.png') },
    { id: 'poster', name: 'Open Studio poster', photoUrl: assetUrl('/samples/designs/poster.png') },
    { id: 'brand', name: 'Fernwood brand card', photoUrl: assetUrl('/samples/designs/brand.png') },
  ],
}

export function isSample(name: string | undefined): boolean {
  return Object.values(SAMPLES).some((samples) => samples.some((sample) => sample.name === name))
}
