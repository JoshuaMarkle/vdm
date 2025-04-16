// Login.js

import { auth } from "./firebase-config.js";
import {
	signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const messageDiv = document.getElementById("loginMessage");

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const email = document.getElementById("loginEmail").value;
	const password = document.getElementById("loginPassword").value;

	try {
		const userCred = await signInWithEmailAndPassword(auth, email, password);
		const user = userCred.user;

		const tokenResult = await user.getIdTokenResult();
		const isAdmin = tokenResult.claims.admin === true;

		messageDiv.textContent = "Login successful! Redirecting...";

		if (isAdmin) {
			window.location.href = "admin.html";
		} else {
			window.location.href = "dashboard.html";
		}
	} catch (error) {
		messageDiv.textContent = `Login failed: ${error.message}`;
	}
});
