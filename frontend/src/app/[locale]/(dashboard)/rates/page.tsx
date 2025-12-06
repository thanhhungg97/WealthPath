'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Clock,
  Wallet,
  PiggyBank,
  Home,
  RefreshCw,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, InterestRate, Bank, RateHistoryEntry } from '@/lib/api';

// Types imported from @/lib/api

const TERM_OPTIONS = [
  { value: '1', label: '1 tháng' },
  { value: '3', label: '3 tháng' },
  { value: '6', label: '6 tháng' },
  { value: '9', label: '9 tháng' },
  { value: '12', label: '12 tháng' },
  { value: '18', label: '18 tháng' },
  { value: '24', label: '24 tháng' },
  { value: '36', label: '36 tháng' },
];

const PRODUCT_TYPES = [
  { value: 'deposit', label: 'Tiết kiệm', labelEn: 'Savings Deposit', icon: PiggyBank },
  { value: 'loan', label: 'Vay tiêu dùng', labelEn: 'Personal Loan', icon: Wallet },
  { value: 'mortgage', label: 'Vay mua nhà', labelEn: 'Mortgage', icon: Home },
];

export default function InterestRatesPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _t = useTranslations(); // Reserved for future i18n
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('12');
  const [selectedType, setSelectedType] = useState('deposit');
  const [sortBy, setSortBy] = useState<'rate' | 'bank'>('rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyData, setHistoryData] = useState<{ date: string; [key: string]: string | number }[]>(
    []
  );
  const [selectedBanksForChart, setSelectedBanksForChart] = useState<string[]>([
    'vcb',
    'tcb',
    'mb',
  ]);

  const fetchBanks = useCallback(async () => {
    try {
      const data = await api.getBanks();
      setBanks(data);
    } catch (error) {
      console.error('Failed to fetch banks:', error);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.compareRates({ type: selectedType, term: selectedTerm });
      setRates(data || []);
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedTerm]);

  const fetchHistory = useCallback(async () => {
    // Fetch history for selected banks
    const historyPromises = selectedBanksForChart.map(async (bankCode) => {
      try {
        const data = await api.getRateHistory({
          bank: bankCode,
          type: selectedType,
          term: selectedTerm,
          days: '90',
        });
        return { bankCode, data: data || [] };
      } catch {
        return { bankCode, data: [] as RateHistoryEntry[] };
      }
    });

    const results = await Promise.all(historyPromises);

    // Merge data by date
    const dateMap = new Map<string, { date: string; [key: string]: string | number }>();

    results.forEach(({ bankCode, data }) => {
      data.forEach((entry) => {
        const date = entry.recordedDate.split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        const existing = dateMap.get(date)!;
        existing[bankCode] = parseFloat(entry.rate);
      });
    });

    const chartData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setHistoryData(chartData);
  }, [selectedBanksForChart, selectedType, selectedTerm]);

  useEffect(() => {
    fetchBanks();
    fetchRates();
  }, [fetchBanks, fetchRates]);

  useEffect(() => {
    if (banks.length > 0) {
      fetchHistory();
    }
  }, [banks.length, fetchHistory]);

  const seedRates = async () => {
    try {
      await api.seedRates();
      fetchRates();
    } catch (error) {
      console.error('Failed to seed rates:', error);
    }
  };

  const sortedRates = [...rates].sort((a, b) => {
    if (sortBy === 'rate') {
      const rateA = parseFloat(a.rate);
      const rateB = parseFloat(b.rate);
      return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
    }
    return sortOrder === 'desc'
      ? b.bankName.localeCompare(a.bankName)
      : a.bankName.localeCompare(b.bankName);
  });

  const maxRate = Math.max(...rates.map((r) => parseFloat(r.rate)), 0);
  const minRate = Math.min(...rates.map((r) => parseFloat(r.rate)), 100);
  const avgRate = rates.length
    ? rates.reduce((sum, r) => sum + parseFloat(r.rate), 0) / rates.length
    : 0;

  const getBankLogo = (bankCode: string) => {
    const bank = banks.find((b) => b.code === bankCode);
    return bank?.logo;
  };

  const toggleSort = (field: 'rate' | 'bank') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Lãi suất ngân hàng
          </h1>
          <p className="text-muted-foreground mt-1">
            So sánh lãi suất từ các ngân hàng hàng đầu Việt Nam
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Cập nhật
        </Button>
      </div>

      {/* Product Type Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-3">
          {PRODUCT_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
              <type.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Lãi suất cao nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{maxRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground mt-1">/ năm</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-blue-500" />
                  Lãi suất trung bình
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{avgRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground mt-1">/ năm</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  Lãi suất thấp nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {rates.length ? minRate.toFixed(2) : '0.00'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">/ năm</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Chọn kỳ hạn" />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={sortBy === 'rate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('rate')}
              >
                Theo lãi suất
                {sortBy === 'rate' && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
              </Button>
              <Button
                variant={sortBy === 'bank' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('bank')}
              >
                Theo ngân hàng
                {sortBy === 'bank' && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
              </Button>
            </div>
          </div>

          {/* Rates List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rates.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Chưa có dữ liệu lãi suất</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Nhấn nút bên dưới để tải dữ liệu mẫu
                </p>
                <Button onClick={seedRates}>Tải dữ liệu mẫu</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedRates.map((rate, index) => {
                const rateValue = parseFloat(rate.rate);
                const progress = maxRate > 0 ? (rateValue / maxRate) * 100 : 0;
                const isTop = index === 0 && sortBy === 'rate' && sortOrder === 'desc';
                const logo = getBankLogo(rate.bankCode);

                return (
                  <Card
                    key={rate.id}
                    className={`transition-all hover:shadow-md ${isTop ? 'border-green-500/50 bg-green-500/5' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Bank Logo/Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {logo ? (
                            <Image
                              src={logo}
                              alt={rate.bankName}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Bank Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{rate.bankName}</h3>
                            {isTop && (
                              <Badge variant="default" className="bg-green-500">
                                Cao nhất
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rate.termLabel}</p>
                        </div>

                        {/* Rate */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {rateValue.toFixed(2)}%
                          </div>
                          <p className="text-xs text-muted-foreground">/ năm</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Historical Chart */}
          {historyData.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Biểu đồ lãi suất (90 ngày)
                </CardTitle>
                <CardDescription>So sánh biến động lãi suất giữa các ngân hàng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })
                        }
                        className="text-xs"
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `${value}%`}
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        }
                      />
                      <Legend />
                      {selectedBanksForChart.map((bankCode, index) => {
                        const colors = [
                          '#22c55e',
                          '#3b82f6',
                          '#f59e0b',
                          '#ef4444',
                          '#8b5cf6',
                          '#ec4899',
                        ];
                        const bank = banks.find((b) => b.code === bankCode);
                        return (
                          <Line
                            key={bankCode}
                            type="monotone"
                            dataKey={bankCode}
                            name={bank?.name || bankCode.toUpperCase()}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={false}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Bank selector for chart */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {banks.map((bank) => (
                    <Button
                      key={bank.code}
                      variant={selectedBanksForChart.includes(bank.code) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (selectedBanksForChart.includes(bank.code)) {
                          setSelectedBanksForChart(
                            selectedBanksForChart.filter((b) => b !== bank.code)
                          );
                        } else {
                          setSelectedBanksForChart([...selectedBanksForChart, bank.code]);
                        }
                      }}
                    >
                      {bank.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banks Grid */}
          {banks.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Ngân hàng được hỗ trợ</CardTitle>
                <CardDescription>
                  Dữ liệu lãi suất được cập nhật từ {banks.length} ngân hàng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {banks.map((bank) => (
                    <a
                      key={bank.code}
                      href={bank.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2 overflow-hidden">
                        {bank.logo ? (
                          <Image
                            src={bank.logo}
                            alt={bank.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-center">{bank.name}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
