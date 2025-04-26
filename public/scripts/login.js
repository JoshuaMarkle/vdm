// Login.js

import { auth, functions } from "./firebase-config.js";
import {
	signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
	httpsCallable
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

const form = document.getElementById("loginForm");
const messageDiv = document.getElementById("loginMessage");

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const email = document.getElementById("loginEmail").value;
	const password = document.getElementById("loginPassword").value;
	messageDiv.textContent = "";

	try {
		const userCred = await signInWithEmailAndPassword(auth, email, password);
		const user = userCred.user;

		// Call backend function to find if approved/admin user
		const checkApproval = httpsCallable(functions, "checkUserApproval");
		const result = await checkApproval();

		if (result.data.isAdmin) {
			window.location.href = "admin.html";
		// } else if (result.data.approved) {
		// 	window.location.href = "dashboard.html";
		} else {
			window.location.href = "dashboard.html"; 
		}

	} catch (error) {
		console.error("Login error:", error);
		messageDiv.textContent = `Login failed: ${error.message}`;
	}
});
