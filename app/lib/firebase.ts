import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBtaCMH97NYXFuUMd5OjGjEEs7DhLOlVek",
  authDomain: "portai-b2311.firebaseapp.com",
  databaseURL: "https://portai-b2311-default-rtdb.firebaseio.com",
  projectId: "portai-b2311",
  storageBucket: "portai-b2311.firebasestorage.app",
  messagingSenderId: "538113036385",
  appId: "1:538113036385:web:c7ec50981d28dc2eea1a20"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);