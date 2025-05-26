import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "@mui/icons-material/Google";
import { registerWithEmail, loginWithGoogle } from "../services/auth";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Container,
} from "@mui/material";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const saveUserToFirestore = async (user) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      lastLogin: new Date(),
    },
    { merge: true }
  );
};

const avatarUrls = [
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Kurt&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=WinkWacky&eyebrowType=SadConcerned&mouthType=Smile&skinColor=Brown",
  "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Round&hairColor=Blue&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=Black&eyeType=Hearts&eyebrowType=RaisedExcited&mouthType=Serious&skinColor=Tanned",
  "https://avataaars.io/?avatarStyle=Circle&topType=Hijab&accessoriesType=Round&hatColor=White&clotheType=Overall&clotheColor=Red&eyeType=Happy&eyebrowType=FlatNatural&mouthType=Default&skinColor=Light",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Prescription01&hairColor=BrownDark&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerSweater&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Serious&skinColor=Yellow",
  "https://avataaars.io/?avatarStyle=Circle&topType=LongHairCurly&accessoriesType=Sunglasses&hairColor=Black&facialHairType=MoustacheMagnum&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=PastelYellow&eyeType=Dizzy&eyebrowType=UnibrowNatural&mouthType=Sad&skinColor=Tanned",
  "https://avataaars.io/?avatarStyle=Circle&topType=Hat&accessoriesType=Kurt&facialHairType=BeardMajestic&facialHairColor=Brown&clotheType=BlazerShirt&eyeType=Side&eyebrowType=UpDown&mouthType=Disbelief&skinColor=Tanned",
  "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBob&accessoriesType=Round&hairColor=Blue&facialHairType=Blank&facialHairColor=Blonde&clotheType=ShirtVNeck&clotheColor=Blue02&eyeType=EyeRoll&eyebrowType=SadConcerned&mouthType=Sad&skinColor=Brown",
];

const WelcomeScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // const handleEmailLogin = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const res = await loginWithEmail(email, password);
  //     console.log("Login successful", res.user);
  //     await saveUserToFirestore(res.user);
  //     navigate("/users");
  //   } catch (err) {
  //     console.error("Login error:", err.message);
  //     alert("Login failed: " + err.message);
  //   }
  // };

  const handleEmailRegister = async (e) => {
  e.preventDefault();
  try {
    const res = await registerWithEmail(email, password);
    console.log("Registration successful", res.user);
    await saveUserToFirestore(res.user);
    navigate("/users");
  } catch (err) {
    console.error("Registration error:", err);
    alert("Registration failed: " + err.message);
  }
};

  const handleGoogleLogin = async () => {
    try {
      const res = await loginWithGoogle();
      console.log("Google login success:", res.user);
      await saveUserToFirestore(res.user);
      navigate("/users");
    } catch (err) {
      console.error("Google login error:", err.message);
      alert("Google login failed: " + err.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 5 }}>
      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        {avatarUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Avatar ${index}`}
            width="80"
            height="80"
            style={{ borderRadius: "50%" }}
          />
        ))}
      </Box>

      <Typography variant="h4" mt={4} fontWeight="bold">
        Welcome to Real Chat
      </Typography>
      <Typography variant="body1" mt={1} color="text.secondary">
        Connect with anyone, anytime. Let's get started!
      </Typography>

      <Box component="form" mt={3} mb={2} onSubmit={ handleEmailRegister}>
        <TextField
          label="Email"
          fullWidth
          type="email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            backgroundColor: "#8e44ad",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#732d91",
            },
          }}
        >
         Register 
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}>OR</Divider>

      <Button
        fullWidth
        variant="contained"
        onClick={handleGoogleLogin}
        sx={{
          backgroundColor: "#8e44ad",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#732d91",
          },
        }}
        startIcon={<GoogleIcon />}
      >
        Continue with Google
      </Button>
    </Container>
  );
};

export default WelcomeScreen;

// // WelcomeScreen.jsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import ChatPage from "./ChatPage";
// import GoogleIcon from "@mui/icons-material/Google";
// import { loginWithEmail, loginWithGoogle } from '../services/auth';
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   Divider,
//   Container,
// } from "@mui/material";

// const avatarUrls = [
//   "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Kurt&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&eyeType=WinkWacky&eyebrowType=SadConcerned&mouthType=Smile&skinColor=Brown",
//   "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Round&hairColor=Blue&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=Black&eyeType=Hearts&eyebrowType=RaisedExcited&mouthType=Serious&skinColor=Tanned",
//   "https://avataaars.io/?avatarStyle=Circle&topType=Hijab&accessoriesType=Round&hatColor=White&clotheType=Overall&clotheColor=Red&eyeType=Happy&eyebrowType=FlatNatural&mouthType=Default&skinColor=Light",
//   "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Prescription01&hairColor=BrownDark&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerSweater&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Serious&skinColor=Yellow",
//   "https://avataaars.io/?avatarStyle=Circle&topType=LongHairCurly&accessoriesType=Sunglasses&hairColor=Black&facialHairType=MoustacheMagnum&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=PastelYellow&eyeType=Dizzy&eyebrowType=UnibrowNatural&mouthType=Sad&skinColor=Tanned",
//   "https://avataaars.io/?avatarStyle=Circle&topType=Hat&accessoriesType=Kurt&facialHairType=BeardMajestic&facialHairColor=Brown&clotheType=BlazerShirt&eyeType=Side&eyebrowType=UpDown&mouthType=Disbelief&skinColor=Tanned",
//   "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBob&accessoriesType=Round&hairColor=Blue&facialHairType=Blank&facialHairColor=Blonde&clotheType=ShirtVNeck&clotheColor=Blue02&eyeType=EyeRoll&eyebrowType=SadConcerned&mouthType=Sad&skinColor=Brown",
// ];

// const WelcomeScreen = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();
//   return (
//     <Container maxWidth="sm" sx={{ textAlign: "center", mt: 5 }}>
//       {/* Avatar Images */}
//       <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
//         {avatarUrls.map((url, index) => (
//           <img
//             key={index}
//             src={url}
//             alt={`Avatar ${index}`}
//             width="80"
//             height="80"
//             style={{
//               borderRadius: "50%",
//             }}
//           />
//         ))}
//       </Box>

//       {/* Welcome Text */}
//       <Typography variant="h4" mt={4} fontWeight="bold">
//         Welcome to Real Chat
//       </Typography>
//       <Typography variant="body1" mt={1} color="text.secondary">
//         Connect with anyone, anytime. Let's get started!
//       </Typography>

//       {/* Login Form */}
//       <Box
//         component="form"
//         mt={3}
//         mb={2}
//         onSubmit={(e) => {
//           e.preventDefault();
//           loginWithEmail(email, password)
//             .then((res) => {
//               console.log("Login successfull", res.user);
//               navigate("/ChatPage");
//             })
//             .catch((err) => {
//               console.error("Login error:", err.message);
//             });
//         }}
//       >
//         <TextField
//           label="Email"
//           fullWidth
//           type="email"
//           margin="normal"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           sx={{
//             backgroundColor: "#fff",
//             boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
//             borderRadius: 2,
//           }}
//         />
//         <TextField
//           label="Password"
//           fullWidth
//           type="password"
//           margin="normal"
//           value={password}
//           onChange={(e) => setPassword(e.target.password)}
//           sx={{
//             backgroundColor: "#fff",
//             boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
//             borderRadius: 2,
//           }}
//         />
//       </Box>

//       <Button
//         type="submit"
//         fullWidth
//         variant="contained"
//         onClick={() => {
//           loginWithEmail()
//             .then((res) => {
//               console.log("Google login success:", res.user);
//               navigate("/chat");
//             })
//             .catch((err) => {
//               console.error("Google login error:", err.message);
//             });
//         }}
//         sx={{
//           backgroundColor: "#4285F4",
//           color: "#fff",
//           py: 1.5,
//           borderRadius: 2,
//           fontWeight: "bold",
//           boxShadow: "0 8px 15px rgba(66,133,244,0.5)",
//           "&:hover": {
//             backgroundColor: "#357ae8",
//           },
//         }}
//       >
//         Submit
//       </Button>

//       <Divider sx={{ my: 3 }}>OR</Divider>

//       {/* Continue with Google Button */}
//       <Button
//         fullWidth
//         variant="contained"
//         onClick={() => {
//           loginWithGoogle()
//             .then((res) => {
//               console.log("Google login success:", res.user);
//               navigate("/chat");
//             })
//             .catch((err) => {
//               console.error("Google login error:", err.message);
//             });
//         }}
//         sx={{
//           backgroundColor: "#4285F4",
//           color: "#fff",
//           py: 1.5,
//           borderRadius: 2,
//           fontWeight: "bold",
//           boxShadow: "0 8px 15px rgba(66,133,244,0.5)",
//           "&:hover": {
//             backgroundColor: "#357ae8",
//           },
//         }}
//         startIcon={<GoogleIcon />}
//       >
//         Continue with Google
//       </Button>
//     </Container>
//   );
// };

// export default WelcomeScreen;
