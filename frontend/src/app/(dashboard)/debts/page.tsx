"use client"

import {
  Calculator,
  Calendar,
  Car,
  CreditCard,
  DollarSign,
  GraduationCap,
  Home,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateDebtInput, Debt, PayoffPlan, api } from "@/lib/api"
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
import { formatCurrency, formatDate, formatPercent, toAPIDate } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

const DEBT_TYPES = [
  { value: "mortgage", label: "Mortgage", icon: Home },
  { value: "auto_loan", label: "Auto Loan", icon: Car },
  { value: "student_loan", label: "Student Loan", icon: GraduationCap },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "personal_loan", label: "Personal Loan", icon: Wallet },
  { value: "other", label: "Other", icon: DollarSign },
]

export default function DebtsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

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
      toast({ title: "Debt added" })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.makeDebtPayment(id, amount, toAPIDate(new Date())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setPaymentDebtId(null)
      setPaymentAmount("")
      toast({ title: "Payment recorded!" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({ title: "Debt removed" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      originalAmount: parseFloat(formData.get("originalAmount") as string),
      currentBalance: parseFloat(formData.get("currentBalance") as string),
      interestRate: parseFloat(formData.get("interestRate") as string),
      minimumPayment: parseFloat(formData.get("minimumPayment") as string),
      dueDay: parseInt(formData.get("dueDay") as string),
      startDate: formData.get("startDate") as string,
    })
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
          <h1 className="text-3xl font-display font-bold">Debt Manager</h1>
          <p className="text-muted-foreground mt-1">Track and pay off your debts</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Debt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Debt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="e.g., Chase Credit Card" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEBT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">Original Amount</Label>
                  <Input
                    id="originalAmount"
                    name="originalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    name="currentBalance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
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
                  <Label htmlFor="minimumPayment">Min Payment</Label>
                  <Input
                    id="minimumPayment"
                    name="minimumPayment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Due Day</Label>
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
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Debt"
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
                <p className="text-sm text-muted-foreground">Total Debt</p>
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
                <p className="text-sm text-muted-foreground">Monthly Minimum</p>
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
                <p className="text-sm text-muted-foreground">Avg Interest Rate</p>
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
                      <CardDescription>{debtType?.label}</CardDescription>
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
                      <p className="text-muted-foreground">Balance</p>
                      <p className="text-xl font-bold text-destructive">
                        {formatCurrency(debt.currentBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="text-xl font-bold">{debt.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min Payment</p>
                      <p className="font-medium">{formatCurrency(debt.minimumPayment)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Day</p>
                      <p className="font-medium">{debt.dueDay}th of month</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid off</span>
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
                          Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Make Payment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={debt.minimumPayment}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (paymentAmount) {
                                paymentMutation.mutate({
                                  id: debt.id,
                                  amount: parseFloat(paymentAmount),
                                })
                              }
                            }}
                            disabled={paymentMutation.isPending}
                          >
                            {paymentMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Record Payment"
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
                          Payoff Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Payoff Plan for {debt.name}</DialogTitle>
                        </DialogHeader>
                        {isPlanLoading ? (
                          <div className="py-8 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : payoffPlan ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                                <p className="text-xl font-bold">{formatCurrency(payoffPlan.monthlyPayment)}</p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Payoff Date</p>
                                <p className="text-xl font-bold">{formatDate(payoffPlan.payoffDate)}</p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Interest</p>
                                <p className="text-xl font-bold text-destructive">
                                  {formatCurrency(payoffPlan.totalInterest)}
                                </p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Months Left</p>
                                <p className="text-xl font-bold">{payoffPlan.monthsToPayoff}</p>
                              </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-background">
                                  <tr className="border-b">
                                    <th className="py-2 text-left">Month</th>
                                    <th className="py-2 text-right">Payment</th>
                                    <th className="py-2 text-right">Principal</th>
                                    <th className="py-2 text-right">Interest</th>
                                    <th className="py-2 text-right">Balance</th>
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
            <p className="text-muted-foreground">No debts tracked</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a debt to start managing your payoff plan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




