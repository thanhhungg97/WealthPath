"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, Debt, CreateDebtInput, PayoffPlan } from "@/lib/api"
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useAuthStore } from "@/store/auth"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import {
  Plus,
  Trash2,
  Loader2,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingDown,
  Calculator,
  Home,
  Car,
  GraduationCap,
  Wallet,
} from "lucide-react"

const DEBT_TYPES = [
  { value: "mortgage", labelKey: "types.mortgage", icon: Home },
  { value: "auto_loan", labelKey: "types.autoLoan", icon: Car },
  { value: "student_loan", labelKey: "types.studentLoan", icon: GraduationCap },
  { value: "credit_card", labelKey: "types.creditCard", icon: CreditCard },
  { value: "personal_loan", labelKey: "types.personalLoan", icon: Wallet },
  { value: "other", labelKey: "types.other", icon: DollarSign },
]

export default function DebtsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [originalAmount, setOriginalAmount] = useState("")
  const [currentBalance, setCurrentBalance] = useState("")
  const [minimumPayment, setMinimumPayment] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const t = useTranslations("debts")
  const { user } = useAuthStore()
  const currency = user?.currency || "USD"

  const { data: debts, isLoading } = useQuery<Debt[]>({
    queryKey: ["debts"],
    queryFn: () => api.getDebts(),
  })

  const { data: payoffPlan, isLoading: isPlanLoading } = useQuery<PayoffPlan>({
    queryKey: ["payoff-plan", selectedDebtId],
    queryFn: () => api.getPayoffPlan(selectedDebtId!),
    enabled: !!selectedDebtId,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateDebtInput) => api.createDebt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsOpen(false)
      toast({ title: t("debtAdded") })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.makeDebtPayment(id, amount, new Date().toISOString().split("T")[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setPaymentDebtId(null)
      setPaymentAmount("")
      toast({ title: t("paymentRecorded") })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({ title: t("debtRemoved") })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      originalAmount: parseFloat(originalAmount.replace(/,/g, "")),
      currentBalance: parseFloat(currentBalance.replace(/,/g, "")),
      interestRate: parseFloat(formData.get("interestRate") as string),
      minimumPayment: parseFloat(minimumPayment.replace(/,/g, "")),
      dueDay: parseInt(formData.get("dueDay") as string),
      startDate: formData.get("startDate") as string,
    })
    // Reset after submit
    setOriginalAmount("")
    setCurrentBalance("")
    setMinimumPayment("")
  }

  const totalDebt = debts?.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0) || 0
  const totalMinPayment = debts?.reduce((sum, d) => sum + parseFloat(d.minimumPayment), 0) || 0
  const avgInterest = debts?.length
    ? debts.reduce((sum, d) => sum + parseFloat(d.interestRate), 0) / debts.length
    : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("addDebt")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("addDebt")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("debtName")}</Label>
                <Input id="name" name="name" placeholder={t("debtNamePlaceholder")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t("debtType")}</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("debtType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEBT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(type.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">{t("totalAmount")}</Label>
                  <CurrencyInput
                    id="originalAmount"
                    value={originalAmount}
                    onChange={setOriginalAmount}
                    currency={currency}
                    showQuickAmounts={false}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">{t("currentBalance")}</Label>
                  <CurrencyInput
                    id="currentBalance"
                    value={currentBalance}
                    onChange={setCurrentBalance}
                    currency={currency}
                    showQuickAmounts={false}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">{t("interestRate")} (%)</Label>
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="5.5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">{t("minimumPayment")}</Label>
                  <CurrencyInput
                    id="minimumPayment"
                    value={minimumPayment}
                    onChange={setMinimumPayment}
                    currency={currency}
                    showQuickAmounts={false}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDay">{t("dueDate")}</Label>
                  <Input
                    id="dueDay"
                    name="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("startDate")}</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("addDebt")
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalDebt")}</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("monthlyMinimum")}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMinPayment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("avgInterestRate")}</p>
                <p className="text-2xl font-bold">{avgInterest.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : debts?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {debts.map((debt) => {
            const debtType = DEBT_TYPES.find((t) => t.value === debt.type)
            const Icon = debtType?.icon || DollarSign
            const original = parseFloat(debt.originalAmount)
            const current = parseFloat(debt.currentBalance)
            const paidOff = ((original - current) / original) * 100

            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{debt.name}</CardTitle>
                      <CardDescription>{debtType ? t(debtType.labelKey) : ""}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(debt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("balance")}</p>
                      <p className="text-xl font-bold text-destructive">
                        {formatCurrency(debt.currentBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("interestRate")}</p>
                      <p className="text-xl font-bold">{debt.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("minPayment")}</p>
                      <p className="font-medium">{formatCurrency(debt.minimumPayment)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("dueDay")}</p>
                      <p className="font-medium">{debt.dueDay} {t("dayOfMonth")}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("paidOff")}</span>
                      <span className="font-medium">{formatPercent(paidOff)}</span>
                    </div>
                    <Progress value={paidOff} className="h-2" indicatorClassName="bg-success" />
                  </div>

                  <div className="flex gap-2">
                    <Dialog
                      open={paymentDebtId === debt.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setPaymentDebtId(null)
                          setPaymentAmount("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setPaymentDebtId(debt.id)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t("payment")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("makePayment")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{t("paymentAmount")}</Label>
                            <CurrencyInput
                              value={paymentAmount}
                              onChange={setPaymentAmount}
                              currency={currency}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (paymentAmount) {
                                paymentMutation.mutate({
                                  id: debt.id,
                                  amount: parseFloat(paymentAmount.replace(/,/g, "")),
                                })
                              }
                            }}
                            disabled={paymentMutation.isPending}
                          >
                            {paymentMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              t("recordPayment")
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={selectedDebtId === debt.id}
                      onOpenChange={(open) => setSelectedDebtId(open ? debt.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <Calculator className="w-4 h-4 mr-2" />
                          {t("payoffPlan")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{t("payoffPlanFor")} {debt.name}</DialogTitle>
                        </DialogHeader>
                        {isPlanLoading ? (
                          <div className="py-8 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : payoffPlan ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">{t("monthlyPayment")}</p>
                                <p className="text-xl font-bold">{formatCurrency(payoffPlan.monthlyPayment)}</p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">{t("payoffDate")}</p>
                                <p className="text-xl font-bold">{formatDate(payoffPlan.payoffDate)}</p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">{t("totalInterest")}</p>
                                <p className="text-xl font-bold text-destructive">
                                  {formatCurrency(payoffPlan.totalInterest)}
                                </p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">{t("monthsLeft")}</p>
                                <p className="text-xl font-bold">{payoffPlan.monthsToPayoff}</p>
                              </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-background">
                                  <tr className="border-b">
                                    <th className="py-2 text-left">{t("month")}</th>
                                    <th className="py-2 text-right">{t("payment")}</th>
                                    <th className="py-2 text-right">{t("principal")}</th>
                                    <th className="py-2 text-right">{t("interestRate")}</th>
                                    <th className="py-2 text-right">{t("balance")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payoffPlan.amortizationPlan.slice(0, 24).map((row) => (
                                    <tr key={row.month} className="border-b">
                                      <td className="py-2">{row.month}</td>
                                      <td className="py-2 text-right">{formatCurrency(row.payment)}</td>
                                      <td className="py-2 text-right text-success">{formatCurrency(row.principal)}</td>
                                      <td className="py-2 text-right text-destructive">{formatCurrency(row.interest)}</td>
                                      <td className="py-2 text-right">{formatCurrency(row.remainingBalance)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noDebts")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("noDebtsDescription")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



