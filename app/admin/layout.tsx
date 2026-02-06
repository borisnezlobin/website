import "../styles/globals.css";

export const metadata = {
  title: 'Edit Blog',
  description: 'Boris Nezlobin\'s blog editor.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
