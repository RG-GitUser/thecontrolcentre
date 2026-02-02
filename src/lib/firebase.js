import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const env = import.meta.env
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA8lS4Ajlrgryfd_mPXsVLh8B3KZ7fFKk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'control-centre-47404.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'control-centre-47404',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'control-centre-47404.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '85650592861',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:85650592861:web:e946c2fd95688930c4e9b4',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-BRYKSMMX7Y',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
