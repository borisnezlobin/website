// idek, man. see https://github.com/PostHog/posthog/issues/26016#issuecomment-2471697885

'use client'

import dynamic from 'next/dynamic'

const BoidBackground = dynamic(() => import('./boid-canvas'), {
  ssr: false,
})

export default BoidBackground