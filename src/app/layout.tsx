import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { PusherHeartbeatProvider } from '@/components/providers/PusherHeartbeatProvider'

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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <PusherHeartbeatProvider>
            {children}
          </PusherHeartbeatProvider>
        </body>
      </html>
    </ClerkProvider>
  )
} 