import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { createOrGetPrivateRoom } from "../utils/createOrGetPrivateRoom";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Typography,
  Divider,
  Box,
  Paper,
  Stack,
  Badge,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import ChatNavbar from "../components/ChatNavbar";
import DeleteIcon from "@mui/icons-material/Delete";

const UsersList = ({ themeMode, toggleTheme }) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageCounts, setMessageCounts] = useState({}); // {roomId: unreadCount}
  const [privateRoomsMap, setPrivateRoomsMap] = useState({}); // { userUid: roomId }
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    roomId: null,
    isGroup: false,
    name: "",
  });

  const currentUser = getAuth().currentUser;
  const navigate = useNavigate();
  const theme = useTheme();

  // Fetch users and groups on mount
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.uid !== currentUser.uid);
      setUsers(list);
    };

    const fetchGroups = async () => {
      const q = query(
        collection(db, "chatRooms"),
        where("participants", "array-contains", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((room) => room.isGroup);
      setGroups(list);
    };

    fetchUsers();
    fetchGroups();
  }, [currentUser.uid]);

  // After users load, get private rooms for each user
  useEffect(() => {
    if (!users.length) return;

    const loadPrivateRooms = async () => {
      const map = {};
      await Promise.all(
        users.map(async (user) => {
          try {
            const roomId = await createOrGetPrivateRoom(
              currentUser.uid,
              user.uid
            );
            if (roomId) {
              map[user.uid] = roomId;
            }
          } catch (err) {
            console.error(
              "Error getting private room for user:",
              user.uid,
              err
            );
          }
        })
      );
      setPrivateRoomsMap(map);
    };

    loadPrivateRooms();
  }, [users, currentUser.uid]);

  // Fetch unread message counts for groups & private chats once privateRoomsMap & groups loaded
  useEffect(() => {
    if (!groups.length && Object.keys(privateRoomsMap).length === 0) return;

    const fetchUnreadCounts = async () => {
      const counts = {};

      // Groups unread counts
      await Promise.all(
        groups.map(async (group) => {
          try {
            const messagesCol = collection(
              db,
              "chatRooms",
              group.id,
              "messages"
            );
            const unreadQuery = query(
              messagesCol,
              where(`read.${currentUser.uid}`, "==", false)
            );
            const snapshot = await getCountFromServer(unreadQuery);
            counts[group.id] = snapshot.data().count || 0;
          } catch (err) {
            counts[group.id] = 0;
            console.error(
              "Error fetching unread count for group",
              group.id,
              err
            );
          }
        })
      );

      // Private chats unread counts
      await Promise.all(
        Object.entries(privateRoomsMap).map(async ([userUid, roomId]) => {
          try {
            const messagesCol = collection(db, "chatRooms", roomId, "messages");
            const unreadQuery = query(
              messagesCol,
              where(`read.${currentUser.uid}`, "==", false)
            );
            const snapshot = await getCountFromServer(unreadQuery);
            counts[roomId] = snapshot.data().count || 0;
          } catch (err) {
            console.error(
              "Error fetching unread count for private chat",
              userUid,
              err
            );
          }
        })
      );

      setMessageCounts(counts);
    };

    fetchUnreadCounts();
  }, [groups, privateRoomsMap, currentUser.uid]);

  const handleUserClick = (userUid) => {
    const roomId = privateRoomsMap[userUid];
    if (roomId) {
      navigate(`/chat/${roomId}`);
    } else {
      console.warn("No room found for user", userUid);
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/chat/${groupId}`);
  };

  // Delete Dialog handlers
  const openDeleteDialog = (roomId, isGroup, name) => {
    setDeleteDialog({ open: true, roomId, isGroup, name });
  };
  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, roomId: null, isGroup: false, name: "" });
  };

  const handleDelete = async () => {
    const { roomId, isGroup } = deleteDialog;
    try {
      // Delete the chatRoom document to remove group or private chat
      await deleteDoc(doc(db, "chatRooms", roomId));
      // Optionally, you could also delete messages subcollection if you want to fully clean

      // Update local state accordingly
      if (isGroup) {
        setGroups((prev) => prev.filter((g) => g.id !== roomId));
      } else {
        // Remove from privateRoomsMap & users (if needed)
        setPrivateRoomsMap((prev) => {
          const newMap = { ...prev };
          const userUid = Object.entries(prev).find(
            ([uid, rId]) => rId === roomId
          )?.[0];
          if (userUid) {
            delete newMap[userUid];
          }
          return newMap;
        });
      }
      // Close dialog
      closeDeleteDialog();
    } catch (err) {
      console.error("Failed to delete chat room:", err);
      closeDeleteDialog();
    }
  };

  // Filtering
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((user) => {
    const name = user.displayName || user.email || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Styles
  const sectionStyle = { mb: 3 };
  const cardStyle = {
    display: "flex",
    alignItems: "center",
    p: 2,
    mb: 1.5,
    borderRadius: 2,
    boxShadow: theme.palette.mode === "dark" ? 3 : 1,
    backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fff",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.02)",
      boxShadow: 4,
    },
    "&:hover .delete-icon": {
      opacity: 1,
      pointerEvents: "auto",
    },
  };

  return (
    <>
      <ChatNavbar
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <Box sx={{ padding: "1.5rem", maxWidth: 600, mx: "auto" }}>
        {/* Group Chats Section */}
        <Box sx={sectionStyle}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "#9c27b0",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              mb: 2,
              textShadow:
                "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)",
            }}
          >
            Group Chats
          </Typography>

          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <Paper
                key={group.id}
                sx={cardStyle}
                onClick={() => handleGroupClick(group.id)}
              >
                <Badge
                  badgeContent={messageCounts[group.id] || 0}
                  color="secondary"
                  invisible={!messageCounts[group.id]}
                  sx={{ mr: 1 }}
                >
                  <Avatar>{group.name.charAt(0).toUpperCase()}</Avatar>
                </Badge>
                <Typography sx={{ ml: 2, fontWeight: 500 }}>
                  {group.name}
                </Typography>

                {/* Delete icon, visible on hover */}
                <IconButton
                  className="delete-icon"
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0,
                    pointerEvents: "none",
                    transition: "opacity 0.3s",
                  }}
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(group.id, true, group.name);
                  }}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">No groups found.</Typography>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Users Section */}
        <Box sx={sectionStyle}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "#9c27b0",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              mb: 2,
              textShadow:
                "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)",
            }}
          >
            Users
          </Typography>

          {filteredUsers.length > 0 ? (
            <Stack spacing={1.5}>
              {filteredUsers.map((user) => {
                const roomId = privateRoomsMap[user.uid];
                const name = user.displayName || user.email || "Unknown User";
                return (
                  <Paper
                    key={user.uid}
                    sx={cardStyle}
                    onClick={() => handleUserClick(user.uid)}
                  >
                    <Badge
                      badgeContent={messageCounts[roomId] || 0}
                      color="secondary"
                      invisible={!messageCounts[roomId]}
                      sx={{ mr: 1 }}
                    >
                      <Avatar src={user.photoURL || ""}>
                        {name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {user.displayName}
                      </Typography>

                      {user.statusMessage && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontStyle: "italic",
                            fontSize: "0.75rem",
                            mt: 0.5,
                          }} // mt adds margin-top for spacing
                        >
                          {user.statusMessage}
                        </Typography>
                      )}
                    </Box>

                    {/* <Typography sx={{ ml: 2, fontWeight: 500 }}>
                      {name}
                    </Typography>
                    {user.statusMessage && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: "italic", fontSize: "0.75rem" }}
                      >
                        {user.statusMessage}
                      </Typography>
                    )} */}

                    {/* Delete icon, visible on hover */}
                    <IconButton
                      className="delete-icon"
                      sx={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0,
                        pointerEvents: "none",
                        transition: "opacity 0.3s",
                      }}
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (roomId) openDeleteDialog(roomId, false, name);
                      }}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary">No users found.</Typography>
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>
          Delete {deleteDialog.isGroup ? "Group" : "Chat"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.name}</strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UsersList;

// import React, { useEffect, useState } from "react";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   getCountFromServer,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../firebase";
// import { createOrGetPrivateRoom } from "../utils/createOrGetPrivateRoom";
// import { useNavigate } from "react-router-dom";
// import {
//   Avatar,
//   Typography,
//   Divider,
//   Box,
//   Paper,
//   Stack,
//   Badge,
//   useTheme,
// } from "@mui/material";
// import ChatNavbar from "../components/ChatNavbar";

// const UsersList = ({ themeMode, toggleTheme }) => {
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [messageCounts, setMessageCounts] = useState({}); // {roomId: unreadCount}
//   const [privateRoomsMap, setPrivateRoomsMap] = useState({}); // { userUid: roomId }
//   const currentUser = getAuth().currentUser;
//   const navigate = useNavigate();
//   const theme = useTheme();

//   // Fetch users and groups on mount
//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, "users"));
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((user) => user.uid !== currentUser.uid);
//       setUsers(list);
//     };

//     const fetchGroups = async () => {
//       const q = query(
//         collection(db, "chatRooms"),
//         where("participants", "array-contains", currentUser.uid)
//       );
//       const snapshot = await getDocs(q);
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((room) => room.isGroup);
//       setGroups(list);
//     };

//     fetchUsers();
//     fetchGroups();
//   }, [currentUser.uid]);

//   // After users load, get private rooms for each user
//   useEffect(() => {
//     if (!users.length) return;

//     const loadPrivateRooms = async () => {
//       const map = {};
//       await Promise.all(
//         users.map(async (user) => {
//           try {
//             const roomId = await createOrGetPrivateRoom(currentUser.uid, user.uid);
//             if (roomId) {
//               map[user.uid] = roomId;
//             }
//           } catch (err) {
//             console.error("Error getting private room for user:", user.uid, err);
//           }
//         })
//       );
//       setPrivateRoomsMap(map);
//     };

//     loadPrivateRooms();
//   }, [users, currentUser.uid]);

//   // Fetch unread message counts for groups & private chats once privateRoomsMap & groups loaded
//   useEffect(() => {
//     if (!groups.length && Object.keys(privateRoomsMap).length === 0) return;

//     const fetchUnreadCounts = async () => {
//       const counts = {};

//       // Groups unread counts
//       await Promise.all(
//         groups.map(async (group) => {
//           try {
//             const messagesCol = collection(db, "chatRooms", group.id, "messages");
//             const unreadQuery = query(
//               messagesCol,
//               where(`read.${currentUser.uid}`, "==", false)
//             );
//             const snapshot = await getCountFromServer(unreadQuery);
//             counts[group.id] = snapshot.data().count || 0;
//             console.log(`Group ${group.name} (${group.id}) unread count:`, counts[group.id]);
//           } catch (err) {
//             counts[group.id] = 0;
//             console.error("Error fetching unread count for group", group.id, err);
//           }
//         })
//       );

//       // Private chats unread counts
//       await Promise.all(
//         Object.entries(privateRoomsMap).map(async ([userUid, roomId]) => {
//           try {
//             const messagesCol = collection(db, "chatRooms", roomId, "messages");
//             const unreadQuery = query(
//               messagesCol,
//               where(`read.${currentUser.uid}`, "==", false)
//             );
//             const snapshot = await getCountFromServer(unreadQuery);
//             counts[roomId] = snapshot.data().count || 0;
//             console.log(`Private chat with user ${userUid} room ${roomId} unread:`, counts[roomId]);
//           } catch (err) {
//             console.error("Error fetching unread count for private chat", userUid, err);
//           }
//         })
//       );

//       setMessageCounts(counts);
//     };

//     fetchUnreadCounts();
//   }, [groups, privateRoomsMap, currentUser.uid]);

//   const handleUserClick = (userUid) => {
//     const roomId = privateRoomsMap[userUid];
//     if (roomId) {
//       navigate(`/chat/${roomId}`);
//     } else {
//       console.warn("No room found for user", userUid);
//     }
//   };

//   const handleGroupClick = (groupId) => {
//     navigate(`/chat/${groupId}`);
//   };

//   // Filtering
//   const filteredGroups = groups.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredUsers = users.filter((user) => {
//     const name = user.displayName || user.email || "";
//     return name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   // Styles
//   const sectionStyle = { mb: 3 };
//   const cardStyle = {
//     display: "flex",
//     alignItems: "center",
//     p: 2,
//     mb: 1.5,
//     borderRadius: 2,
//     boxShadow: theme.palette.mode === "dark" ? 3 : 1,
//     backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fff",
//     cursor: "pointer",
//     transition: "all 0.2s ease-in-out",
//     "&:hover": {
//       transform: "scale(1.02)",
//       boxShadow: 4,
//     },
//   };

//   return (
//     <>
//       <ChatNavbar
//         themeMode={themeMode}
//         toggleTheme={toggleTheme}
//         searchQuery={searchQuery}
//         onSearch={setSearchQuery}
//       />

//       <Box sx={{ padding: "1.5rem", maxWidth: 600, mx: "auto" }}>
//         {/* Group Chats Section */}
//         <Box sx={sectionStyle}>
//           <Typography
//             variant="h6"
//             gutterBottom
//             sx={{
//               color: "#9c27b0",
//               fontWeight: "bold",
//               textTransform: "uppercase",
//               letterSpacing: 1.2,
//               mb: 2,
//               textShadow:
//                 "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)",
//             }}
//           >
//             Group Chats
//           </Typography>

//           {filteredGroups.length > 0 ? (
//             filteredGroups.map((group) => (
//               <Paper
//                 key={group.id}
//                 sx={cardStyle}
//                 onClick={() => handleGroupClick(group.id)}
//               >
//                 <Badge
//                   badgeContent={messageCounts[group.id] || 0}
//                   color="secondary"
//                   invisible={!messageCounts[group.id]}
//                   sx={{ mr: 1 }}
//                 >
//                   <Avatar>{group.name.charAt(0).toUpperCase()}</Avatar>
//                 </Badge>
//                 <Typography sx={{ ml: 2, fontWeight: 500 }}>
//                   {group.name}
//                 </Typography>
//               </Paper>
//             ))
//           ) : (
//             <Typography color="text.secondary">No groups found.</Typography>
//           )}
//         </Box>

//         <Divider sx={{ my: 4 }} />

//         {/* Users Section */}
//         <Box sx={sectionStyle}>
//           <Typography
//             variant="h6"
//             gutterBottom
//             sx={{
//               color: "#9c27b0",
//               fontWeight: "bold",
//               textTransform: "uppercase",
//               letterSpacing: 1.2,
//               mb: 2,
//               textShadow:
//                 "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)",
//             }}
//           >
//             Users
//           </Typography>

//           {filteredUsers.length > 0 ? (
//             <Stack spacing={1.5}>
//               {filteredUsers.map((user) => {
//                 const roomId = privateRoomsMap[user.uid];
//                 return (
//                   <Paper
//                     key={user.uid}
//                     sx={cardStyle}
//                     onClick={() => handleUserClick(user.uid)}
//                   >
//                     <Badge
//                       badgeContent={roomId ? messageCounts[roomId] || 0 : 0}
//                       color="secondary"
//                       invisible={!roomId || !(messageCounts[roomId] > 0)}
//                       sx={{ mr: 1 }}
//                     >
//                       <Avatar src={user.photoURL} />
//                     </Badge>
//                     <Typography sx={{ ml: 2 }}>
//                       {user.displayName || user.email || "Unknown User"}
//                     </Typography>
//                   </Paper>
//                 );
//               })}
//             </Stack>
//           ) : (
//             <Typography color="text.secondary">No users found.</Typography>
//           )}
//         </Box>
//       </Box>
//     </>
//   );
// };

// export default UsersList;

// import React, { useEffect, useState } from "react";
// import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../firebase";
// import { createOrGetPrivateRoom } from "../utils/createOrGetPrivateRoom";
// import { useNavigate } from "react-router-dom";
// import {
//   Avatar,
//   Typography,
//   Divider,
//   Box,
//   Paper,
//   Stack,
//   useTheme,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogContentText,
//   DialogTitle,
// } from "@mui/material";
// import ChatNavbar from "../components/ChatNavbar";
// import useLongPress from "../hooks/useLongPress"; // Adjust the import path accordingly

// const cardStyle = (theme) => ({
//   display: "flex",
//   alignItems: "center",
//   p: 2,
//   mb: 1.5,
//   borderRadius: 2,
//   boxShadow: theme.palette.mode === "dark" ? 3 : 1,
//   backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fff",
//   cursor: "pointer",
//   transition: "all 0.2s ease-in-out",
//   "&:hover": {
//     transform: "scale(1.02)",
//     boxShadow: 4,
//   },
// });

// const GroupCard = ({ group, onClick, onLongPress, theme }) => {
//   const longPressHandlers = useLongPress(onLongPress, 600);

//   return (
//     <Paper
//       sx={cardStyle(theme)}
//       onClick={onClick}
//       {...longPressHandlers}
//     >
//       <Avatar>{group.name.charAt(0).toUpperCase()}</Avatar>
//       <Typography sx={{ ml: 2, fontWeight: 500 }}>
//         {group.name}
//       </Typography>
//     </Paper>
//   );
// };

// const UserCard = ({ user, onClick, onLongPress, theme }) => {
//   const longPressHandlers = useLongPress(onLongPress, 600);

//   return (
//     <Paper
//       sx={cardStyle(theme)}
//       onClick={onClick}
//       {...longPressHandlers}
//     >
//       <Avatar src={user.photoURL} />
//       <Typography sx={{ ml: 2 }}>
//         {user.displayName || user.email || "Unknown User"}
//       </Typography>
//     </Paper>
//   );
// };

// const UsersList = ({ themeMode, toggleTheme }) => {
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedToDelete, setSelectedToDelete] = useState(null);
//   const [deleteType, setDeleteType] = useState(null); // "user" or "group"
//   const [confirmOpen, setConfirmOpen] = useState(false);

//   const currentUser = getAuth().currentUser;
//   const navigate = useNavigate();
//   const theme = useTheme();

//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, "users"));
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((user) => user.uid !== currentUser.uid);
//       setUsers(list);
//     };

//     const fetchGroups = async () => {
//       const q = query(
//         collection(db, "chatRooms"),
//         where("participants", "array-contains", currentUser.uid)
//       );
//       const snapshot = await getDocs(q);
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((room) => room.isGroup);
//       setGroups(list);
//     };

//     fetchUsers();
//     fetchGroups();
//   }, [currentUser.uid]);

//   const handleUserClick = async (otherUserUid) => {
//     const roomId = await createOrGetPrivateRoom(currentUser.uid, otherUserUid);
//     navigate(`/chat/${roomId}`);
//   };

//   const handleGroupClick = (groupId) => {
//     navigate(`/chat/${groupId}`);
//   };

//   const filteredGroups = groups.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredUsers = users.filter((user) => {
//     const name = user.displayName || user.email || "";
//     return name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   // Confirm delete dialog handlers
//   const handleDeleteConfirm = async () => {
//     if (!selectedToDelete) return;
//     try {
//       if (deleteType === "group") {
//         await deleteDoc(doc(db, "chatRooms", selectedToDelete));
//         setGroups((prev) => prev.filter((g) => g.id !== selectedToDelete));
//       } else if (deleteType === "user") {
//         // For private chats, you might want to delete the room or the relationship —
//         // here we just remove the user from the list, since you can't delete users from DB.
//         setUsers((prev) => prev.filter((u) => u.uid !== selectedToDelete));
//         // Optionally: delete private chat rooms involving this user if your app supports that.
//       }
//       setConfirmOpen(false);
//       setSelectedToDelete(null);
//       setDeleteType(null);
//     } catch (error) {
//       console.error("Error deleting:", error);
//     }
//   };

//   const handleDeleteCancel = () => {
//     setConfirmOpen(false);
//     setSelectedToDelete(null);
//     setDeleteType(null);
//   };

//   const onLongPressGroup = (groupId) => {
//     setSelectedToDelete(groupId);
//     setDeleteType("group");
//     setConfirmOpen(true);
//   };

//   const onLongPressUser = (userUid) => {
//     setSelectedToDelete(userUid);
//     setDeleteType("user");
//     setConfirmOpen(true);
//   };

//   return (
//     <>
//       <ChatNavbar
//         themeMode={themeMode}
//         toggleTheme={toggleTheme}
//         searchQuery={searchQuery}
//         onSearch={setSearchQuery}
//       />

//       <Box sx={{ padding: "1.5rem", maxWidth: 600, mx: "auto" }}>
//         {/* Group Chats Section */}
//         <Box sx={{ mb: 3 }}>
//           <Typography
//             variant="h6"
//             gutterBottom
//             sx={{
//               color: "#9c27b0",
//               fontWeight: "bold",
//               textTransform: "uppercase",
//               letterSpacing: 1.2,
//               mb: 2,
//               textShadow:
//                 "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)",
//             }}
//           >
//             Group Chats
//           </Typography>

//           {filteredGroups.length > 0 ? (
//             filteredGroups.map((group) => (
//               <GroupCard
//                 key={group.id}
//                 group={group}
//                 onClick={() => handleGroupClick(group.id)}
//                 onLongPress={() => onLongPressGroup(group.id)}
//                 theme={theme}
//               />
//             ))
//           ) : (
//             <Typography color="text.secondary">No groups found.</Typography>
//           )}
//         </Box>

//         <Divider sx={{ my: 4 }} />

//         {/* Users Section */}
//         <Box sx={{ mb: 3 }}>
//           <Typography
//             variant="h6"
//             gutterBottom
//             sx={{
//               color: "#9c27b0",
//               fontWeight: "bold",
//               textTransform: "uppercase",
//               letterSpacing: 1.2,
//               mb: 2,
//               textShadow:
//                 "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)",
//             }}
//           >
//             Users
//           </Typography>

//           {filteredUsers.length > 0 ? (
//             <Stack spacing={1.5}>
//               {filteredUsers.map((user) => (
//                 <UserCard
//                   key={user.uid}
//                   user={user}
//                   onClick={() => handleUserClick(user.uid)}
//                   onLongPress={() => onLongPressUser(user.uid)}
//                   theme={theme}
//                 />
//               ))}
//             </Stack>
//           ) : (
//             <Typography color="text.secondary">No users found.</Typography>
//           )}
//         </Box>
//       </Box>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={confirmOpen} onClose={handleDeleteCancel}>
//         <DialogTitle>Confirm Delete</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Are you sure you want to delete this {deleteType === "group" ? "group chat" : "chat"}?
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleDeleteCancel} color="primary">
//             Cancel
//           </Button>
//           <Button onClick={handleDeleteConfirm} color="error" variant="contained">
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// };

// export default UsersList;

// import React, { useEffect, useState } from "react";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../firebase";
// import { createOrGetPrivateRoom } from "../utils/createOrGetPrivateRoom";
// import { useNavigate } from "react-router-dom";
// import {
//   Avatar,
//   Typography,
//   Divider,
//   Box,
//   Paper,
//   Stack,
//   useTheme,
// } from "@mui/material";
// import ChatNavbar from "../components/ChatNavbar";

// const UsersList = ({ themeMode, toggleTheme }) => {
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const currentUser = getAuth().currentUser;
//   const navigate = useNavigate();
//   const theme = useTheme();

//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, "users"));
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((user) => user.uid !== currentUser.uid);
//       setUsers(list);
//     };

//     const fetchGroups = async () => {
//       const q = query(
//         collection(db, "chatRooms"),
//         where("participants", "array-contains", currentUser.uid)
//       );
//       const snapshot = await getDocs(q);
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((room) => room.isGroup);
//       setGroups(list);
//     };

//     fetchUsers();
//     fetchGroups();
//   }, [currentUser.uid]);

//   const handleUserClick = async (otherUserUid) => {
//     const roomId = await createOrGetPrivateRoom(currentUser.uid, otherUserUid);
//     navigate(`/chat/${roomId}`);
//   };

//   const handleGroupClick = (groupId) => {
//     navigate(`/chat/${groupId}`);
//   };

//   const filteredGroups = groups.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredUsers = users.filter((user) => {
//     const name = user.displayName || user.email || "";
//     return name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const sectionStyle = {
//     mb: 3,
//   };

//   const cardStyle = {
//     display: "flex",
//     alignItems: "center",
//     p: 2,
//     mb: 1.5,
//     borderRadius: 2,
//     boxShadow: theme.palette.mode === "dark" ? 3 : 1,
//     backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fff",
//     cursor: "pointer",
//     transition: "all 0.2s ease-in-out",
//     "&:hover": {
//       transform: "scale(1.02)",
//       boxShadow: 4,
//     },
//   };

//   return (
//     <>
//       <ChatNavbar
//         themeMode={themeMode}
//         toggleTheme={toggleTheme}
//         searchQuery={searchQuery}
//         onSearch={setSearchQuery}
//       />

//       <Box sx={{ padding: "1.5rem", maxWidth: 600, mx: "auto" }}>
//         {/* Group Chats Section */}
//         <Box sx={sectionStyle}>
//           <Typography
//             variant="h6"
//             gutterBottom
//             sx={{
//               color: "#9c27b0", // lighter purple
//               fontWeight: "bold",
//               textTransform: "uppercase",
//               letterSpacing: 1.2,
//               mb: 2,
//               textShadow:
//                 "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)", // purple glow
//             }}
//           >
//             Group Chats
//           </Typography>

//           {filteredGroups.length > 0 ? (
//             filteredGroups.map((group) => (
//               <Paper
//                 key={group.id}
//                 sx={cardStyle}
//                 onClick={() => handleGroupClick(group.id)}
//               >
//                 <Avatar>{group.name.charAt(0).toUpperCase()}</Avatar>
//                 <Typography sx={{ ml: 2, fontWeight: 500 }}>
//                   {group.name}
//                 </Typography>
//               </Paper>
//             ))
//           ) : (
//             <Typography color="text.secondary">No groups found.</Typography>
//           )}
//         </Box>

//         <Divider sx={{ my: 4 }} />

//         {/* Users Section */}
//         <Box sx={sectionStyle}>
//           <Typography
//             variant="h6"
//             gutterBottom
//             sx={{
//               color: "#9c27b0", // lighter purple
//               fontWeight: "bold",
//               textTransform: "uppercase",
//               letterSpacing: 1.2,
//               mb: 2,
//               textShadow:
//                 "0 0 8px rgba(156, 39, 176, 0.3), 0 0 20px rgba(156, 39, 176, 0.3)", // purple glow
//             }}
//           >
//             Users
//           </Typography>

//           {filteredUsers.length > 0 ? (
//             <Stack spacing={1.5}>
//               {filteredUsers.map((user) => (
//                 <Paper
//                   key={user.uid}
//                   sx={cardStyle}
//                   onClick={() => handleUserClick(user.uid)}
//                 >
//                   <Avatar src={user.photoURL} />
//                   <Typography sx={{ ml: 2 }}>
//                     {user.displayName || user.email || "Unknown User"}
//                   </Typography>
//                 </Paper>
//               ))}
//             </Stack>
//           ) : (
//             <Typography color="text.secondary">No users found.</Typography>
//           )}
//         </Box>
//       </Box>
//     </>
//   );
// };

// export default UsersList;

// import React, { useEffect, useState } from "react";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../firebase";
// import { createOrGetPrivateRoom } from "../utils/createOrGetPrivateRoom";
// import { useNavigate } from "react-router-dom";
// import {
//   List,
//   ListItem,
//   Avatar,
//   Typography,
//   Divider,
//   Box,
// } from "@mui/material";
// import ChatNavbar from "../components/ChatNavbar";

// const UsersList = ({ themeMode, toggleTheme }) => {
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const currentUser = getAuth().currentUser;
//   const [searchQuery, setSearchQuery] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, "users"));
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((user) => user.uid !== currentUser.uid);
//       setUsers(list);
//     };

//     const fetchGroups = async () => {
//       const q = query(
//         collection(db, "chatRooms"),
//         where("participants", "array-contains", currentUser.uid)
//       );
//       const snapshot = await getDocs(q);
//       const list = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((room) => room.isGroup);
//       setGroups(list);
//     };

//     fetchUsers();
//     fetchGroups();
//   }, [currentUser.uid]);

//   const handleUserClick = async (otherUserUid) => {
//     const roomId = await createOrGetPrivateRoom(currentUser.uid, otherUserUid);
//     navigate(`/chat/${roomId}`);
//   };

//   const handleGroupClick = (groupId) => {
//     navigate(`/chat/${groupId}`);
//   };

//   // Filter groups & users based on searchQuery (case insensitive)
//   const filteredGroups = groups.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredUsers = users.filter((user) => {
//     const name = user.displayName || user.email || "";
//     return name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   return (
//     <>
//       <ChatNavbar
//         themeMode={themeMode}
//         toggleTheme={toggleTheme}
//         searchQuery={searchQuery}
//         onSearch={setSearchQuery}
//       />

//       <Box sx={{ padding: "1rem" }}>
//         <Typography variant="h6">Group Chats</Typography>
//         {filteredGroups.length > 0 ? (
//           <List>
//             {filteredGroups.map((group) => (
//               <ListItem
//                 button
//                 key={group.id}
//                 onClick={() => handleGroupClick(group.id)}
//                 sx={{ cursor: "pointer" }}
//               >
//                 <Avatar>{group.name.charAt(0)}</Avatar>
//                 <Typography sx={{ ml: 2 }}>{group.name}</Typography>
//               </ListItem>
//             ))}
//           </List>
//         ) : (
//           <Typography>No groups found.</Typography>
//         )}

//         <Divider sx={{ my: 3 }} />

//         <Typography variant="h6">Users</Typography>
//         <List>
//           {filteredUsers.length > 0 ? (
//             filteredUsers.map((user) => (
//               <ListItem
//                 button
//                 key={user.uid}
//                 onClick={() => handleUserClick(user.uid)}
//                 sx={{ cursor: "pointer" }}
//               >
//                 <Avatar src={user.photoURL} />
//                 <Typography sx={{ ml: 2 }}>
//                   {user.displayName || user.email || "Unknown User"}
//                 </Typography>
//               </ListItem>
//             ))
//           ) : (
//             <Typography>No users found.</Typography>
//           )}
//         </List>
//       </Box>
//     </>
//   );
// };

// export default UsersList;
