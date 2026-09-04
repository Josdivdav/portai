import admin from "firebase-admin";
import dotenv from "dotenv";
import { getDatabase } from "firebase-admin/database";
dotenv.config({ path: "../../.env" });

const serviceAccount = {
  type: "service_account",
  project_id: "portai-b2311",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
  credential: admin.cert(serviceAccount as object),
  databaseURL: "https://portai-b2311-default-rtdb.firebaseio.com"
});

export const app = admin.getApp();

export const db = getDatabase(app);
