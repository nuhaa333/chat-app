import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";  // your initialized Firestore instance

export const getOrCreatePrivateChatRoom = async (uid1, uid2) => {
  const roomsRef = collection(db, "chatRooms");

  // Query Firestore for rooms where participants are exactly [uid1, uid2] or [uid2, uid1]
  const q = query(
    roomsRef,
    where("participants", "in", [
      [uid1, uid2],
      [uid2, uid1],
    ])
  );

  const querySnapshot = await getDocs(q);

  // If room exists, return its id
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }

  // Otherwise, create a new chat room
  const newRoomRef = await addDoc(roomsRef, {
    participants: [uid1, uid2],
    createdAt: new Date(),
  });

  return newRoomRef.id;
};
