"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  ArrowRight,
  PiggyBank,
  Target,
  CreditCard,
  BarChart3,
} from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const features = [
    {
      icon: BarChart3,
      title: "Income & Expense Tracking",
      description: "Easily log and categorize your income and expenses to understand where your money goes.",
    },
    {
      icon: PiggyBank,
      title: "Smart Budgeting",
      description: "Create budgets for different categories and get alerts when you're approaching your limits.",
    },
    {
      icon: Target,
      title: "Savings Goals",
      description: "Set financial goals and track your progress with visual indicators and projections.",
    },
    {
      icon: CreditCard,
      title: "Debt Management",
      description: "Track your loans, calculate payoff plans, and visualize your path to becoming debt-free.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzljOWUiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2NGgtNHpNNDAgMzBoNHY0aC00ek00NCAyNmg0djRoLTR6TTQ4IDIyaDR2NGgtNHpNNTIgMThoNHY0aC00ek01NiAxNGg0djRoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-2xl">WealthPath</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-fade-in">
              Take Control of Your{" "}
              <span className="gradient-text">Financial Future</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              Track expenses, manage budgets, achieve savings goals, and eliminate debt.
              WealthPath helps you build the financial life you deserve.
            </p>
            <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Link href="/register">
                <Button size="lg" className="text-lg px-8">
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you understand, control, and grow your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of users who are taking control of their financial future with WealthPath.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-10">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold">WealthPath</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} WealthPath. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


