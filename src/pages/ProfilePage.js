import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signOut, deleteUser } from "firebase/auth";
import { db } from "../firebase";
//import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    displayName: "",
    avatarURL: "",
    statusMessage: "",
  });
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            displayName: data.displayName || "",
            avatarURL: data.avatarURL || "",
            statusMessage: data.statusMessage || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);

    // Preview
    const previewURL = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatarURL: previewURL }));
  };

  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`;
  const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  const handleSave = async () => {
    try {
      setUploading(true);

      let avatarURL = profile.avatarURL;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("upload_preset", UPLOAD_PRESET); // replace with your preset
        formData.append("folder", "chatUploads/avatars"); // optional folder

        const response = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        avatarURL = data.secure_url;
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...profile,
        avatarURL: avatarURL || "", // fallback to empty string
      });

      alert("Profile updated!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to update profile.");
    } finally {
      setUploading(false);
    }
  };

  // const handleSave = async () => {
  //   try {
  //     setUploading(true);

  //     let avatarURL = profile.avatarURL;

  //     if (avatarFile) {
  //       const storageRef = ref(storage, `avatars/${user.uid}`);
  //       await uploadBytes(storageRef, avatarFile);
  //       avatarURL = await getDownloadURL(storageRef);
  //     }

  //     const userRef = doc(db, "users", user.uid);
  //     await updateDoc(userRef, {
  //       ...profile,
  //       avatarURL,
  //     });

  //     alert("Profile updated!");
  //   } catch (err) {
  //     console.error("Error saving profile:", err);
  //     alert("Failed to update profile.");
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account. Please re-authenticate.");
    }
  };

  if (loading) {
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        width: "90%",
        mx: "auto",
        mt: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        align="center"
        sx={{ fontWeight: 600 }}
      >
        Your Profile
      </Typography>

      <Box textAlign="center" mb={2}>
        <Avatar
          src={profile.avatarURL}
          alt="avatar"
          sx={{
            width: { xs: 80, sm: 100 },
            height: { xs: 80, sm: 100 },
            mx: "auto",
            mb: 1,
          }}
        />
        <IconButton component="label" color="primary">
          <PhotoCamera />
          <input type="file" hidden onChange={handleAvatarChange} />
        </IconButton>
      </Box>

      <TextField
        fullWidth
        label="Display Name"
        name="displayName"
        value={profile.displayName}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Status Message"
        name="statusMessage"
        value={profile.statusMessage}
        onChange={handleChange}
        margin="normal"
      />

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleSave}
        sx={{ backgroundColor: "#8e44ad", mt: 2 }}
        disabled={uploading}
      >
        {uploading ? "Saving..." : "Save Profile"}
      </Button>

      <Button
        fullWidth
        variant="outlined"
        color="secondary"
        onClick={handleLogout}
        sx={{ mt: 1 }}
      >
        Logout
      </Button>

      <Button
        fullWidth
        variant="text"
        color="error"
        onClick={handleDeleteAccount}
        sx={{ mt: 2 }}
      >
        Delete Account
      </Button>
    </Box>
  );
};

export default ProfilePage;

// import React, { useState, useEffect } from 'react';
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from '../firebase';
// import {
//   Box,
//   TextField,
//   Button,
//   Avatar,
//   Typography,
//   CircularProgress
// } from '@mui/material';

// const ProfilePage = () => {
//   const auth = getAuth();
//   const user = auth.currentUser;
//   const [profile, setProfile] = useState({
//     displayName: '',
//     avatarURL: '',
//     statusMessage: ''
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) return;

//     const fetchProfile = async () => {
//       try {
//         const userRef = doc(db, 'users', user.uid);
//         const userSnap = await getDoc(userRef);

//         if (userSnap.exists()) {
//           setProfile(userSnap.data());
//         }
//       } catch (error) {
//         console.error('Error loading profile:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [user]);

//   const handleChange = (e) => {
//     setProfile({
//       ...profile,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSave = async () => {
//     try {
//       const userRef = doc(db, 'users', user.uid);
//       await updateDoc(userRef, profile);
//       alert('Profile updated!');
//     } catch (err) {
//       console.error('Error saving profile:', err);
//       alert('Error updating profile.');
//     }
//   };

//   if (loading) {
//     return (
//       <Box mt={10} textAlign="center">
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box maxWidth="400px" mx="auto" mt={5}>
//       <Typography variant="h5" gutterBottom>
//         Your Profile
//       </Typography>

//       <Avatar
//         src={profile.avatarURL}
//         alt="avatar"
//         sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
//       />

//       <TextField
//         fullWidth
//         label="Display Name"
//         name="displayName"
//         value={profile.displayName}
//         onChange={handleChange}
//         margin="normal"
//       />

//       <TextField
//         fullWidth
//         label="Avatar URL"
//         name="avatarURL"
//         value={profile.avatarURL}
//         onChange={handleChange}
//         margin="normal"
//       />

//       <TextField
//         fullWidth
//         label="Status Message"
//         name="statusMessage"
//         value={profile.statusMessage}
//         onChange={handleChange}
//         margin="normal"
//       />

//       <Button
//         fullWidth
//         variant="contained"
//         onClick={handleSave}
//         sx={{ mt: 2 }}
//       >
//         Save Profile
//       </Button>
//     </Box>
//   );
// };

// export default ProfilePage;
