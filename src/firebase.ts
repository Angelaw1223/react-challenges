import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMTfdD9mPCV-RFccmW8_WRUw7Ebear8lk",
  authDomain: "react-challenges-97dc1.firebaseapp.com",
  projectId: "react-challenges-97dc1",
  storageBucket: "react-challenges-97dc1.firebasestorage.app",
  messagingSenderId: "401450282446",
  appId: "1:401450282446:web:078e2d2115a30f7cb08f9f",
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const signInWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider());

export const signOutUser = () => signOut(auth);
