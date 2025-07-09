
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getTransactions } from "@/services/transactionService";
import { format, subMonths } from 'date-fns';
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function IncomeExpenseChart() {
  const { t } = useLanguage()
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<{ income: any[]; expense: any[] }>({ income: [], expense: [] });

  useEffect(() => {
    if (user) {
      const unsubscribe = getTransactions(user.uid, (transactions) => {
        
        const monthlyData: { [key: string]: { name: string, income: number, expenses: number } } = {};
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthKey = format(date, 'yyyy-MM');
            const monthName = format(date, 'MMM');
            monthlyData[monthKey] = { name: monthName, income: 0, expenses: 0 };
        }

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const monthKey = format(txDate, 'yyyy-MM');

            if (monthlyData[monthKey]) {
                if (tx.type === 'income') {
                    monthlyData[monthKey].income += tx.amount;
                } else {
                    monthlyData[monthKey].expenses += tx.amount;
                }
            }
        });

        const dataForChart = Object.values(monthlyData);
        
        setChartData(dataForChart);
        setLoading(false);

        // Category breakdown for last 12 months
        const last12Months = new Set(Object.keys(monthlyData));
        const incomeCategories: Record<string, number> = {};
        const expenseCategories: Record<string, number> = {};
        transactions.forEach(tx => {
          const txDate = new Date(tx.date);
          const monthKey = format(txDate, 'yyyy-MM');
          if (last12Months.has(monthKey)) {
            if (tx.type === 'income') {
              incomeCategories[tx.category] = (incomeCategories[tx.category] || 0) + tx.amount;
            } else {
              expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + tx.amount;
            }
          }
        });
        setCategoryData({
          income: Object.entries(incomeCategories).map(([name, value]) => ({ name, value })),
          expense: Object.entries(expenseCategories).map(([name, value]) => ({ name, value })),
        });
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const COLORS = ["#1CA24C", "#7E57C2", "#3F51B5", "#FF7043", "#FFCA28", "#26A69A", "#EC407A", "#42A5F5", "#66BB6A", "#FFA726"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.incomeVsExpense}</CardTitle>
        <CardDescription>Last 12 months summary</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="flex items-center justify-center h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">No transaction data available for the chart.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `\tf${value}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))"
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div>
                <h3 className="text-sm font-semibold mb-2">Income by Category</h3>
                {categoryData.income.length === 0 ? (
                  <p className="text-muted-foreground">No income data.</p>
                ) : (
                  <PieChart width={250} height={250}>
                    <Pie
                      data={categoryData.income}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {categoryData.income.map((entry, idx) => (
                        <Cell key={`cell-income-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Expense by Category</h3>
                {categoryData.expense.length === 0 ? (
                  <p className="text-muted-foreground">No expense data.</p>
                ) : (
                  <PieChart width={250} height={250}>
                    <Pie
                      data={categoryData.expense}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {categoryData.expense.map((entry, idx) => (
                        <Cell key={`cell-expense-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
