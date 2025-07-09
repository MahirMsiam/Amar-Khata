// Service for fetching transactions from Firebase Realtime Database
import { realtimeDB } from '@/lib/firebase';
import {
    limitToLast,
    onValue,
    orderByChild,
    query,
    ref,
    type Unsubscribe,
} from 'firebase/database';

// Transaction type definition
export interface Transaction {
  id: string; // Realtime DB key
  vehicleId: string;
  vehicleName: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string; // ISO string
  notes?: string;
}

// Fetches transactions for a user, optionally limited by count
export const getTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void,
  options: { limit?: number } = {}
): Unsubscribe => {
  if (!userId) {
    console.error('No user ID provided for getTransactions');
    return () => {};
  }
  // Reference to the user's transactions in the database
  const transactionsRef = ref(realtimeDB, `users/${userId}/transactions`);
  const queryConstraints = [orderByChild('date')];
  if (options.limit) {
    queryConstraints.push(limitToLast(options.limit));
  }

  // Create a query with constraints (e.g., order by date, limit)
  const q = query(transactionsRef, ...queryConstraints);

  // Listen for real-time updates to the transactions
  return onValue(
    q,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to sorted array of transactions
        const transactionsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(transactionsArray as Transaction[]);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Error fetching transactions: ', error);
      callback([]);
    }
  );
};
