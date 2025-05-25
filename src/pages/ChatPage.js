
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  useTheme,
  InputAdornment,
  Tooltip,
  Button,
} from "@mui/material";
import EmojiPicker from "emoji-picker-react";
import { formatDistanceToNow } from "date-fns";
import debounce from "lodash.debounce";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
//import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ChatPage = () => {
  const { roomId } = useParams();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const chatEndRef = useRef(null);

  // Fetch room info
  useEffect(() => {
    const fetchRoomInfo = async () => {
      const roomRef = doc(db, "chatRooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        setIsGroupChat(data?.isGroup || false);
        setRoomName(data?.name || "Chat Room");
      }
    };
    if (roomId) fetchRoomInfo();
  }, [roomId]);

  // Typing status doc ref
  const typingRef = doc(
    db,
    "chatRooms",
    roomId,
    "typingStatus",
    currentUser.uid
  );

  // Update typing status with debounce
  const updateTyping = debounce(async (isTyping) => {
    await setDoc(
      typingRef,
      {
        isTyping,
        displayName: currentUser.displayName || currentUser.email,
      },
      { merge: true }
    );
  }, 300);

  // Listen for messages
  useEffect(() => {
    if (!roomId) return;
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);

      // Mark messages as read
      snapshot.docs.forEach((docSnap) => {
        const msg = docSnap.data();
        if (
          msg.senderUid !== currentUser.uid &&
          msg.read &&
          msg.read[currentUser.uid] === false
        ) {
          updateDoc(docSnap.ref, {
            [`read.${currentUser.uid}`]: true,
          });
        }
      });
    });

    return () => unsubscribe();
  }, [roomId, currentUser.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for typing users
  useEffect(() => {
    const typingCollection = collection(
      db,
      "chatRooms",
      roomId,
      "typingStatus"
    );

    const unsub = onSnapshot(typingCollection, (snapshot) => {
      const typing = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentUser.uid && data.isTyping) {
          typing.push(data.displayName || "Someone");
        }
      });
      setTypingUsers(typing);
    });

    return () => unsub();
  }, [roomId, currentUser.uid]);

  // Send message function
  const sendMessage = async () => {
    if ((!message.trim() && !fileUpload) || !roomId) return;
    setSending(true);

    let mediaUrl = null;
    let mediaType = null;

    try {
      if (fileUpload) {
  mediaUrl = await uploadFileToCloudinary(fileUpload);
  mediaType = fileUpload.type;
}


      // 🔁 Fetch participants and build readStatus
      const roomRef = doc(db, "chatRooms", roomId);
      const roomSnap = await getDoc(roomRef);
      let readStatus = {};
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const participants = roomData.participants || [];
        participants.forEach((uid) => {
          readStatus[uid] = uid === currentUser.uid;
        });
      }

      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: message.trim(),
        mediaUrl,
        mediaType,
        senderDisplayName:
          currentUser?.displayName || currentUser?.email || "Anonymous",
        avatar: currentUser?.photoURL || "",
        senderUid: currentUser?.uid || null,
        timestamp: serverTimestamp(),
        read: readStatus, // ✅ now valid
      });

      setMessage("");
      setFileUpload(null);
      setPreviewUrl(null);
      setShowEmojiPicker(false);
      updateTyping(false);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };


  // Handle file selection
//const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  const uploadFileToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url; // Return the URL of uploaded file
    } else {
      throw new Error("Cloudinary upload failed");
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileUpload(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  // Remove uploaded file before sending
  const removeFile = () => {
    setFileUpload(null);
    setPreviewUrl(null);
  };

  // Render media inside message bubble
  const renderMedia = (msg) => {
    if (!msg.mediaUrl) return null;
    if (msg.mediaType.startsWith("image/")) {
      return (
        <Box
          component="img"
          src={msg.mediaUrl}
          alt="upload"
          sx={{ maxWidth: "100%", borderRadius: 2, mt: 1, boxShadow: 3 }}
        />
      );
    } else if (msg.mediaType.startsWith("video/")) {
      return (
        <Box
          component="video"
          controls
          src={msg.mediaUrl}
          sx={{ maxWidth: "100%", mt: 1, borderRadius: 2, boxShadow: 3 }}
        />
      );
    } else if (msg.mediaType.startsWith("audio/")) {
      return (
        <audio
          controls
          src={msg.mediaUrl}
          style={{ marginTop: 8, width: "100%" }}
        />
      );
    } else {
      return (
        <a
          href={msg.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 8, display: "inline-block" }}
        >
          Download file
        </a>
      );
    }
  };

  return (
    <Box
      sx={{
        maxWidth: { xs: "100%", sm: 600, md: 700 },
        mx: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: isDark ? "#121212" : "#fafafa",
        position: "relative",
      }}
    >
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{
          color: isDark ? "#e0d7f5" : "#5B21B6",
          fontWeight: "bold",
          userSelect: "none",
        }}
      >
        {roomName}
      </Typography>

      {/* Messages container */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 2,
          px: 1,
          maxHeight: "70vh",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? "#7c3aed" : "#a78bfa",
            borderRadius: 4,
          },
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {messages.map((msg) => {
          const isCurrentUser = msg.senderUid === currentUser?.uid;
          return (
            <Box
              key={msg.id}
              sx={{
                alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                bgcolor: isCurrentUser
                  ? isDark
                    ? "#6b46c1"
                    : "#D8B4FE"
                  : isDark
                  ? "#301934"
                  : "#5B21B6",
                color: isCurrentUser
                  ? isDark
                    ? "#e0d7f5"
                    : "#4C1D95"
                  : isDark
                  ? "#dcd6f7"
                  : "#EDE9FE",
                maxWidth: "70%",
                p: 1,
                mb: 0,
                borderRadius: isCurrentUser
                  ? "16px 16px 0 16px"
                  : "16px 16px 16px 0",
                boxShadow: 2,
                wordBreak: "break-word",
                display: "flex",
                gap: 1,
              }}
            >
              {/* Avatar left for others */}
              {!isCurrentUser && (
                <Avatar
                  src={msg.avatar}
                  sx={{ alignSelf: "flex-end", width: 30, height: 30 }}
                />
              )}
              <Box sx={{ flexGrow: 1 }}>
                {/* Show sender name in group chat */}
                {isGroupChat && !isCurrentUser && (
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 0.3 }}
                  >
                    {msg.senderDisplayName || "Unknown"}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </Typography>
                {renderMedia(msg)}
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.7,
                    mt: 0.3,
                    display: "block",
                    textAlign: isCurrentUser ? "right" : "left",
                    userSelect: "none",
                  }}
                >
                  {msg.timestamp?.seconds
                    ? formatDistanceToNow(
                        new Date(msg.timestamp.seconds * 1000),
                        {
                          addSuffix: true,
                        }
                      )
                    : "Just now"}
                  {msg.read && isCurrentUser && " ✓"}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={chatEndRef} />
      </Box>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <Typography
          variant="body2"
          sx={{
            color: isDark ? "#b5b3b3" : "#5B21B6",
            fontStyle: "italic",
            mb: 1,
            userSelect: "none",
          }}
        >
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
          typing...
        </Typography>
      )}

      {/* File preview */}
      {fileUpload && (
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: isDark ? "#4c1d95" : "#e0d7f5",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                width: 70,
                height: 70,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                maxWidth: "70%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fileUpload.name}
            </Typography>
          )}
          <Tooltip title="Remove file">
            <IconButton size="small" onClick={removeFile}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Input area */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          position: "relative",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          sx={{
            color: "#7E57C2", // text color
            borderColor: "#8e44ad", // border color
          }}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            updateTyping(e.target.value.length > 0);
          }}
          onFocus={() => updateTyping(message.length > 0)}
          onBlur={() => updateTyping(false)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Tooltip title="Upload file">
                    <IconButton component="span" size="small">
                      <UploadFileIcon />
                    </IconButton>
                  </Tooltip>
                </label>
                <Tooltip title="Emoji picker">
                  <IconButton
                    sx={{ color: isDark ? "#a78bfa" : "#5B21B6" }}
                    onClick={() => setShowEmojiPicker((val) => !val)}
                    aria-label="Toggle emoji picker"
                  >
                    <InsertEmoticonIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          sx={{
            backgroundColor: "#8e44ad",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#732d91",
            },
          }}
          disabled={sending || (!message.trim() && !fileUpload)}
          endIcon={<SendIcon />}
        >
          Send
        </Button>
      </Box>

      {showEmojiPicker && (
        <Box
          sx={{
            position: "absolute",
            bottom: 70,
            right: 10,
            zIndex: 10,
            boxShadow: 3,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: isDark ? "#222" : "#fff",
            width: 300, // adjust width as needed
          }}
        >
          {/* Close button bar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              bgcolor: isDark ? "#333" : "#eee",
              p: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setShowEmojiPicker(false)}
              aria-label="Close emoji picker"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* The actual emoji picker */}
          <EmojiPicker
            onEmojiClick={(emojiData, event) => {
              setMessage((msg) => msg + emojiData.emoji);
            }}
            theme={isDark ? "dark" : "light"}
          />
        </Box>
      )}
    </Box>
  );
};

export default ChatPage;




// import { useParams } from "react-router-dom";
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   serverTimestamp,
//   doc,
//   setDoc,
//   updateDoc,
//   getDoc,
// } from "firebase/firestore";
// import { db, storage } from "../firebase";
// import { getAuth } from "firebase/auth";
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   Avatar,
//   CircularProgress,
//   IconButton,
//   useTheme,
//   InputAdornment,
//   Tooltip,
// } from "@mui/material";
// import EmojiPicker from "emoji-picker-react";
// import { formatDistanceToNow } from "date-fns";
// import debounce from "lodash.debounce";
// import UploadFileIcon from "@mui/icons-material/UploadFile";
// import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
// import SendIcon from "@mui/icons-material/Send";
// import CloseIcon from "@mui/icons-material/Close";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// const ChatPage = () => {
//   const { roomId } = useParams();
//   const auth = getAuth();
//   const currentUser = auth.currentUser;

//   const theme = useTheme();
//   const isDark = theme.palette.mode === "dark";

//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const [isGroupChat, setIsGroupChat] = useState(false);
//   const [roomName, setRoomName] = useState("");
//   const [fileUpload, setFileUpload] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const chatEndRef = useRef(null);

//   useEffect(() => {
//     const fetchRoomInfo = async () => {
//       const roomRef = doc(db, "chatRooms", roomId);
//       const roomSnap = await getDoc(roomRef);
//       if (roomSnap.exists()) {
//         const data = roomSnap.data();
//         setIsGroupChat(data?.isGroup || false);
//         setRoomName(data?.name || "Chat Room");
//       }
//     };

//     if (roomId) fetchRoomInfo();
//   }, [roomId]);

//   const typingRef = doc(db, "chatRooms", roomId, "typingStatus", currentUser.uid);
//   const updateTyping = debounce(async (isTyping) => {
//     await setDoc(
//       typingRef,
//       {
//         isTyping,
//         displayName: currentUser.displayName || currentUser.email,
//       },
//       { merge: true }
//     );
//   }, 300);

//   useEffect(() => {
//     if (!roomId) return;
//     const messagesRef = collection(db, "chatRooms", roomId, "messages");
//     const q = query(messagesRef, orderBy("timestamp", "asc"));

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const msgs = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setMessages(msgs);

//       snapshot.docs.forEach((docSnap) => {
//         const msg = docSnap.data();
//         if (msg.senderUid !== currentUser.uid && !msg.read) {
//           updateDoc(docSnap.ref, { read: true });
//         }
//       });
//     });

//     return () => unsubscribe();
//   }, [roomId, currentUser.uid]);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     const typingCollection = collection(db, "chatRooms", roomId, "typingStatus");

//     const unsub = onSnapshot(typingCollection, (snapshot) => {
//       const typing = [];
//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         if (doc.id !== currentUser.uid && data.isTyping) {
//           typing.push(data.displayName || "Someone");
//         }
//       });
//       setTypingUsers(typing);
//     });

//     return () => unsub();
//   }, [roomId, currentUser.uid]);

//   const sendMessage = async () => {
//     if ((!message.trim() && !fileUpload) || !roomId) return;

//     setSending(true);
//     let mediaUrl = null;
//     let mediaType = null;

//     try {
//       if (fileUpload) {
//         const fileRef = ref(storage, chatMedia/${roomId}/${Date.now()}_${fileUpload.name});
//         await uploadBytes(fileRef, fileUpload);
//         mediaUrl = await getDownloadURL(fileRef);
//         mediaType = fileUpload.type;
//       }

//       await addDoc(collection(db, "chatRooms", roomId, "messages"), {
//         text: message.trim(),
//         mediaUrl,
//         mediaType,
//         senderDisplayName: currentUser?.displayName || currentUser?.email || "Anonymous",
//         avatar: currentUser?.photoURL || "",
//         senderUid: currentUser?.uid || null,
//         timestamp: serverTimestamp(),
//         read: false,
//       });

//       setMessage("");
//       setFileUpload(null);
//       setPreviewUrl(null);
//       setShowEmojiPicker(false);
//       updateTyping(false);
//     } catch (err) {
//       console.error("Error sending message:", err);
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setFileUpload(file);
//     if (file.type.startsWith("image/")) {
//       setPreviewUrl(URL.createObjectURL(file));
//     } else {
//       setPreviewUrl(null);
//     }
//   };

//   const removeFile = () => {
//     setFileUpload(null);
//     setPreviewUrl(null);
//   };

//   const renderMedia = (msg) => {
//     if (!msg.mediaUrl) return null;
//     if (msg.mediaType.startsWith("image/")) {
//       return (
//         <Box
//           component="img"
//           src={msg.mediaUrl}
//           alt="upload"
//           sx={{ maxWidth: "100%", borderRadius: 2, mt: 1, boxShadow: 3 }}
//         />
//       );
//     } else if (msg.mediaType.startsWith("video/")) {
//       return (
//         <Box component="video" controls src={msg.mediaUrl} sx={{ maxWidth: "100%", mt: 1, borderRadius: 2, boxShadow: 3 }} />
//       );
//     } else if (msg.mediaType.startsWith("audio/")) {
//       return (
//         <audio controls src={msg.mediaUrl} style={{ marginTop: 8, width: "100%" }} />
//       );
//     } else {
//       return (
//         <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, display: "inline-block" }}>
//           Download file
//         </a>
//       );
//     }
//   };

//   return (
//     <Box
//       sx={{
//         maxWidth: 600,
//         margin: "0 auto",
//         p: 2,
//         display: "flex",
//         flexDirection: "column",
//         minHeight: "100vh",
//         bgcolor: isDark ? "#121212" : "#fafafa",
//       }}
//     >
//       <Typography
//         variant="h4"
//         gutterBottom
//         align="center"
//         sx={{ color: isDark ? "#e0d7f5" : "#5B21B6", fontWeight: "bold" }}
//       >
//         {roomName}
//       </Typography>

//       <Box
//         sx={{
//           flexGrow: 1,
//           overflowY: "auto",
//           mb: 2,
//           px: 1,
//           maxHeight: "70vh",
//           scrollbarWidth: "thin",
//           scrollbarColor: ${isDark ? "#7c3aed" : "#a78bfa"} transparent,
//           "&::-webkit-scrollbar": {
//             width: 8,
//           },
//           "&::-webkit-scrollbar-thumb": {
//             backgroundColor: isDark ? "#7c3aed" : "#a78bfa",
//             borderRadius: 4,
//           },
//         }}
//       >
//         {messages.map((msg) => {
//           const isCurrentUser = msg.senderUid === currentUser?.uid;

//           return (
//             <Box
//               key={msg.id}
//               sx={{
//                 alignSelf: isCurrentUser ? "flex-end" : "flex-start",
//                 bgcolor: isCurrentUser ? (isDark ? "#6b46c1" : "#D8B4FE") : (isDark ? "#301934" : "#5B21B6"),
//                 color: isCurrentUser ? (isDark ? "#e0d7f5" : "#4C1D95") : (isDark ? "#dcd6f7" : "#EDE9FE"),
//                 maxWidth: "60%",
//                 p: 1.5,
//                 mb: 1,
//                 borderRadius: isCurrentUser
//                   ? "16px 16px 0 16px"
//                   : "16px 16px 16px 0",
//                 boxShadow: 2,
//                 wordBreak: "break-word",
//                 display: "flex",
//                 gap: 1,
//               }}
//             >
//               {!isCurrentUser && (
//                 <Avatar
//                   src={msg.avatar}
//                   sx={{ alignSelf: "flex-end", width: 30, height: 30 }}
//                 />
//               )}
//               <Box sx={{ flexGrow: 1 }}>
//                 {isGroupChat && !isCurrentUser && (
//                   <Typography
//                     variant="subtitle2"
//                     fontWeight="bold"
//                     sx={{ mb: 0.3 }}
//                   >
//                     {msg.senderDisplayName || "Unknown"}
//                   </Typography>
//                 )}
//                 <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
//                   {msg.text}
//                 </Typography>
//                 {renderMedia(msg)}
//                 <Typography
//                   variant="caption"
//                   sx={{
//                     opacity: 0.7,
//                     mt: 0.3,
//                     display: "block",
//                     textAlign: isCurrentUser ? "right" : "left",
//                     userSelect: "none",
//                   }}
//                 >
//                   {msg.timestamp?.seconds
//                     ? formatDistanceToNow(new Date(msg.timestamp.seconds * 1000), {
//                         addSuffix: true,
//                       })
//                     : "Just now"}
//                   {isCurrentUser && msg.read && " · Seen"}
//                 </Typography>
//               </Box>
//               {isCurrentUser && (
//                 <Avatar
//                   src={msg.avatar}
//                   sx={{ alignSelf: "flex-end", width: 30, height: 30 }}
//                 />
//               )}
//             </Box>
//           );
//         })}
//         <div ref={chatEndRef} />
//       </Box>

//       {/* Typing indicator */}
//       {typingUsers.length > 0 && (
//         <Typography
//           variant="body2"
//           sx={{
//             mb: 1,
//             color: isDark ? "#bbb" : "#444",
//             fontStyle: "italic",
//             minHeight: 20,
//           }}
//         >
//           {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
//         </Typography>
//       )}

//       {/* Media preview */}
//       {previewUrl && (
//         <Box
//           sx={{
//             mb: 1,
//             position: "relative",
//             width: 120,
//             height: 120,
//             borderRadius: 2,
//             overflow: "hidden",
//             boxShadow: 3,
//           }}
//         >
//           <img
//             src={previewUrl}
//             alt="preview"
//             style={{ width: "100%", height: "100%", objectFit: "cover" }}
//           />
//           <IconButton
//             size="small"
//             onClick={removeFile}
//             sx={{
//               position: "absolute",
//               top: 2,
//               right: 2,
//               bgcolor: "rgba(0,0,0,0.4)",
//               color: "white",
//               "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
//             }}
//             aria-label="Remove file"
//           >
//             <CloseIcon fontSize="small" />
//           </IconButton>
//         </Box>
//       )}

//       {/* Input and buttons */}
//       <Box
//         component="form"
//         onSubmit={(e) => {
//           e.preventDefault();
//           sendMessage();
//         }}
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           gap: 1,
//           position: "relative",
//         }}
//       >
//         <TextField
//           variant="outlined"
//           placeholder="Type a message..."
//           fullWidth
//           value={message}
//           onChange={(e) => {
//             setMessage(e.target.value);
//             updateTyping(e.target.value.length > 0);
//           }}
//           onBlur={() => updateTyping(false)}
//           sx={{
//             bgcolor: isDark ? "#1e1e1e" : "#fff",
//             borderRadius: 25,
//             "& .MuiOutlinedInput-root": {
//               borderRadius: 25,
//               paddingRight: "8px",
//               bgcolor: isDark ? "#1e1e1e" : "#fff",
//             },
//           }}
//           InputProps={{
//             endAdornment: (
//               <InputAdornment position="end">
//                 <Tooltip title="Attach media">
//                   <IconButton
//                     component="label"
//                     sx={{ color: isDark ? "#a78bfa" : "#5B21B6" }}
//                     aria-label="Upload media"
//                   >
//                     <input
//                       hidden
//                       type="file"
//                       onChange={handleFileChange}
//                       accept="image/*,video/*,audio/*"
//                     />
//                     <UploadFileIcon />
//                   </IconButton>
//                 </Tooltip>
//                 <Tooltip title="Emoji picker">
//                   <IconButton
//                     sx={{ color: isDark ? "#a78bfa" : "#5B21B6" }}
//                     onClick={() => setShowEmojiPicker((val) => !val)}
//                     aria-label="Toggle emoji picker"
//                   >
//                     <InsertEmoticonIcon />
//                   </IconButton>
//                 </Tooltip>
//               </InputAdornment>
//             ),
//           }}
//         />

//         <Button
//           type="submit"
//           variant="contained"
//           color="primary"
//           disabled={sending || (!message.trim() && !fileUpload)}
//           sx={{
//             minWidth: 48,
//             minHeight: 48,
//             borderRadius: "50%",
//             padding: 0,
//             boxShadow: 3,
//           }}
//           aria-label="Send message"
//         >
//           {sending ? (
//             <CircularProgress size={24} color="inherit" />
//           ) : (
//             <SendIcon />
//           )}
//         </Button>
//       </Box>

//       {showEmojiPicker && (
//         <Box
//           sx={{
//             position: "absolute",
//             bottom: 80,
//             right: 16,
//             zIndex: 10,
//             boxShadow: 3,
//             borderRadius: 2,
//             overflow: "hidden",
//           }}
//         >
//           <EmojiPicker
//             onEmojiClick={(event, emojiObject) => {
//               setMessage((prev) => prev + emojiObject.emoji);
//               setShowEmojiPicker(false);
//             }}
//             theme={isDark ? "dark" : "light"}
//           />
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default ChatPage;
