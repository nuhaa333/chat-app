// src/store.js
import { create } from "zustand";

const useStore = create((set) => ({
  isDark: false,
  roomName: "Default Room",
  username: "Guest",
  setIsDark: (value) => set({ isDark: value }),
  setRoomName: (name) => set({ roomName: name }),
  setUsername: (name) => set({ username: name }),
}));

export default useStore;
