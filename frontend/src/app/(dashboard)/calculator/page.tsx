"use client"

import { useState } from "react"
import { api, InterestCalculatorResult } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, DollarSign, Percent, Calendar, TrendingUp, Loader2 } from "lucide-react"

export default function CalculatorPage() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<InterestCalculatorResult | null>(null)

  // Loan calculator state
  const [principal, setPrincipal] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [termMonths, setTermMonths] = useState("")

  // Savings calculator state
  const [savingsAmount, setSavingsAmount] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [savingsRate, setSavingsRate] = useState("")
  const [savingsYears, setSavingsYears] = useState("")
  const [savingsResult, setSavingsResult] = useState<{
    futureValue: number
    totalContributions: number
    totalInterest: number
  } | null>(null)

  const calculateLoan = async () => {
    if (!principal || !interestRate || !termMonths) return

    setIsCalculating(true)
    try {
      const data = await api.calculateInterest({
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate),
        termMonths: parseInt(termMonths),
      })
      setResult(data)
    } catch (error) {
      console.error("Calculation failed:", error)
    }
    setIsCalculating(false)
  }

  const calculateSavings = () => {
    if (!savingsAmount || !savingsRate || !savingsYears) return

    const P = parseFloat(savingsAmount)
    const PMT = parseFloat(monthlyContribution) || 0
    const r = parseFloat(savingsRate) / 100 / 12
    const n = parseFloat(savingsYears) * 12

    // Future value = P(1+r)^n + PMT * ((1+r)^n - 1) / r
    let futureValue: number
    if (r === 0) {
      futureValue = P + PMT * n
    } else {
      futureValue = P * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r)
    }

    const totalContributions = P + PMT * n
    const totalInterest = futureValue - totalContributions

    setSavingsResult({
      futureValue,
      totalContributions,
      totalInterest,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Financial Calculator</h1>
        <p className="text-muted-foreground mt-1">Calculate loan payments and savings projections</p>
      </div>

      <Tabs defaultValue="loan" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="loan">Loan Calculator</TabsTrigger>
          <TabsTrigger value="savings">Savings Calculator</TabsTrigger>
        </TabsList>

        {/* Loan Calculator */}
        <TabsContent value="loan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Loan Details
                </CardTitle>
                <CardDescription>
                  Calculate your monthly payment and total interest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Loan Amount
                  </Label>
                  <Input
                    id="principal"
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate" className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    Annual Interest Rate (%)
                  </Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="5.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termMonths" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Loan Term (months)
                  </Label>
                  <Input
                    id="termMonths"
                    type="number"
                    placeholder="60"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={calculateLoan}
                  disabled={isCalculating || !principal || !interestRate || !termMonths}
                >
                  {isCalculating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle>Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-card rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">Monthly Payment</p>
                    <p className="text-4xl font-bold gradient-text">
                      {formatCurrency(result.monthlyPayment)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Payment</p>
                      <p className="text-xl font-bold">{formatCurrency(result.totalPayment)}</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="text-xl font-bold text-destructive">
                        {formatCurrency(result.totalInterest)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-card rounded-lg">
                    <p className="text-sm text-muted-foreground">Payoff Date</p>
                    <p className="text-lg font-bold">
                      {new Date(result.payoffDate).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground text-center">
                    <p>
                      You&apos;ll pay{" "}
                      <span className="font-medium text-destructive">
                        {formatCurrency(result.totalInterest)}
                      </span>{" "}
                      in interest over the life of the loan
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Savings Calculator */}
        <TabsContent value="savings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Savings Details
                </CardTitle>
                <CardDescription>
                  Project your savings growth with compound interest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="savingsAmount" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Initial Amount
                  </Label>
                  <Input
                    id="savingsAmount"
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Monthly Contribution
                  </Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="savingsRate" className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    Annual Interest Rate (%)
                  </Label>
                  <Input
                    id="savingsRate"
                    type="number"
                    step="0.01"
                    placeholder="7"
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="savingsYears" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Time Period (years)
                  </Label>
                  <Input
                    id="savingsYears"
                    type="number"
                    placeholder="10"
                    value={savingsYears}
                    onChange={(e) => setSavingsYears(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={calculateSavings}
                  disabled={!savingsAmount || !savingsRate || !savingsYears}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {savingsResult && (
              <Card className="bg-gradient-to-br from-success/5 to-accent/5">
                <CardHeader>
                  <CardTitle>Savings Projection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-card rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">Future Value</p>
                    <p className="text-4xl font-bold text-success">
                      {formatCurrency(savingsResult.futureValue)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-lg">
                      <p className="text-sm text-muted-foreground">Your Contributions</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(savingsResult.totalContributions)}
                      </p>
                    </div>
                    <div className="p-4 bg-card rounded-lg">
                      <p className="text-sm text-muted-foreground">Interest Earned</p>
                      <p className="text-xl font-bold text-success">
                        {formatCurrency(savingsResult.totalInterest)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Contributions</span>
                      <span className="font-medium">
                        {((savingsResult.totalContributions / savingsResult.futureValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{
                          width: `${(savingsResult.totalContributions / savingsResult.futureValue) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-success h-full transition-all"
                        style={{
                          width: `${(savingsResult.totalInterest / savingsResult.futureValue) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-primary" />
                        Principal
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-success" />
                        Interest
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground text-center">
                    <p>
                      Compound interest will earn you{" "}
                      <span className="font-medium text-success">
                        {formatCurrency(savingsResult.totalInterest)}
                      </span>{" "}
                      over {savingsYears} years
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



