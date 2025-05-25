import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { List, ListItem, Typography } from "@mui/material";
// Optional: UserStatus component to show online status
// import UserStatus from "./UserStatus"; 

const ChatRoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const roomsRef = collection(db, "chatRooms");
    const q = query(roomsRef, where("participants", "array-contains", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomsList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <List>
      {rooms.map((room) => {
        const otherParticipants = room.participants.filter(uid => uid !== currentUser.uid);
        const otherUserId = otherParticipants[0] || "Unknown";

        return (
          <ListItem
            key={room.id}
            button
            onClick={() => navigate(`/chat/${room.id}`)}
            sx={{ cursor: "pointer" }}
          >
            <Typography variant="body1">
              {room.isGroup
                ? room.name || "Unnamed Group"
                : `Chat with ${otherUserId}`}
              {/* Optional online status */}
              {/* {!room.isGroup && <UserStatus uid={otherUserId} />} */}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
};

export default ChatRoomsList;
