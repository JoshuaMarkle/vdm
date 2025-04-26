// Admin.js
// Handles authentication for admin users

import { auth } from "./firebase-config.js";
import {
	getFirestore,
	collection,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
	onAuthStateChanged,
	signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const db = getFirestore();

const usersList = document.getElementById("usersList");
const shiftsList = document.getElementById("shiftsList");

// Fetch & render users
async function loadUsers() {
	const usersSnapshot = await getDocs(collection(db, "users"));
	usersList.innerHTML = "";

	usersSnapshot.forEach((docSnap) => {
		const user = docSnap.data();
		const row = document.createElement("tr");

		row.innerHTML = `
			<td>${user.firstName || ""}</td>
			<td>${user.lastName || ""}</td>
			<td>${user.email || ""}</td>
			<td>${user.approved ? "✅" : "❌"}</td>
			<td>
				<button onclick="toggleApproval('${docSnap.id}', ${user.approved})">
					${user.approved ? "Revoke" : "Approve"}
				</button>
				<button onclick="deleteUser('${docSnap.id}')">Delete</button>
			</td>
		`;

		usersList.appendChild(row);
	});
}

// Fetch & render shifts
async function loadShifts() {
	const shiftsSnapshot = await getDocs(collection(db, "shifts"));
	shiftsList.innerHTML = "";

	shiftsSnapshot.forEach((docSnap) => {
		const shift = docSnap.data();
		const row = document.createElement("tr");

		row.innerHTML = `
			<td>${shift.date}</td>
			<td>${shift.time}</td>
			<td>${shift.position}</td>
			<td>${(shift.assignedUsers || []).length}</td>
			<td>${(shift.signedInUsers || []).length}</td>
			<td>
				<button onclick="deleteShift('${docSnap.id}')">Delete</button>
			</td>
		`;

		shiftsList.appendChild(row);
	});
}

// Toggle user approval
window.toggleApproval = async (userId, currentStatus) => {
	const ref = doc(db, "users", userId);
	await updateDoc(ref, {
		approved: !currentStatus,
	});
	await loadUsers();
};

// Delete user
window.deleteUser = async (userId) => {
	if (!confirm("Delete this user?")) return;
	await deleteDoc(doc(db, "users", userId));
	await loadUsers();
};

// Delete shift
window.deleteShift = async (shiftId) => {
	if (!confirm("Delete this shift?")) return;
	await deleteDoc(doc(db, "shifts", shiftId));
	await loadShifts();
};

// Auth and load data
onAuthStateChanged(auth, (user) => {
	if (!user) {
		window.location.href = "index.html";
	} else {
		loadUsers();
		loadShifts();
	}
});

// Logout
document.getElementById("logoutButton").addEventListener("click", async () => {
	await signOut(auth);
	window.location.href = "index.html";
});

// Popup open/close functions
function openPopup(contentHTML) {
	const overlay = document.getElementById("popup-overlay");
	const content = document.getElementById("popup-content");
	content.innerHTML = contentHTML;
	overlay.style.display = "flex";

	overlay.addEventListener("click", (e) => {
		if (e.target.id === "popup-overlay") {
			closePopup();
		}
	});
}

window.closePopup = async function() {
	const overlay = document.getElementById("popup-overlay");
	overlay.style.display = "none";
}

// Create shift popup
document.getElementById("create-shift-btn").addEventListener("click", () => {
	openPopup(`
		<h2>Create New Shift</h2>
		<input type="date" id="popupShiftDate" required>
		<input type="text" id="popupShiftTime" placeholder="e.g., 10:00 AM - 2:00 PM" required>
		<input type="text" id="popupShiftPosition" placeholder="Position" required>
		<input type="number" id="popupShiftMaxUsers" placeholder="Max Users" required>
		<div class="row">
			<button onclick="submitPopupShift()">Create</button>
			<button class="cancel-btn" onclick="closePopup()">Cancel</button>
		</div>
	`);
});

window.submitPopupShift = async function() {
	const date = document.getElementById("popupShiftDate").value;
	const time = document.getElementById("popupShiftTime").value;
	const position = document.getElementById("popupShiftPosition").value;
	const maxUsers = parseInt(document.getElementById("popupShiftMaxUsers").value);

	// Validate
	if (!date || !time || !position || isNaN(maxUsers)) {
		alert("Please fill out all fields.");
		return;

	}

	await addDoc(collection(db, "shifts"), {
			date,
			time,
			position,
			maxUsers,
			assignedUsers: [],
			signedInUsers: [],
			approved: false,
			completed: false,
		});

	closePopup();
	location.reload();
}
