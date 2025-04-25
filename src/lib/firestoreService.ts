import { collection, getDocs } from "firebase/firestore"

import { db } from "./firebase" // your firebase.ts export

export const getPosts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "posts"))
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching posts:", error)
    return []
  }
}
