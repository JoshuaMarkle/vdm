// Register.js

import { auth } from "./firebase-config.js";
import {
	createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
	getFunctions,
	httpsCallable
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

// Make sure functions are in the right region
const functions = getFunctions(undefined, "us-east4");
const createUserFn = httpsCallable(functions, "createUser");

const form = document.getElementById("registerForm");
const messageDiv = document.getElementById("registerMessage");

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const email = document.getElementById("registerEmail").value;
	const password = document.getElementById("registerPassword").value;
	const firstName = document.getElementById("firstName").value;
	const lastName = document.getElementById("lastName").value;
	const address = document.getElementById("address").value;
	const birthday = document.getElementById("birthday").value;

	try {
		await createUserWithEmailAndPassword(auth, email, password);

		await createUserFn({
			firstName,
			lastName,
			email,
			address,
			birthday
		});

		messageDiv.textContent = "Registration successful!";
		window.location.href = "dashboard.html";
	} catch (error) {
		messageDiv.textContent = `Registration failed: ${error.message}`;
	}
});
