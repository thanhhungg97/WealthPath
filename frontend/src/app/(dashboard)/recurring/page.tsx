"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CreateRecurringInput,
  FREQUENCY_OPTIONS,
  RecurringTransaction,
  api,
} from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate, toAPIDate } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

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
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: recurring, isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ["recurring"],
    queryFn: () => api.getRecurringTransactions(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateRecurringInput) => api.createRecurringTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      setIsOpen(false)
      toast({ title: "Recurring transaction created" })
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
      toast({ title: "Recurring transaction deleted" })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseRecurringTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      toast({ title: "Recurring transaction paused" })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.resumeRecurringTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] })
      toast({ title: "Recurring transaction resumed" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      type,
      amount: parseFloat(formData.get("amount") as string),
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      frequency: formData.get("frequency") as CreateRecurringInput["frequency"],
      startDate: formData.get("startDate") as string,
    })
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
          <h1 className="text-3xl font-display font-bold">Recurring Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your recurring income and expenses
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recurring Transaction</DialogTitle>
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
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType("income")}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Income
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g., Monthly rent, Netflix subscription..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select name="frequency" defaultValue="monthly" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={toAPIDate(new Date())}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Recurring Transaction"
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
              Monthly Income
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
              Monthly Expenses
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
              Net Monthly
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
            Active ({activeItems.length})
          </CardTitle>
          <CardDescription>
            These transactions will be automatically added on schedule
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
              No active recurring transactions
            </p>
          ) : (
            <div className="divide-y">
              {activeItems.map((item) => (
                <RecurringItem
                  key={item.id}
                  item={item}
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
              Paused ({pausedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pausedItems.map((item) => (
                <RecurringItem
                  key={item.id}
                  item={item}
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
  onPause,
  onResume,
  onDelete,
}: {
  item: RecurringTransaction
  onPause: () => void
  onResume: () => void
  onDelete: () => void
}) {
  const isIncome = item.type === "income"
  const frequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === item.frequency)?.label || item.frequency

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
                Paused
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Next: {formatDate(item.nextOccurrence)}
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
                Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onResume}>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


