import './globals.css'
import Providers from './_contexts/providers'
import { BASE_METADATA } from './lib/metadata'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"


export const metadata = BASE_METADATA;
// {
//   title: 'Boris Nezlobin',
//   description:
//     "I'm a software engineer, full-stack developer, and computer science student. I'm passionate about building things that make people's lives easier.",
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* open graph stuff here */}
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
      <SpeedInsights />
      <Analytics />
    </html>
  )
}
