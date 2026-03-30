import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Velox — Motor de Ventas',
  description: 'CRM inteligente con Agente IA para equipos B2B',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="es" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className="min-h-screen bg-velox-bg text-velox-text antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
