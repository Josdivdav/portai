import { initializeApp, getApps, getApp, cert, applicationDefault } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const serviceAccount = {
  projectId: "portai-b2311",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

export const app = getApps().length === 0
  ? initializeApp({
      credential:
        privateKey && process.env.FIREBASE_CLIENT_EMAIL
          ? cert(serviceAccount)
          : applicationDefault(),
      databaseURL: "https://portai-b2311-default-rtdb.firebaseio.com",
    })
  : getApp();

export const db = getDatabase(app);
export const adminAuth = getAuth(app);

