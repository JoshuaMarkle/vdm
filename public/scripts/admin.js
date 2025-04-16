// Admin.js
// Handles authentication for admin users

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

// Use the correct region for your functions.
const functions = getFunctions(undefined, "us-east4");

// Callable functions defined in your Cloud Functions backend.
const getAllUsersFn = httpsCallable(functions, "getAllUsers");
const getAllShiftsFn = httpsCallable(functions, "getAllShifts");
const createShiftFn = httpsCallable(functions, "createShift");
const deleteShiftFn = httpsCallable(functions, "deleteShift");

const usersListDiv = document.getElementById("usersList");
const shiftsListDiv = document.getElementById("shiftsList");
const createShiftForm = document.getElementById("createShiftForm");
const shiftMessageDiv = document.getElementById("shiftMessage");
const logoutButton = document.getElementById("logoutButton");

// Check that the user is logged in and is an admin.
onAuthStateChanged(auth, (user) => {
	if (!user) {
		window.location.href = "index.html";
		return;
	}
	// Check for admin claim
	user.getIdTokenResult().then((idTokenResult) => {
		if (!idTokenResult.claims.admin) {
			window.location.href = "index.html"; // not an admin, redirect to login/dashboard
		} else {
			loadUsers();
			loadShifts();
		}
	}).catch((error) => {
		console.error("Token error:", error);
		window.location.href = "index.html";
	});
});

// Logout handling.
logoutButton.addEventListener("click", async () => {
	try {
		await signOut(auth);
		window.location.href = "index.html";
	} catch (error) {
		console.error("Logout error:", error);
	}
});

// Load and display all users.
async function loadUsers() {
	try {
		const result = await getAllUsersFn();
		if (result.data && result.data.users) {
			const users = result.data.users;
			usersListDiv.innerHTML = "";
			users.forEach((userObj) => {
				// Display basic info; adjust as needed.
				const p = document.createElement("p");
				p.textContent = `UID: ${userObj.uid} | Name: ${userObj.firstName} ${userObj.lastName} | Email: ${userObj.email}`;
				usersListDiv.appendChild(p);
			});
		} else {
			usersListDiv.textContent = "No users found.";
		}
	} catch (error) {
		console.error("Error loading users:", error);
		usersListDiv.textContent = "Error loading users.";
	}
}

// Load and display all shifts.
async function loadShifts() {
	try {
		const result = await getAllShiftsFn();
		if (result.data && result.data.shifts) {
			const shifts = result.data.shifts;
			shiftsListDiv.innerHTML = "";
			shifts.forEach((shift) => {
				const container = document.createElement("div");
				container.style.border = "1px solid #ccc";
				container.style.padding = "5px";
				container.style.margin = "5px";

				container.innerHTML = `
		  <p>Shift ID: ${shift.shiftId}</p>
		  <p>Date: ${shift.date}</p>
		  <p>Time: ${shift.time}</p>
		  <p>Position: ${shift.position}</p>
		  <p>Max Users: ${shift.maxUsers}</p>
		  <p>Assigned Users: ${shift.assignedUsers ? shift.assignedUsers.join(", ") : "None"}</p>
		`;

				// Add a Delete button to allow admin to remove this shift.
				const deleteButton = document.createElement("button");
				deleteButton.textContent = "Delete Shift";
				deleteButton.addEventListener("click", async () => {
					if (confirm("Are you sure you want to delete this shift?")) {
						try {
							await deleteShiftFn({ shiftId: shift.shiftId });
							alert("Shift deleted.");
							loadShifts(); // Refresh the list after deletion.
						} catch (error) {
							alert("Error deleting shift: " + error.message);
						}
					}
				});
				container.appendChild(deleteButton);
				shiftsListDiv.appendChild(container);
			});
		} else {
			shiftsListDiv.textContent = "No shifts found.";
		}
	} catch (error) {
		console.error("Error loading shifts:", error);
		shiftsListDiv.textContent = "Error loading shifts.";
	}
}

// Create a new shift upon form submission.
createShiftForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const date = document.getElementById("shiftDate").value;
	const time = document.getElementById("shiftTime").value;
	const position = document.getElementById("shiftPosition").value;
	const maxUsers = parseInt(document.getElementById("shiftMaxUsers").value, 10);

	try {
		const result = await createShiftFn({ date, time, position, maxUsers });
		if (result.data && result.data.shiftId) {
			shiftMessageDiv.textContent = "Shift created successfully!";
			createShiftForm.reset();
			loadShifts(); // Refresh the shifts list.
		} else {
			shiftMessageDiv.textContent = "Failed to create shift.";
		}
	} catch (error) {
		shiftMessageDiv.textContent = "Error creating shift: " + error.message;
	}
});
