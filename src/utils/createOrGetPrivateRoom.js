import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // your initialized db

export const createOrGetPrivateRoom = async (uid1, uid2) => {
  const roomQuery = query(
    collection(db, "chatRooms"),
    where("participants", "in", [
      [uid1, uid2],
      [uid2, uid1]
    ])
  );

  const snapshot = await getDocs(roomQuery);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const newRoom = await addDoc(collection(db, "chatRooms"), {
    participants: [uid1, uid2],
    createdAt: new Date(),
  });

  return newRoom.id;
};
