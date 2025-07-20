
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getTransactions, Transaction } from "@/services/transactionService";
import { getVehicles, Vehicle } from "@/services/vehicleService";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ReportRow {
    vehicleId: string;
    vehicleName: string;
    income: number;
    expenses: number;
    profit: number;
}

interface ReportTotals {
    income: number;
    expenses: number;
    profit: number;
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(d.setDate(diff));
}
function getEndOfWeek(date: Date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
}
function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [totals, setTotals] = useState<ReportTotals>({ income: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // Date range state
  const today = new Date();
  const [startDate, setStartDate] = useState(formatDateInput(getStartOfWeek(today)));
  const [endDate, setEndDate] = useState(formatDateInput(getEndOfWeek(today)));
  // Monthly summary state
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      let unsubVehicles = getVehicles(user.uid, (v) => setVehicles(v));
      let unsubTransactions = getTransactions(user.uid, (tx) => setAllTransactions(tx));
      return () => {
        unsubVehicles();
        unsubTransactions();
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  // Filter and process report data when transactions, vehicles, or date range changes
  useEffect(() => {
    if (!vehicles.length || !allTransactions.length) return;
    setLoading(true);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);
    // Filter transactions by date range
    const filteredTx = allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });
    // Main report data
        const data: ReportRow[] = vehicles.map(vehicle => {
      const vehicleTransactions = filteredTx.filter(tx => tx.vehicleId === vehicle.id);
            const income = vehicleTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const expenses = vehicleTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
            return {
                vehicleId: vehicle.id,
                vehicleName: `${vehicle.name} (${vehicle.plateNumber})`,
                income,
                expenses,
                profit: income - expenses,
            };
        });
        const totalRow = data.reduce((acc, item) => ({
            income: acc.income + item.income,
            expenses: acc.expenses + item.expenses,
            profit: acc.profit + item.profit
        }), { income: 0, expenses: 0, profit: 0 });
        setReportData(data);
        setTotals(totalRow);
        setLoading(false);
    // Monthly summary
    const monthly: Record<string, {income: number, expenses: number, profit: number}> = {};
    allTransactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
      if (!monthly[key]) monthly[key] = { income: 0, expenses: 0, profit: 0 };
      if (tx.type === 'income') monthly[key].income += tx.amount;
      if (tx.type === 'expense') monthly[key].expenses += tx.amount;
      monthly[key].profit = monthly[key].income - monthly[key].expenses;
      });
    setMonthlySummary(Object.entries(monthly).map(([month, vals]) => ({ month, ...vals }))); 
  }, [vehicles, allTransactions, startDate, endDate]);

  // CSV export logic (uses current filtered data)
  function exportToCSV() {
    if (!reportData.length) return;
    const headers = ["Vehicle", "Total Income", "Total Expenses", "Net Profit"];
    const rows = reportData.map(row => [
      row.vehicleName,
      row.income,
      row.expenses,
      row.profit
    ]);
    // Add totals row
    rows.push([
      "Total",
      totals.income,
      totals.expenses,
      totals.profit
    ]);
    const csvContent = [headers, ...rows]
      .map(e => e.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "weekly_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>{t.weeklyReport}</CardTitle>
                <CardDescription>Summary of income, expenses, and profit for all vehicles.</CardDescription>
            </div>
              <Button size="sm" variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                {t.exportCSV}
            </Button>
        </div>
          {/* Date Range Picker */}
          <div className="flex gap-2 mt-4">
            <label className="flex items-center gap-1 text-sm">Start Date:
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1 bg-background" />
            </label>
            <label className="flex items-center gap-1 text-sm">End Date:
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1 bg-background" />
            </label>
          </div>
      </CardHeader>
      <CardContent>
      {loading ? (
             <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : reportData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No data available to generate a report.</p>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>{t.vehicle}</TableHead>
                <TableHead className="text-right">{t.totalIncome}</TableHead>
                <TableHead className="text-right">{t.totalExpenses}</TableHead>
                <TableHead className="text-right">{t.netProfit}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.map((row) => (
                <TableRow key={row.vehicleId}>
                    <TableCell className="font-medium">{row.vehicleName}</TableCell>
                    <TableCell className="text-right text-green-600">৳{row.income.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">৳{row.expenses.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-bold ${row.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>৳{row.profit.toFixed(2)}</TableCell>
                </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">৳{totals.income.toFixed(2)}</TableCell>
                    <TableCell className="text-right">৳{totals.expenses.toFixed(2)}</TableCell>
                    <TableCell className="text-right">৳{totals.profit.toFixed(2)}</TableCell>
                </TableRow>
            </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
      {/* Monthly Summary Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Income, expenses, and profit for each month (all vehicles).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlySummary.sort((a, b) => a.month.localeCompare(b.month)).map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right text-green-600">৳{row.income.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-red-600">৳{row.expenses.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-bold ${row.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>৳{row.profit.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
