"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { addCategory, addTransaction, getCategories } from "@/services/actions";
import type { Vehicle } from "@/services/vehicleService";
import { getVehicles } from "@/services/vehicleService";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  vehicleId: z.string().min(1, "Please select a vehicle."),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Please select a category."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  date: z.string().min(1, "Please select a date."),
  notes: z.string().optional(),
});

export function AddTransactionSheet() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customCategories, setCustomCategories] = useState<{ income: string[]; expense: string[] }>({ income: [], expense: [] });
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      date: new Date().toISOString().split("T")[0], // Today's date
      notes: "",
    },
  });

  useEffect(() => {
    if (user && open) {
      const unsubscribe = getVehicles(user.uid, setVehicles);
      return () => unsubscribe();
    }
  }, [user, open]);

  // Fetch custom categories when user or transactionType changes
  useEffect(() => {
    async function fetchCategories() {
      if (user) {
        const income = await getCategories(user.uid, "income");
        const expense = await getCategories(user.uid, "expense");
        setCustomCategories({ income, expense });
      }
    }
    fetchCategories();
  }, [user, form.watch("type"), open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsLoading(true);
    try {
        const selectedVehicle = vehicles.find(v => v.id === values.vehicleId);
        if (!selectedVehicle) throw new Error("Selected vehicle not found.");

        await addTransaction(user.uid, {
            ...values,
            vehicleName: selectedVehicle.name,
        });
        toast({
            title: "Transaction Added",
            description: `The transaction has been successfully added.`,
        });
        setOpen(false);
        form.reset();
        form.setValue("date", new Date().toISOString().split("T")[0]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add transaction.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const transactionType = form.watch("type");

  const categories = {
    income: [t.dailySubmission, ...customCategories.income],
    expense: [t.chargingFee, t.maintenanceFee, t.customExpense, ...customCategories.expense],
  };

  // Handler to add a new category
  const handleAddCategory = async () => {
    if (!user || !newCategory.trim()) return;
    setAddingCategory(true);
    try {
      await addCategory(user.uid, transactionType, newCategory.trim());
      setCustomCategories((prev) => ({
        ...prev,
        [transactionType]: [...prev[transactionType], newCategory.trim()],
      }));
      setNewCategory("");
    } finally {
      setAddingCategory(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {t.addExpense}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t.addExpense}</SheetTitle>
          <SheetDescription>
            Add a new income or expense record for a vehicle.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-8">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.vehicle}</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.plateNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.category}</FormLabel>
                  <div className="flex gap-2 items-center">
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectCategory} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories[transactionType].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="Add category"
                      className="w-32 h-8 text-xs"
                      disabled={addingCategory}
                    />
                    <Button type="button" size="sm" onClick={handleAddCategory} disabled={addingCategory || !newCategory.trim()}>
                      {addingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : "+"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.amount}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.date}</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.notes}</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant notes here..." value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.save}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
