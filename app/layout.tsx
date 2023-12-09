import './globals.css'
import Providers from './_contexts/providers'
import getMetadata, { BASE_METADATA } from './lib/metadata'


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
    <html lang="en">
      <head>
        {/* open graph stuff here */}
      </head>
      <Providers>
        {children}
      </Providers>
    </html>
  )
}
