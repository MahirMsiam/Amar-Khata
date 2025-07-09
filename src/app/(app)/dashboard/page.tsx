import { AddTransactionSheet } from "@/components/dashboard/AddTransactionSheet";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex justify-end">
          <AddTransactionSheet />
      </div>
      <DashboardStats />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
            <IncomeExpenseChart />
        </div>
        <div>
            <ExpensesTable />
        </div>
      </div>
    </div>
  );
}
