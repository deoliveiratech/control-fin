// firebase.js (versão modular)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
const storage = getStorage(app);
const functions = getFunctions(app);

// Segunda instância de Auth
import { initializeApp as initializeApp2 } from 'firebase/app';
import { getAuth as getAuth2 } from 'firebase/auth';

const secondaryApp = initializeApp2(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth2(secondaryApp);

export { auth, db, storage, functions, secondaryAuth };
