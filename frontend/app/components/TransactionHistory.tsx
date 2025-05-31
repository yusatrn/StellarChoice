import { Transaction } from "@stellar/stellar-sdk";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

interface TransactionHistoryProps {
  transactions: Array<{
    id: string;
    date: Date;
    type: 'send' | 'receive' | 'swap' | 'contract';
    amount: string;
    asset: string;
    status: 'success' | 'pending' | 'failed';
    tx: Transaction;
  }>;
  isLoading?: boolean;
  className?: string;
}

export function TransactionHistory({
  transactions = [],
  isLoading = false,
  className = '',
}: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`p-8 text-center text-muted-foreground ${className}`}>
        No transaction history found
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold">Transaction History</h2>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  {
                    'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400': tx.status === 'success',
                    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400': tx.status === 'pending',
                    'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400': tx.status === 'failed',
                  }
                )}
              >
                {tx.type === 'send' ? '↑' : tx.type === 'receive' ? '↓' : '⇄'}
              </div>
              <div>
                <div className="font-medium capitalize">{tx.type}</div>
                <div className="text-sm text-muted-foreground">
                  {format(tx.date, 'MMM d, yyyy - h:mm a')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {tx.type === 'send' ? '-' : '+'} {tx.amount} {tx.asset}
              </div>
              <div className="text-sm capitalize text-muted-foreground">
                {tx.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
