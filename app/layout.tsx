import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './_contexts/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Boris Nezlobin',
  description:
    "I'm a software engineer, full-stack developer, and computer science student. I'm passionate about building things that make people's lives easier.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
