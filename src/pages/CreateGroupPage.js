import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
//import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../firebase";  // make sure you export 'storage' from your firebase config
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Button,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  Avatar,
  IconButton,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

const CreateGroupPage = () => {
  const [groupName, setGroupName] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [groupImageUrl, setGroupImageUrl] = useState(null);
  const [groupImageFile, setGroupImageFile] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const users = snapshot.docs
          .map((doc) => ({ uid: doc.id, ...doc.data() }))
          .filter((user) => user.uid !== currentUser?.uid);
        setAllUsers(users);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser?.uid]);

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingImage(true);
  setGroupImageFile(file);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      setGroupImageUrl(data.secure_url);
    } else {
      throw new Error("Cloudinary upload failed");
    }
  } catch (error) {
    console.error("Failed to upload image", error);
  } finally {
    setUploadingImage(false);
  }
};


  const handleCreateGroup = async () => {
    if (!currentUser || !groupName || selectedUsers.length === 0) return;

    const participants = [
      currentUser.uid,
      ...selectedUsers.map((user) => user.uid),
    ];

    const newGroup = {
      name: groupName,
      participants,
      isGroup: true,
      createdAt: serverTimestamp(),
      groupImageUrl: groupImageUrl || null,
    };

    const docRef = await addDoc(collection(db, "chatRooms"), newGroup);
    navigate(`/chat/${docRef.id}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          borderRadius: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 600, textAlign: "center", color: "#5E35B1" }}
        >
          Create Group Chat
        </Typography>

        {/* Group Image Upload */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 2,
            position: "relative",
          }}
        >
          <Avatar
            src={groupImageUrl || ""}
            alt="Group Profile"
            sx={{ width: 100, height: 100, bgcolor: "#b39ddb" }}
          >
            {!groupImageUrl && groupName ? groupName[0].toUpperCase() : ""}
          </Avatar>
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="label"
            sx={{ position: "absolute", bottom: 0, right: "calc(50% - 50px)" }}
          >
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageChange}
              disabled={uploadingImage}
            />
            <PhotoCamera />
          </IconButton>
        </Box>

        <TextField
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
        />

        <Autocomplete
          multiple
          options={allUsers}
          getOptionLabel={(option) => option.displayName || option.email}
          filterSelectedOptions
          onChange={(event, newValue) => setSelectedUsers(newValue)}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add Participants"
              placeholder="Search by name or email"
              margin="normal"
              fullWidth
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Button
          variant="contained"
          onClick={handleCreateGroup}
          disabled={!groupName || selectedUsers.length === 0 || uploadingImage}
          fullWidth
          sx={{
            mt: 3,
            py: 1.3,
            backgroundColor: "#7E57C2",
            "&:hover": {
              backgroundColor: "#5E35B1",
            },
            fontWeight: "bold",
          }}
        >
          {uploadingImage ? "Uploading Image..." : "Create Group"}
        </Button>
      </Paper>
    </Box>
  );
};

export default CreateGroupPage;









// import { useState, useEffect } from "react";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "../firebase";
// import { getAuth } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import {
//   Button,
//   TextField,
//   Typography,
//   Autocomplete,
//   CircularProgress,
// } from "@mui/material";

// const CreateGroupPage = () => {
//   const [groupName, setGroupName] = useState("");
//   const [allUsers, setAllUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();
//   const auth = getAuth();
//   const currentUser = auth.currentUser;

//   // Fetch all users
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, "users"));
//         const users = snapshot.docs
//           .map((doc) => ({
//             uid: doc.id,
//             ...doc.data(),
//           }))
//           .filter((user) => user.uid !== currentUser?.uid); // exclude self
//         setAllUsers(users);
//       } catch (err) {
//         console.error("Failed to load users:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUsers();
//   }, [currentUser?.uid]);

//   const handleCreateGroup = async () => {
//     if (!currentUser || !groupName || selectedUsers.length === 0) return;

//     const participants = [
//       currentUser.uid,
//       ...selectedUsers.map((user) => user.uid),
//     ];

//     const docRef = await addDoc(collection(db, "chatRooms"), {
//       name: groupName,
//       participants,
//       isGroup: true,
//       createdAt: serverTimestamp(),
//     });

//     navigate(`/chat/${docRef.id}`);
//   };

//   return (
//     <div style={{ padding: "2rem", maxWidth: 500, margin: "auto" }}>
//       <Typography variant="h5" gutterBottom>
//         Create Group Chat
//       </Typography>

//       <TextField
//         label="Group Name"
//         value={groupName}
//         onChange={(e) => setGroupName(e.target.value)}
//         fullWidth
//         margin="normal"
//       />

//       <Autocomplete
//         multiple
//         options={allUsers}
//         getOptionLabel={(option) => option.displayName || option.email}
//         filterSelectedOptions
//         onChange={(event, newValue) => setSelectedUsers(newValue)}
//         loading={loading}
//         renderInput={(params) => (
//           <TextField
//             {...params}
//             label="Add Participants"
//             placeholder="Search by name or email"
//             margin="normal"
//             fullWidth
//             InputProps={{
//               ...params.InputProps,
//               endAdornment: (
//                 <>
//                   {loading ? <CircularProgress size={20} /> : null}
//                   {params.InputProps.endAdornment}
//                 </>
//               ),
//             }}
//           />
//         )}
//       />

//       <Button
//         variant="contained"
//         color="primary"
//         onClick={handleCreateGroup}
//         disabled={!groupName || selectedUsers.length === 0}
//         fullWidth
//         sx={{ mt: 2 }}
//       >
//         Create Group
//       </Button>
//     </div>
//   );
// };

// export default CreateGroupPage;
