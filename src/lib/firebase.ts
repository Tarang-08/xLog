// src/lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCCOlzs...yourKey",
  authDomain: "xlog-fakebook.firebaseapp.com",
  projectId: "xlog-fakebook",
  storageBucket: "xlog-fakebook.appspot.com",
  messagingSenderId: "653787404357",
  appId: "1:653787404357:web:7841c852e67e8ae572eb2c",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
