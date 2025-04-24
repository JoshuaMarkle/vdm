// Firebase config info

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyAqlBCLzBpagmX5rNH2TVX2oQTdQLWy-mY",
	authDomain: "vdm-volunteers.firebaseapp.com",
	projectId: "vdm-volunteers",
	storageBucket: "vdm-volunteers.firebasestorage.app",
	messagingSenderId: "373907502192",
	appId: "1:373907502192:web:b9f2c680308d87baf070b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app, "us-east4");
export const db = getFirestore(app);
