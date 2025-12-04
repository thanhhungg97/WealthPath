"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, SavingsGoal, CreateSavingsGoalInput } from "@/lib/api"
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const { toast } = useToast()
  const queryClient = useQueryClient()

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
      toast({ title: "Savings goal created" })
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
      toast({ title: "Contribution added!" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSavingsGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({ title: "Savings goal deleted" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const colorIndex = Math.floor(Math.random() * COLORS.length)
    createMutation.mutate({
      name: formData.get("name") as string,
      targetAmount: parseFloat(formData.get("targetAmount") as string),
      targetDate: formData.get("targetDate") as string || undefined,
      color: COLORS[colorIndex],
    })
  }

  const totalSaved = goals?.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0) || 0
  const totalTarget = goals?.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0) || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track your progress toward financial goals</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date (optional)</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Goal"
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
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-3xl font-bold gradient-text">{formatCurrency(totalSaved)}</p>
                <p className="text-sm text-muted-foreground">
                  of {formatCurrency(totalTarget)} target
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
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-3xl font-bold">{goals?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
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
                          Add Contribution
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Contribution to {goal.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="contribute-amount">Amount</Label>
                            <Input
                              id="contribute-amount"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={contributeAmount}
                              onChange={(e) => setContributeAmount(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (contributeAmount) {
                                contributeMutation.mutate({
                                  id: goal.id,
                                  amount: parseFloat(contributeAmount),
                                })
                              }
                            }}
                            disabled={contributeMutation.isPending}
                          >
                            {contributeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Add Contribution"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {isComplete && (
                    <div className="text-center py-2 text-success font-medium">
                      🎉 Goal Achieved!
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
            <p className="text-muted-foreground">No savings goals yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a goal to start saving toward your dreams
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




