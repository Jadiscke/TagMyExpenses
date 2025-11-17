import * as React from "react";
import { Card, CardContent } from "./card";
import { Input } from "./input";
import { Button } from "./button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  normalizedMerchant?: string;
  amount: number;
  currency: string;
  category?: string;
  rawDescription?: string;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  onCategoryEdit?: (id: string, category: string) => void;
  onMerchantEdit?: (id: string, merchant: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  totalAmount?: number;
  currency?: string;
  search?: string;
  category?: string;
  onSearchChange?: (search: string) => void;
  onCategoryChange?: (category: string) => void;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function TransactionTable({
  transactions,
  onCategoryEdit,
  onMerchantEdit,
  page = 1,
  pageSize = 10,
  total,
  totalPages: serverTotalPages,
  totalAmount,
  currency = "BRL",
  search = "",
  category = "",
  onSearchChange,
  onCategoryChange,
  onPageChange,
  className,
}: TransactionTableProps) {
  // Use server-side pagination info
  const totalPages = serverTotalPages ?? 1;
  const totalCount = total ?? transactions.length;
  
  // Transactions are already filtered server-side
  const displayTransactions = transactions;

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currencyCode || "BRL",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Total Amount Display */}
          {totalAmount !== undefined && (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalAmount, currency)}
              </div>
              {totalCount > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {totalCount} transaction{totalCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={category}
              onChange={(e) => onCategoryChange?.(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-48"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left text-sm font-medium">Date</th>
                  <th className="p-2 text-left text-sm font-medium">Merchant</th>
                  <th className="p-2 text-right text-sm font-medium">Amount</th>
                  <th className="p-2 text-left text-sm font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {displayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  displayTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{formatDate(transaction.date)}</td>
                      <td className="p-2">
                        <div className="text-sm font-medium">
                          {transaction.normalizedMerchant || transaction.merchant}
                        </div>
                        {transaction.rawDescription && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.rawDescription}
                          </div>
                        )}
                      </td>
                      <td
                        className={cn(
                          "p-2 text-right text-sm font-medium",
                          transaction.amount < 0 ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="p-2">
                        {onCategoryEdit ? (
                          <select
                            value={transaction.category || ""}
                            onChange={(e) => onCategoryEdit(transaction.id, e.target.value)}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm">{transaction.category || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, totalCount)} of{" "}
                {totalCount} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

