"use client"

import {
  ArrowUpDown,
  Calculator,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react"
import { useLocale, useTranslations } from 'next-intl'

import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: t('dashboard.title'), href: `/${locale}/dashboard`, icon: LayoutDashboard, key: 'dashboard' },
    { name: t('transactions.title'), href: `/${locale}/transactions`, icon: ArrowUpDown, key: 'transactions' },
    { name: t('recurring.title'), href: `/${locale}/recurring`, icon: RefreshCw, key: 'recurring' },
    { name: t('budgets.title'), href: `/${locale}/budgets`, icon: PiggyBank, key: 'budgets' },
    { name: t('savings.title'), href: `/${locale}/savings`, icon: Target, key: 'savings' },
    { name: t('debts.title'), href: `/${locale}/debts`, icon: CreditCard, key: 'debts' },
    { name: "Calculator", href: `/${locale}/calculator`, icon: Calculator, key: 'calculator' },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-xl gradient-text">WealthPath</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="px-2">
          <LanguageSwitcher />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" asChild>
            <Link href={`/${locale}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              {t('settings.title')}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}


