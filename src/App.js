// App.js
import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import WelcomeScreen from "./pages/WelcomeScreen";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import ChatRoomsList from "./components/ChatRoomsList";
import UsersList from "./pages/UserList";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import UserStatus from "./components/UserStatus";
import CreateGroupPage from './pages/CreateGroupPage';
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

function App() {
  const auth = getAuth();
  const [user, setUser] = useState(null);

  // Theme state
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const toggleTheme = () => {
    const newTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, [auth]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user && <UserStatus uid={user.uid} />}
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/chatrooms" element={<ChatRoomsList />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/users" element={<UsersList themeMode={themeMode} toggleTheme={toggleTheme} />} />
        <Route path="/create-group" element={<CreateGroupPage themeMode={themeMode} toggleTheme={toggleTheme} />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
