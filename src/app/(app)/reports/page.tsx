
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

export default function ReportsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [totals, setTotals] = useState<ReportTotals>({ income: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      let vehicles: Vehicle[] = [];
      let transactions: Transaction[] = [];
      let isVehiclesLoaded = false;
      let isTransactionsLoaded = false;

      const processData = () => {
        if (!isVehiclesLoaded || !isTransactionsLoaded) return;

        const data: ReportRow[] = vehicles.map(vehicle => {
            const vehicleTransactions = transactions.filter(tx => tx.vehicleId === vehicle.id);
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
      }

      const unsubscribeVehicles = getVehicles(user.uid, (v) => {
        vehicles = v;
        isVehiclesLoaded = true;
        processData();
      });

      const unsubscribeTransactions = getTransactions(user.uid, (tx) => {
        transactions = tx;
        isTransactionsLoaded = true;
        processData();
      });
      
      return () => {
        unsubscribeVehicles();
        unsubscribeTransactions();
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>{t.weeklyReport}</CardTitle>
                <CardDescription>Summary of income, expenses, and profit for all vehicles.</CardDescription>
            </div>
            <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t.exportCSV}
            </Button>
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
  );
}
