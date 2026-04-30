import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Loom Switch',
  description: 'Configuration Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          {children}
          <Toaster position='top-right' richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
