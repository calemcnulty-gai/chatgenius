import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { PusherProvider } from '@/contexts/PusherContext'

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
        <ClerkProvider>
          <PusherProvider>
            {children}
          </PusherProvider>
        </ClerkProvider>
      </body>
    </html>
  )
} 