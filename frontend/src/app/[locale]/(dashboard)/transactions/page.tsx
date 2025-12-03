"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, Transaction, CreateTransactionInput } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Loader2,
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

export default function TransactionsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<"income" | "expense">("expense")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const t = useTranslations()

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => api.getTransactions({ pageSize: "50" }),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionInput) => api.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsOpen(false)
      toast({ title: t('transactions.transactionAdded'), variant: "default" })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({ title: t('transactions.transactionDeleted') })
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
      date: formData.get("date") as string,
    })
  }

  const incomeTransactions = transactions?.filter((t) => t.type === "income") || []
  const expenseTransactions = transactions?.filter((t) => t.type === "expense") || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('transactions.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('transactions.subtitle')}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('transactions.addTransaction')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('transactions.addTransaction')}</DialogTitle>
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
                <Label htmlFor="category">{t('transactions.category')}</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('transactions.descriptionOptional')}</Label>
                <Input id="description" name="description" placeholder={t('transactions.addNote')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('transactions.date')}</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('common.adding')}
                  </>
                ) : (
                  t('transactions.addTransaction')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t('common.all')} ({transactions?.length || 0})</TabsTrigger>
          <TabsTrigger value="income">{t('transactions.income')} ({incomeTransactions.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('transactions.expenses')} ({expenseTransactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TransactionList
            transactions={transactions || []}
            isLoading={isLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
            t={t}
          />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <TransactionList
            transactions={incomeTransactions}
            isLoading={isLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
            t={t}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <TransactionList
            transactions={expenseTransactions}
            isLoading={isLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TransactionList({
  transactions,
  isLoading,
  onDelete,
  t,
}: {
  transactions: Transaction[]
  isLoading: boolean
  onDelete: (id: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('transactions.noTransactions')}</p>
        </CardContent>
      </Card>
    )
  }

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    const date = tx.date.split("T")[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {formatDate(date)}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y">
              {txs.map((tx) => {
                const isIncome = tx.type === "income"
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
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
                        <p className="font-medium">{tx.category}</p>
                        {tx.description && (
                          <p className="text-sm text-muted-foreground">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-lg font-semibold ${
                          isIncome ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(tx.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}



