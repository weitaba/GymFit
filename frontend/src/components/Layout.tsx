import { ReactNode } from 'react'
import Navbar from './Navbar'

interface Props {
  children: ReactNode
  title?: string    // kept for backward compat, Navbar derives from URL
  showBack?: boolean // kept for backward compat
}

export default function Layout({ children }: Props) {
  return (
    <>
      <Navbar />
      <main className="layout__main">{children}</main>
    </>
  )
}
