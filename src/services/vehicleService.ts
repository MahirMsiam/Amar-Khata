
import {
  ref,
  onValue,
  query,
  orderByChild,
  type Unsubscribe,
} from 'firebase/database';
import { realtimeDB } from '@/lib/firebase';

export interface Vehicle {
  id: string; // Realtime DB key
  name: string;
  plateNumber: string;
  driverPhone?: string | null;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export const getVehicles = (userId: string, callback: (vehicles: Vehicle[]) => void): Unsubscribe => {
    if (!userId) {
        console.error("No user ID provided for getVehicles");
        return () => {}; // Return an empty unsubscribe function
    }
    const vehiclesRef = ref(realtimeDB, `users/${userId}/vehicles`);
    const q = query(vehiclesRef, orderByChild('name'));

    return onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const vehiclesArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            callback(vehiclesArray as Vehicle[]);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error("Error fetching vehicles: ", error);
        callback([]);
    });
};
