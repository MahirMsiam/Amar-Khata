// Server actions for interacting with Firebase Realtime Database
'use server';

import { realtimeDB } from '@/lib/firebase';
import { updateProfile, type User as FirebaseUser } from 'firebase/auth';
import {
  get,
  push,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';
import type { Transaction } from './transactionService';
import type { UserProfile } from './userService';
import type { Vehicle } from './vehicleService';

// Add a new transaction to the database
export const addTransaction = async (userId: string, transactionData: Omit<Transaction, 'id'>) => {
  if (!userId) throw new Error('User not authenticated');
  const transactionsRef = ref(realtimeDB, `users/${userId}/transactions`);
  const newTransactionRef = push(transactionsRef);
  await set(newTransactionRef, transactionData);
};

// Add a new vehicle to the database
export const addVehicle = async (userId: string, vehicleData: Omit<Vehicle, 'id'>) => {
  if (!userId) throw new Error('User not authenticated');
  const vehiclesRef = ref(realtimeDB, `users/${userId}/vehicles`);
  const newVehicleRef = push(vehiclesRef);

  const dataToSave = { ...vehicleData };
  if (dataToSave.driverPhone === '') {
    (dataToSave as Partial<Vehicle>).driverPhone = null;
  }

  await set(newVehicleRef, dataToSave);
};

// Update an existing vehicle in the database
export const updateVehicle = async (userId: string, vehicleId: string, vehicleData: Partial<Omit<Vehicle, 'id'>>) => {
    if (!userId) throw new Error('User not authenticated');
    const vehicleRef = ref(realtimeDB, `users/${userId}/vehicles/${vehicleId}`);
    
    const dataToUpdate = { ...vehicleData };
    if (dataToUpdate.driverPhone === '') {
        dataToUpdate.driverPhone = null;
    }
    Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);
    await update(vehicleRef, dataToUpdate);
};

// Delete a vehicle from the database
export const deleteVehicle = async (userId: string, vehicleId: string) => {
    if (!userId) throw new Error('User not authenticated');
    const vehicleRef = ref(realtimeDB, `users/${userId}/vehicles/${vehicleId}`);
    await remove(vehicleRef);
};

// Delete a transaction from the database
export const deleteTransaction = async (userId: string, transactionId: string) => {
    if (!userId) throw new Error('User not authenticated');
    const transactionRef = ref(realtimeDB, `users/${userId}/transactions/${transactionId}`);
    await remove(transactionRef);
};

// Fetch a user's profile from the database
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = ref(realtimeDB, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        const profile = snapshot.val();
        return { uid: snapshot.key, ...profile } as UserProfile;
    } else {
        console.log("No such user profile!");
        return null;
    }
};

// Update a user's profile in both Firebase Auth and the database
export const updateUserProfileInDatabase = async (user: FirebaseUser, data: Partial<Omit<UserProfile, 'uid'>>) => {
    if (!user) throw new Error("User not authenticated");

    // Update Firebase Auth profile
    if (data.name) {
      await updateProfile(user, {
          displayName: data.name,
      });
    }

    // Update Realtime Database user document
    const userRef = ref(realtimeDB, `users/${user.uid}`);
    await update(userRef, data);
};

// Get custom categories for a user and type (income/expense)
export const getCategories = async (userId: string, type: 'income' | 'expense'): Promise<string[]> => {
  const categoriesRef = ref(realtimeDB, `users/${userId}/categories/${type}`);
  const snapshot = await get(categoriesRef);
  if (snapshot.exists()) {
    return Object.values(snapshot.val());
  }
  return [];
};

// Add a custom category for a user and type
export const addCategory = async (userId: string, type: 'income' | 'expense', category: string) => {
  const categoriesRef = ref(realtimeDB, `users/${userId}/categories/${type}`);
  // Use push to allow duplicate names, or set with category as key to prevent duplicates
  const newCategoryRef = push(categoriesRef);
  await set(newCategoryRef, category);
};

// Remove a custom category for a user and type
export const removeCategory = async (userId: string, type: 'income' | 'expense', category: string) => {
  const categoriesRef = ref(realtimeDB, `users/${userId}/categories/${type}`);
  const snapshot = await get(categoriesRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    const keyToRemove = Object.keys(data).find(key => data[key] === category);
    if (keyToRemove) {
      const categoryRef = ref(realtimeDB, `users/${userId}/categories/${type}/${keyToRemove}`);
      await remove(categoryRef);
    }
  }
};
