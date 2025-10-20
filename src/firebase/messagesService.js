// src/firebase/messagesService.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Find an existing conversation between two users or create one.
 */
export async function getOrCreateConversation(uidA, uidB) {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", uidA)
  );
  const snapshot = await getDocs(q);

  let existing = null;
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.participants.includes(uidB))
      existing = { id: docSnap.id, ...data };
  });

  if (existing) return existing;

  // Create new conversation
  const newConv = await addDoc(conversationsRef, {
    participants: [uidA, uidB],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "",
  });

  return { id: newConv.id, participants: [uidA, uidB] };
}

/**
 * Get all user conversations
 */
export async function getUserConversations(uid) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * Send message
 */
export async function sendMessage(conversationId, senderId, text) {
  const msgRef = collection(db, "conversations", conversationId, "messages");
  await addDoc(msgRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  // update conversation lastMessage
  const convRef = doc(db, "conversations", conversationId);
  await updateDoc(convRef, {
    lastMessage: text,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all messages once
 */
export async function getMessages(conversationId) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Listen to messages live
 */
export function listenToMessages(conversationId, callback) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}
