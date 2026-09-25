import { Outlet } from 'react-router-dom'
import { useSessionSync } from '@/hooks/useSessionSync'
import { Footer } from './Footer'
import { Header } from './Header'

export function RootLayout() {
  // Refreshes the stored user (and its short-lived avatar url) from /users/me.
  useSessionSync()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
