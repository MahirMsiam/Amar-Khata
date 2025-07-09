
"use client";

import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { deleteTransaction } from "@/services/actions";
import { getTransactions, Transaction } from "@/services/transactionService";
import { getVehicles, Vehicle } from "@/services/vehicleService";
import { format } from 'date-fns';
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ExpensesTable() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filter, setFilter] = useState({
      startDate: "",
      endDate: "",
      category: "",
      minAmount: "",
      maxAmount: "",
      search: "",
    });
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const unsubscribe = getTransactions(user.uid, (data) => {
                setTransactions(data);
                setLoading(false);
            }, { limit: 10 });
            // Fetch vehicles for mapping vehicleId to plateNumber
            const unsubscribeVehicles = getVehicles(user.uid, (data) => {
                setVehicles(data);
            });
            return () => {
                unsubscribe();
                unsubscribeVehicles();
            };
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleDelete = async () => {
        if (!user || !deletingId) return;
        setIsDeleting(true);
        try {
            await deleteTransaction(user.uid, deletingId);
            setDeletingId(null);
            setShowDialog(false);
        } catch (error) {
            // Optionally show a toast for error
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper to get plate number by vehicleId
    const getPlateNumber = (vehicleId: string) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.plateNumber : "-";
    };

    // Get unique categories from transactions
    const categories = Array.from(new Set(transactions.map(tx => tx.category)));
    // Filter transactions
    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const start = filter.startDate ? new Date(filter.startDate) : null;
      const end = filter.endDate ? new Date(filter.endDate) : null;
      const matchesDate = (!start || txDate >= start) && (!end || txDate <= end);
      const matchesCategory = filter.category === "all" || !filter.category || tx.category === filter.category;
      const matchesMin = !filter.minAmount || tx.amount >= parseFloat(filter.minAmount);
      const matchesMax = !filter.maxAmount || tx.amount <= parseFloat(filter.maxAmount);
      const matchesSearch = !filter.search ||
        tx.vehicleName.toLowerCase().includes(filter.search.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(filter.search.toLowerCase()));
      return matchesDate && matchesCategory && matchesMin && matchesMax && matchesSearch;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.recentTransactions}</CardTitle>
        <CardDescription>Your most recent income and expense records.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter UI */}
        <div className="flex flex-wrap gap-2 mb-4 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
            <Input type="date" value={filter.startDate} onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))} className="h-8 w-32" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">End Date</label>
            <Input type="date" value={filter.endDate} onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))} className="h-8 w-32" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Category</label>
            <Select value={filter.category} onValueChange={val => setFilter(f => ({ ...f, category: val }))}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Min Amount</label>
            <Input type="number" value={filter.minAmount} onChange={e => setFilter(f => ({ ...f, minAmount: e.target.value }))} className="h-8 w-24" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Max Amount</label>
            <Input type="number" value={filter.maxAmount} onChange={e => setFilter(f => ({ ...f, maxAmount: e.target.value }))} className="h-8 w-24" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Search</label>
            <Input type="text" value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} className="h-8 w-32" placeholder="Vehicle or notes" />
          </div>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setFilter({ startDate: "", endDate: "", category: "", minAmount: "", maxAmount: "", search: "" })}>Clear</Button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No transactions found.</p>
          ) : (
            <Table className="min-w-[600px] text-sm md:text-base">
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Driver NID</TableHead>
                  <TableHead>{t.category}</TableHead>
                  <TableHead className="text-right">{t.amount}</TableHead>
                  <TableHead className="text-right">{t.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.vehicleName}</TableCell>
                    <TableCell className="font-medium">{getPlateNumber(transaction.vehicleId)}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="capitalize text-xs md:text-base px-2 py-1 md:px-3 md:py-1.5">
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}> 
                      {transaction.type === 'expense' ? `-৳${Math.abs(transaction.amount).toFixed(2)}` : `৳${transaction.amount.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-right">{format(new Date(transaction.date), 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-red-500 hover:text-red-700 rounded-full p-2 md:p-1 focus:outline-none focus:ring-2 focus:ring-red-400"
                        style={{ minWidth: 44, minHeight: 44 }}
                        onClick={() => { setDeletingId(transaction.id); setShowDialog(true); }}
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-6 h-6 md:w-4 md:h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the transaction."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
