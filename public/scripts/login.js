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
		const isApproved = tokenResult.claims.approved === true;

		if (isAdmin) {
			messageDiv.textContent = "Login successful! Redirecting...";
			window.location.href = "admin.html";
		} else if(isApproved) {
			messageDiv.textContent = "Login successful! Redirecting...";
			window.location.href = "dashboard.html";
		}  else{
			messageDiv.textContent = "User not yet approved!";
		}
	} catch (error) {
		messageDiv.textContent = `Login failed: ${error.message}`;
	}
});
