import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD6Wq28VxM8T2bXjyxHCb4x-cB21qxqKSw",
  authDomain: "smartpark-bb399.firebaseapp.com",
  databaseURL: "https://smartpark-bb399-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartpark-bb399",
  storageBucket: "smartpark-bb399.firebasestorage.app",
  messagingSenderId: "784474330144",
  appId: "1:784474330144:web:5f43980bfbf262877d1845",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);