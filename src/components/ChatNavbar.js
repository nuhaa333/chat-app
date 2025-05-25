import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Toolbar,
  InputBase,
  IconButton,
  Box,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  Search,
  Brightness4,
  Brightness7,
  GroupAdd,
  AccountCircle,
} from "@mui/icons-material";

const ChatNavbar = ({ themeMode, toggleTheme, searchQuery, onSearch }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Navbar */}
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(to right, #a4508b, #5f0a87)",
          px: 2,
          py: 1,
          boxShadow: "none",
        }}
      >
        <Toolbar disableGutters>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>

          <Box
            sx={{
              flexGrow: 1,
              mx: 2,
              display: "flex",
              alignItems: "center",
              bgcolor: "white",
              borderRadius: 2,
              px: 2,
            }}
          >
            <Search sx={{ color: "#888", mr: 1 }} />
            <InputBase
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              sx={{ flexGrow: 1 }}
              inputProps={{ "aria-label": "search" }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Bottom Navbar */}
<Paper
  sx={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    borderTop: "1px solid #ddd",
    zIndex: 10,
  }}
  elevation={3}
>
  <BottomNavigation showLabels>
    <BottomNavigationAction
      label="Profile"
      icon={
        <Box
          sx={{
            bgcolor: "#a4508b",
            color: "white",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AccountCircle fontSize="small" />
        </Box>
      }
      onClick={() => navigate("/profile")}
    />
    <BottomNavigationAction
      label="Theme"
      icon={
        <Box
          sx={{
            bgcolor: "#a4508b",
            color: "white",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {themeMode === "dark" ? (
            <Brightness7 fontSize="small" />
          ) : (
            <Brightness4 fontSize="small" />
          )}
        </Box>
      }
      onClick={toggleTheme}
    />
    <BottomNavigationAction
      label="New Group"
      icon={
        <Box
          sx={{
            bgcolor: "#a4508b",
            color: "white",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GroupAdd fontSize="small" />
        </Box>
      }
      onClick={() => navigate("/create-group")}
    />
  </BottomNavigation>
</Paper>

      {/* <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid #ddd",
        }}
        elevation={3}
      >
        <BottomNavigation showLabels>
          <BottomNavigationAction
            label="Profile"
            icon={<AccountCircle />}
            onClick={() => navigate("/profile")}
          />
          <BottomNavigationAction
            label="Theme"
            icon={themeMode === "dark" ? <Brightness7 /> : <Brightness4 />}
            onClick={toggleTheme}
          />
          <BottomNavigationAction
            label="New Group"
            icon={<GroupAdd />}
            onClick={() => navigate("/create-group")}
          />
        </BottomNavigation>
      </Paper> */}
    </>
  );
};

export default ChatNavbar;

// // src/components/ChatNavbar.jsx
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   AppBar,
//   Toolbar,
//   IconButton,
//   Typography,
//   InputBase,
//   Switch,
//   Box,
// } from "@mui/material";
// import {
//   Brightness4,
//   Brightness7,
//   GroupAdd,
//   AccountCircle,
// } from "@mui/icons-material";

// const ChatNavbar = ({ themeMode, toggleTheme, searchQuery, onSearch }) => {
//   const navigate = useNavigate();

//   return (
//     <AppBar position="static" sx={{ mb: 2 }}>
//       <Toolbar>
//         <Typography variant="h6" sx={{ flexGrow: 1 }}>
//           My Chat App
//         </Typography>

//         <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//           <InputBase
//             placeholder="Search…"
//             inputProps={{ "aria-label": "search" }}
//             value={searchQuery}
//             onChange={(e) => onSearch(e.target.value)}
//             sx={{
//               bgcolor: "background.paper",
//               color: "text.primary",
//               px: 1,
//               borderRadius: 1,
//               width: "200px",
//             }}
//           />

//           <IconButton color="inherit" onClick={() => navigate("/create-group")}>
//             <GroupAdd />
//           </IconButton>

//           <IconButton color="inherit" onClick={() => navigate("/profile")}>
//             <AccountCircle />
//           </IconButton>

//           <Switch
//             checked={themeMode === "dark"}
//             onChange={toggleTheme}
//             color="default"
//           />
//           {themeMode === "dark" ? <Brightness7 /> : <Brightness4 />}
//         </Box>
//       </Toolbar>
//     </AppBar>
//   );
// };

// export default ChatNavbar;
