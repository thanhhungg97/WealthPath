"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, BudgetWithSpent, CreateBudgetInput } from "@/lib/api"
import { formatPercent } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import { useAuthStore } from "@/store/auth"
import { Plus, Trash2, Loader2, PiggyBank, AlertTriangle, CheckCircle } from "lucide-react"

const CATEGORIES = [
  "Housing",
  "Transportation",
  "Food & Dining",
  "Utilities",
  "Healthcare",
  "Insurance",
  "Entertainment",
  "Shopping",
  "Personal Care",
  "Education",
  "Travel",
  "Other",
]

export default function BudgetsPage() {
  const { formatCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const t = useTranslations()
  const { user } = useAuthStore()
  const currency = user?.currency || "USD"

  const { data: budgets, isLoading } = useQuery<BudgetWithSpent[]>({
    queryKey: ["budgets"],
    queryFn: () => api.getBudgets(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateBudgetInput) => api.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setIsOpen(false)
      toast({ title: t('budgets.budgetCreated') })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create budget",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      toast({ title: t('budgets.budgetDeleted') })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      category: formData.get("category") as string,
      amount: parseFloat(amount.replace(/,/g, "")),
      period: formData.get("period") as string,
      startDate: new Date().toISOString(), // RFC3339 format for backend
    })
    setAmount("") // Reset after submit
  }

  const totalBudget = budgets?.reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0
  const totalSpent = budgets?.reduce((sum, b) => sum + parseFloat(b.spent), 0) || 0
  const overBudgetCount = budgets?.filter((b) => b.percentage > 100).length || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('budgets.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('budgets.subtitle')}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('budgets.createBudget')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('budgets.createBudget')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('transactions.category')}</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('budgets.monthlyLimit')}</Label>
                <CurrencyInput
                  id="amount"
                  value={amount}
                  onChange={setAmount}
                  currency={currency}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">{t('budgets.period')}</Label>
                <Select name="period" defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t('budgets.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('budgets.monthly')}</SelectItem>
                    <SelectItem value="yearly">{t('budgets.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('common.creating')}
                  </>
                ) : (
                  t('budgets.createBudget')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('budgets.totalBudget')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('budgets.totalSpent')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overBudgetCount > 0 ? "border-warning/50 bg-warning/5" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overBudgetCount > 0 ? "bg-warning/10" : "bg-success/10"}`}>
                <AlertTriangle className={`w-6 h-6 ${overBudgetCount > 0 ? "text-warning" : "text-success"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('budgets.overBudget')}</p>
                <p className="text-2xl font-bold">{overBudgetCount} {t('common.categories')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : budgets?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const percentage = Math.min(budget.percentage, 100)
            const isOverBudget = budget.percentage > 100
            const remaining = parseFloat(budget.remaining)

            return (
              <Card
                key={budget.id}
                className={isOverBudget ? "border-destructive/50" : ""}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(budget.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold">{formatCurrency(budget.spent)}</p>
                      <p className="text-sm text-muted-foreground">
                        of {formatCurrency(budget.amount)} {budget.period}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          remaining < 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('budgets.remaining')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress
                      value={percentage}
                      className="h-3"
                      indicatorClassName={isOverBudget ? "bg-destructive" : "bg-primary"}
                    />
                    <div className="flex justify-between text-sm">
                      <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {formatPercent(budget.percentage)} {t('common.used')}
                      </span>
                      {isOverBudget && (
                        <span className="text-destructive font-medium flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {t('common.overBudget')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('budgets.noBudgetsYet')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('budgets.createBudgetToStart')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



