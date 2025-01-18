import { Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ChatGenius',
  description: 'A modern chat application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-900 text-white`}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
} 