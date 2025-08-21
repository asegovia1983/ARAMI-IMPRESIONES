import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDbr92kojwacuPImNU1kZgTL9-tRJO23yk",
    authDomain: "gmovil-ba644.firebaseapp.com",
    databaseURL: "https://gmovil-ba644.firebaseio.com",
    projectId: "gmovil-ba644",
    storageBucket: "gmovil-ba644.firebasestorage.app",
    messagingSenderId: "942168654235",
    appId: "1:942168654235:web:4f28d6f4334e8433"
  };

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);