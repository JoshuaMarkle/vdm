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
		await signInWithEmailAndPassword(auth, email, password);
		messageDiv.textContent = "Login successful!";
		window.location.href = "dashboard.html";
	} catch (error) {
		messageDiv.textContent = `Login failed: ${error.message}`;
	}
});
