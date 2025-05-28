import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config'; // Import your Firebase app configuration

export const cadastrar = (email, senha) => {
  return createUserWithEmailAndPassword(auth, email, senha);
};

export const logar = (email, senha) => {
  return signInWithEmailAndPassword(auth, email, senha);
};

export const deslogar = () => {
  return signOut(auth);
};

export { auth };
