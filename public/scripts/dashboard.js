// Dashboard.js

import { auth } from "./firebase-config.js";
import {
	getFirestore,
	doc,
	getDoc,
	collection,
	query,
	where,
	orderBy,
	getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
	onAuthStateChanged,
	signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

const db = getFirestore();
const functions = getFunctions(undefined, "us-east4");

// DOM Elements
const userShiftsList = document.getElementById("userShiftsList");
const availableShiftsList = document.getElementById("availableShiftsList");
const notificationList = document.getElementById("notificationList");
let currentUserData = null;

// Create a shift card
function createShiftCard({ id, date, time, position, cancelable = false, signUpHandler = null }) {
	const card = document.createElement("div");
	card.className = "shift";

	const header = document.createElement("div");
	header.className = "shift-header";

	const title = document.createElement("h4");
	title.textContent = `${formatDateHumanReadable(date)} - ${position || "Shift"}`;
	header.appendChild(title);

	const timeElem = document.createElement("p");
	timeElem.style.fontWeight = "bold";
	timeElem.textContent = time;
	header.appendChild(timeElem);

	card.appendChild(header);

	// Add cancel button
	if (cancelable && currentUserData?.approved) {
		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = "Drop";
		cancelBtn.className = "cancel-btn";
		cancelBtn.onclick = async () => {
			if (!confirm("Are you sure you want to cancel this shift?")) return;

			try {
				const dropShift = httpsCallable(functions, "dropShift");
				await dropShift({ userId: auth.currentUser.uid, shiftId: id });
				window.location.reload();
				// card.remove(); // Remove card from DOM
			} catch (err) {
				console.error("Error canceling shift:", err);
				alert("Failed to cancel shift. Try again.");
			}
		};

		card.appendChild(cancelBtn);
	}

	// Add sign-up button
	if (signUpHandler) {
		const signUpBtn = document.createElement("button");
		signUpBtn.textContent = "Sign Up";
		signUpBtn.className = "shift-signup-btn";
		signUpBtn.addEventListener("click", signUpHandler);

		card.appendChild(signUpBtn);
	}

	return card;
}

// Main auth flow
onAuthStateChanged(auth, async (user) => {
	if (!user) {
		window.location.href = "index.html";
		return;
	}

	const userRef = doc(db, "users", user.uid);
	const userSnap = await getDoc(userRef);

	if (userSnap.exists()) {
		// Save global userData
		currentUserData = userSnap.data();

		// Display "waiting for approval" if needed
		if (!currentUserData.approved) {
			const notice = document.createElement("div");
			const noticeIcon = document.createElement("i");
			const noticeText = document.createElement("p");
			notice.className = "notice warning";
			noticeIcon.className = "fa-solid fa-triangle-exclamation";
			noticeText.textContent = "Your account is waiting for admin approval. You can view shifts but cannot sign up.";
			notice.appendChild(noticeIcon);
			notice.appendChild(noticeText);
			notificationList.append(notice);
		}

		// Load shifts
		loadUserShifts();
		loadAvailableShifts();
	}
});

// Load signed-up shifts
async function loadUserShifts() {
	const userShifts = currentUserData?.shifts || [];
	userShiftsList.innerHTML = "";

	if (userShifts.length > 0) {
		for (const shiftId of userShifts) {
			const shiftSnap = await getDoc(doc(db, "shifts", shiftId));
			if (shiftSnap.exists()) {
				const shiftData = shiftSnap.data();
				const card = createShiftCard({
					id: shiftId,
					date: shiftData.date,
					time: shiftData.time,
					position: shiftData.position,
					cancelable: true
				});
				userShiftsList.appendChild(card);
			}
		}
	} else {
		userShiftsList.textContent = "You haven't signed up for any shifts.";
	}
}

// Load available shifts
async function loadAvailableShifts() {
	const today = new Date();
	const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

	const shiftsQuery = query(
		collection(db, "shifts"),
		where("date", ">=", todayStr),
		orderBy("date")
	);

	const querySnapshot = await getDocs(shiftsQuery);
	availableShiftsList.innerHTML = "";

	if (querySnapshot.empty) {
		availableShiftsList.textContent = "No available shifts.";
	} else {
		querySnapshot.forEach((docSnapshot) => {
			const shiftData = docSnapshot.data();

			if (shiftData.assignedUsers && shiftData.assignedUsers.length >= shiftData.maxUsers) return;
			if (shiftData.assignedUsers?.includes(auth.currentUser.uid)) return;

			const signUpHandler = async () => {
				const signUpForShift = httpsCallable(functions, "signUpForShift");
				try {
					await signUpForShift({ shiftId: docSnapshot.id });
					alert("Signed up successfully!");
					window.location.reload();
				} catch (error) {
					alert("Sign up failed: " + error.message);
				}
			};

			const card = createShiftCard({
				id: docSnapshot.id,
				date: shiftData.date,
				time: shiftData.time,
				position: shiftData.position,
				signUpHandler
			});

			availableShiftsList.appendChild(card);
		});
	}
}

// Format date nicely
function formatDateHumanReadable(dateStr) {
	const [year, month, day] = dateStr.split("-");
	const months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	const monthName = months[parseInt(month, 10) - 1];
	return `${monthName} ${parseInt(day, 10)}, ${year}`;
}

// Logout
document.getElementById("logoutButton").addEventListener("click", async () => {
	try {
		await signOut(auth);
		window.location.href = "index.html";
	} catch (error) {
		console.error("Logout error:", error);
	}
});
