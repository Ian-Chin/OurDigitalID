import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { SavedDocument } from "@/context/AppContext";

const COLLECTION = "scanned_documents";

export async function fetchUserDocuments(userId: string): Promise<SavedDocument[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "",
      category: data.category || "",
      document: data.document || "",
      data: data.data || {},
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || new Date().toISOString(),
      verification: data.verification || undefined,
    } as SavedDocument;
  });
}

export async function addDocumentToFirestore(
  userId: string,
  document: Omit<SavedDocument, "id">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...document,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocumentInFirestore(
  docId: string,
  updates: Partial<SavedDocument>,
): Promise<void> {
  const docRef = doc(db, COLLECTION, docId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocumentFromFirestore(docId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, docId));
}
