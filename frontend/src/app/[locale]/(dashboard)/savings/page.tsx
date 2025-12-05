"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, SavingsGoal, CreateSavingsGoalInput } from "@/lib/api"
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useAuthStore } from "@/store/auth"
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
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import { Plus, Trash2, Loader2, Target, DollarSign, Calendar } from "lucide-react"

const COLORS = [
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#6366F1",
  "#84CC16",
]

export default function SavingsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [contributeId, setContributeId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const t = useTranslations()
  const { user } = useAuthStore()
  const currency = user?.currency || "USD"

  const { data: goals, isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["savings-goals"],
    queryFn: () => api.getSavingsGoals(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateSavingsGoalInput) => api.createSavingsGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setIsOpen(false)
      toast({ title: t('savings.goalCreated') })
    },
  })

  const contributeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.contributeSavingsGoal(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setContributeId(null)
      setContributeAmount("")
      toast({ title: t('savings.fundsAdded') })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSavingsGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({ title: t('savings.goalDeleted') })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const colorIndex = Math.floor(Math.random() * COLORS.length)
    createMutation.mutate({
      name: formData.get("name") as string,
      targetAmount: parseFloat(targetAmount.replace(/,/g, "")),
      targetDate: formData.get("targetDate") as string || undefined,
      color: COLORS[colorIndex],
    })
    setTargetAmount("") // Reset after submit
  }

  const totalSaved = goals?.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0) || 0
  const totalTarget = goals?.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0) || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('savings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('savings.subtitle')}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('savings.newGoal')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('savings.addGoal')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('savings.goalName')}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t('savings.goalNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">{t('savings.targetAmount')}</Label>
                <CurrencyInput
                  id="targetAmount"
                  value={targetAmount}
                  onChange={setTargetAmount}
                  currency={currency}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">{t('savings.targetDateOptional')}</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('common.creating')}
                  </>
                ) : (
                  t('savings.createGoal')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('savings.totalSaved')}</p>
                <p className="text-3xl font-bold gradient-text">{formatCurrency(totalSaved)}</p>
                <p className="text-sm text-muted-foreground">
                  {t('savings.ofTarget', { amount: formatCurrency(totalTarget) })}
                </p>
              </div>
            </div>
            {totalTarget > 0 && (
              <div className="mt-4">
                <Progress
                  value={(totalSaved / totalTarget) * 100}
                  className="h-3"
                  indicatorClassName="gradient-primary"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t('savings.activeGoals')}</p>
                <p className="text-3xl font-bold">{goals?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('savings.avgProgress')}</p>
                <p className="text-3xl font-bold">
                  {goals?.length
                    ? formatPercent(
                        goals.reduce((sum, g) => {
                          const pct = (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100
                          return sum + pct
                        }, 0) / goals.length
                      )
                    : "0%"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : goals?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const current = parseFloat(goal.currentAmount)
            const target = parseFloat(goal.targetAmount)
            const percentage = Math.min((current / target) * 100, 100)
            const isComplete = current >= target

            return (
              <Card
                key={goal.id}
                className={isComplete ? "border-success/50 bg-success/5" : ""}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <Target className="w-5 h-5" style={{ color: goal.color }} />
                    </div>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive -mt-1"
                    onClick={() => deleteMutation.mutate(goal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-2xl font-bold">{formatCurrency(current)}</p>
                      <p className="text-sm text-muted-foreground">
                        of {formatCurrency(target)}
                      </p>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorClassName={isComplete ? "bg-success" : ""}
                      style={
                        !isComplete
                          ? { ["--progress-color" as string]: goal.color }
                          : undefined
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPercent(percentage)} complete
                    </p>
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Target: {formatDate(goal.targetDate)}</span>
                    </div>
                  )}

                  {!isComplete && (
                    <Dialog
                      open={contributeId === goal.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setContributeId(null)
                          setContributeAmount("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => setContributeId(goal.id)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t('savings.addMoney')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('savings.addFunds')} - {goal.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="contribute-amount">{t('transactions.amount')}</Label>
                            <CurrencyInput
                              id="contribute-amount"
                              value={contributeAmount}
                              onChange={setContributeAmount}
                              currency={currency}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (contributeAmount) {
                                contributeMutation.mutate({
                                  id: goal.id,
                                  amount: parseFloat(contributeAmount.replace(/,/g, "")),
                                })
                              }
                            }}
                            disabled={contributeMutation.isPending}
                          >
                            {contributeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              t('savings.addFunds')
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {isComplete && (
                    <div className="text-center py-2 text-success font-medium">
                      🎉 {t('dashboard.goalAchieved')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('savings.noGoalsYet')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('savings.createGoalToStart')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



