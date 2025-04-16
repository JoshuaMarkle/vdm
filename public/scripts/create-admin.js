// create-admin.js
// Admin fail safe mechanism

import { auth } from "./firebase-config.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

const functions = getFunctions(undefined, "us-east4");
const createInitialAdmin = httpsCallable(functions, "createInitialAdmin");

document.getElementById("adminForm").addEventListener("submit", async (e) => {
	e.preventDefault();

	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;
	const firstName = document.getElementById("firstName").value;
	const lastName = document.getElementById("lastName").value;
	const address = document.getElementById("address").value;
	const birthday = document.getElementById("birthday").value;
	const messageDiv = document.getElementById("message");

	try {
		// Call the Cloud Function to create/promote the admin.
		const result = await createInitialAdmin({
			email,
			password,
			firstName,
			lastName,
			address,
			birthday
		});
		messageDiv.textContent = result.data.message || "Admin account created successfully!";
		// Optionally, sign the user in on the client side now.
		window.location.href = "admin.html";
	} catch (error) {
		messageDiv.textContent = "Error: " + error.message;
	}
});
