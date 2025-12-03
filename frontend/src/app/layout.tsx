import { ReactNode } from 'react'

// Root layout - middleware handles locale redirect
// This is just a passthrough since middleware redirects to /[locale]
export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}



