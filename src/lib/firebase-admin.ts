// src/lib/firebase-admin.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK (singleton pattern)
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin environment variables:", {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey
    });
    throw new Error(
      "Missing required Firebase Admin environment variables. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  try {
    // Use the private key as-is since it should be properly formatted in GitHub Actions
    let formattedPrivateKey = privateKey;
    
    // Only do minimal processing - remove outer quotes if present
    if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
      formattedPrivateKey = formattedPrivateKey.slice(1, -1);
    }
    
    // Only replace escaped newlines if they exist (for local development)
    if (formattedPrivateKey.includes('\\n')) {
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    console.error("Environment check:", {
      projectId: projectId?.substring(0, 10) + "...",
      clientEmail: clientEmail?.substring(0, 20) + "...",
      privateKeyLength: privateKey?.length,
      privateKeyStart: privateKey?.substring(0, 30),
      privateKeyEnd: privateKey?.substring(privateKey?.length - 30)
    });
    throw error;
  }
}

// Export Firebase Admin Auth instance
export const adminAuth = getAuth();
