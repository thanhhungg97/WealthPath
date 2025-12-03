"use client"

export const dynamic = 'force-dynamic'

import { AIChat } from "@/components/chat/ai-chat"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuthStore } from "@/store/auth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const locale = useLocale()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`)
    }
  }, [isAuthenticated, router, locale])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
      <AIChat />
    </div>
  )
}


