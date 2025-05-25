// uploadFile.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase"; // path to your firebase config

export const uploadFile = async (file, userId) => {
  if (!file) return null;

  const fileRef = ref(storage, `${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
};
