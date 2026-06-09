// firebase.js (versão modular)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Configuração
const firebaseConfig = {
  apiKey: import.meta.env.VITE_REACT_APP_API_KEY,
  authDomain: import.meta.env.VITE_REACT_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_REACT_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_REACT_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_REACT_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_REACT_APP_APP_ID,
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta serviços
const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn("Firestore persistence failed-precondition: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore persistence unimplemented in this browser.");
    }
  });
}

const storage = getStorage(app);
const functions = getFunctions(app);

// Segunda instância de Auth
import { initializeApp as initializeApp2 } from 'firebase/app';
import { getAuth as getAuth2 } from 'firebase/auth';

const secondaryApp = initializeApp2(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth2(secondaryApp);

export { auth, db, storage, functions, secondaryAuth };
