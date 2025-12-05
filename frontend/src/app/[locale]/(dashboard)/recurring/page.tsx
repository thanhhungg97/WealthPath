"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  api,
  RecurringTransaction,
  CreateRecurringInput,
} from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useAuthStore } from "@/store/auth"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Calendar,
  RefreshCw,
} from "lucide-react"

const EXPENSE_CATEGORIES = [
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
  "Gifts & Donations",
  "Investments",
  "Debt Payments",
  "Other",
]

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Rental",
  "Gifts",
  "Refunds",
  "Other",
]

export default function RecurringPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<"income" | "expense">("expense")
  const [amount, setAmount] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const t = useTranslations()
  const { user } = useAuthStore()
  const currency = user?.currency || "USD"

  const { data: recurring, isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ["recurring"],
    queryFn: () => api.getRecurringTransactions(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateRecurringInput) => api.createRecurringTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      setIsOpen(false)
      toast({ title: t('recurring.created') })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRecurringTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      toast({ title: t('recurring.deleted') })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseRecurringTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      toast({ title: t('recurring.pausedToast') })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.resumeRecurringTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      toast({ title: t('recurring.resumedToast') })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      type,
      amount: parseFloat(amount.replace(/,/g, "")),
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      frequency: formData.get("frequency") as CreateRecurringInput["frequency"],
      startDate: formData.get("startDate") as string,
    })
    setAmount("") // Reset after submit
  }

  const activeItems = recurring?.filter((r) => r.isActive) || []
  const pausedItems = recurring?.filter((r) => !r.isActive) || []
  const totalMonthlyExpenses = activeItems
    .filter((r) => r.type === "expense" && r.frequency === "monthly")
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const totalMonthlyIncome = activeItems
    .filter((r) => r.type === "income" && r.frequency === "monthly")
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('recurring.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('recurring.subtitle')}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('recurring.addRecurring')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('recurring.addRecurringTransaction')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType("expense")}
                >
                  <ArrowDownRight className="w-4 h-4 mr-2" />
                  {t('transactions.expense')}
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType("income")}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  {t('transactions.income')}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('transactions.amount')}</Label>
                <CurrencyInput
                  id="amount"
                  value={amount}
                  onChange={setAmount}
                  currency={currency}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('transactions.category')}</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('transactions.description')}</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder={t('recurring.descriptionPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">{t('recurring.frequency')}</Label>
                <Select name="frequency" defaultValue="monthly" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('recurring.daily')}</SelectItem>
                    <SelectItem value="weekly">{t('recurring.weekly')}</SelectItem>
                    <SelectItem value="biweekly">{t('recurring.biWeekly')}</SelectItem>
                    <SelectItem value="monthly">{t('recurring.monthly')}</SelectItem>
                    <SelectItem value="yearly">{t('recurring.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">{t('recurring.startDate')}</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('common.creating')}
                  </>
                ) : (
                  t('recurring.createRecurringTransaction')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('recurring.monthlyIncome')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              +{formatCurrency(totalMonthlyIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('recurring.monthlyExpenses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              -{formatCurrency(totalMonthlyExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('recurring.netMonthly')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totalMonthlyIncome - totalMonthlyExpenses >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(totalMonthlyIncome - totalMonthlyExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Recurring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            {t('recurring.active')} ({activeItems.length})
          </CardTitle>
          <CardDescription>
            {t('recurring.autoAddDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activeItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('recurring.noActive')}
            </p>
          ) : (
            <div className="divide-y">
              {activeItems.map((item) => (
                <RecurringItem
                  key={item.id}
                  item={item}
                  t={t}
                  onPause={() => pauseMutation.mutate(item.id)}
                  onResume={() => resumeMutation.mutate(item.id)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paused Recurring */}
      {pausedItems.length > 0 && (
        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5" />
              {t('recurring.paused')} ({pausedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pausedItems.map((item) => (
                <RecurringItem
                  key={item.id}
                  item={item}
                  t={t}
                  onPause={() => pauseMutation.mutate(item.id)}
                  onResume={() => resumeMutation.mutate(item.id)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RecurringItem({
  item,
  t,
  onPause,
  onResume,
  onDelete,
}: {
  item: RecurringTransaction
  t: ReturnType<typeof useTranslations>
  onPause: () => void
  onResume: () => void
  onDelete: () => void
}) {
  const isIncome = item.type === "income"
  const frequencyKey = item.frequency === "biweekly" ? "biWeekly" : item.frequency
  const frequencyLabel = t(`recurring.${frequencyKey}`)

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isIncome ? "bg-success/10" : "bg-destructive/10"
          }`}
        >
          {isIncome ? (
            <ArrowUpRight className="w-5 h-5 text-success" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-destructive" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{item.description || item.category}</p>
            <Badge variant="secondary" className="text-xs">
              {frequencyLabel}
            </Badge>
            {!item.isActive && (
              <Badge variant="outline" className="text-xs">
                {t('recurring.paused')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {t('recurring.next')}: {formatDate(item.nextOccurrence)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`text-lg font-semibold ${
            isIncome ? "text-success" : "text-destructive"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(item.amount)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.isActive ? (
              <DropdownMenuItem onClick={onPause}>
                <Pause className="w-4 h-4 mr-2" />
                {t('recurring.pause')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onResume}>
                <Play className="w-4 h-4 mr-2" />
                {t('recurring.resume')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

