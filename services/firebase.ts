import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAUp8dYhEdQg2bPXUzFImctb2p_nGpSido",
  authDomain: "ourdigitalid-acebf.firebaseapp.com",
  projectId: "ourdigitalid-acebf",
  storageBucket: "ourdigitalid-acebf.firebasestorage.app",
  messagingSenderId: "390039241572",
  appId: "1:390039241572:web:c9870a1bed13071e597071",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
