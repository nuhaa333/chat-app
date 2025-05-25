// src/utils/presence.js
import { onDisconnect, onValue, ref, serverTimestamp, set } from "firebase/database";
import { doc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, rtdb } from "../firebase";

export const setupPresence = () => {
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const uid = user.uid;

    const userStatusDatabaseRef = ref(rtdb, "/status/" + uid);
    const userStatusFirestoreRef = doc(db, "users", uid);

    const isOfflineForDatabase = {
      state: "offline",
      lastChanged: Date.now(),
    };

    const isOnlineForDatabase = {
      state: "online",
      lastChanged: Date.now(),
    };

    const isOfflineForFirestore = {
      state: "offline",
      lastChanged: serverTimestamp(),
    };

    const isOnlineForFirestore = {
      state: "online",
      lastChanged: serverTimestamp(),
    };

    const connectedRef = ref(rtdb, ".info/connected");
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      onDisconnect(userStatusDatabaseRef)
        .set(isOfflineForDatabase)
        .then(() => {
          set(userStatusDatabaseRef, isOnlineForDatabase);
          setDoc(userStatusFirestoreRef, { status: isOnlineForFirestore }, { merge: true });
        });
    });

    // Optional cleanup on tab close
    window.addEventListener("beforeunload", () => {
      set(userStatusDatabaseRef, isOfflineForDatabase);
      setDoc(userStatusFirestoreRef, { status: isOfflineForFirestore }, { merge: true });
    });
  });
};
