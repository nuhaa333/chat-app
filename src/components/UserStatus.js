import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { formatDistanceToNow } from "date-fns";

const UserStatus = ({ uid }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", uid), (docSnap) => {
      const data = docSnap.data();
      setStatus(data?.status || null);
    });

    return () => unsub();
  }, [uid]);

  if (!status) return null;

  return (
    <span style={{ fontSize: "0.8rem", color: status.state === "online" ? "green" : "gray" }}>
      {status.state === "online"
        ? "🟢 Online"
        : `🔘 Last seen ${formatDistanceToNow(new Date(status.lastChanged.seconds * 1000))} ago`}
    </span>
  );
};

export default UserStatus;
