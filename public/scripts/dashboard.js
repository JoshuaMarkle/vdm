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
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

// Initialize Firestore and Functions with your chosen region.
const db = getFirestore();
const functions = getFunctions(undefined, "us-east4");

// Ensure a user is logged in.
onAuthStateChanged(auth, async (user) => {
	if (!user) {
		// Not signed in; redirect to the login page.
		window.location.href = "index.html";
		return;
	}

	// Get and display user profile from Firestore.
	const userRef = doc(db, "users", user.uid);
	const userSnap = await getDoc(userRef);
	const userInfoDiv = document.getElementById("userInfo");
	const userShiftsList = document.getElementById("userShiftsList");

	if (userSnap.exists()) {
		const userData = userSnap.data();
		userInfoDiv.textContent = `Welcome, ${userData.firstName} ${userData.lastName}`;

		// Display user's signed-up shifts.
		const userShifts = userData.shifts || [];
		if (userShifts.length > 0) {
			userShiftsList.innerHTML = ""; // Clear list.
			userShifts.forEach(async (shiftId) => {
				const shiftSnap = await getDoc(doc(db, "shifts", shiftId));
				if (shiftSnap.exists()) {
					const shiftData = shiftSnap.data();
					const li = document.createElement("li");
					li.textContent = `Shift on ${shiftData.date} at ${shiftData.time} for ${shiftData.position}`;
					userShiftsList.appendChild(li);
				}
			});
		} else {
			userShiftsList.textContent = "You haven't signed up for any shifts.";
		}
	} else {
		userInfoDiv.textContent = "User profile not found.";
	}

	// Query available shifts: those with a date equal to or later than today.
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const dd = String(today.getDate()).padStart(2, "0");
	const todayStr = `${yyyy}-${mm}-${dd}`;

	const availableShiftsList = document.getElementById("availableShiftsList");
	const shiftsQuery = query(
		collection(db, "shifts"),
		where("date", ">=", todayStr),
		orderBy("date")
	);

	const querySnapshot = await getDocs(shiftsQuery);
	if (querySnapshot.empty) {
		availableShiftsList.textContent = "No available shifts.";
	} else {
		availableShiftsList.innerHTML = "";
		querySnapshot.forEach((docSnapshot) => {
			const shiftData = docSnapshot.data();
			// Only display if the shift is not full.
			if (shiftData.assignedUsers && shiftData.assignedUsers.length >= shiftData.maxUsers) {
				return; // Skip full shift.
			}
			const li = document.createElement("li");
			li.textContent = `Shift on ${shiftData.date} at ${shiftData.time} for ${shiftData.position} (Max: ${shiftData.maxUsers})`;

			// If the user isn't already signed up, add a "Sign Up" button.
			if (!shiftData.assignedUsers || !shiftData.assignedUsers.includes(user.uid)) {
				const signUpButton = document.createElement("button");
				signUpButton.textContent = "Sign Up";
				signUpButton.addEventListener("click", async () => {
					const signUpForShift = httpsCallable(functions, "signUpForShift");
					try {
						await signUpForShift({ shiftId: docSnapshot.id });
						alert("Signed up successfully!");
						window.location.reload(); // Refresh to update the dashboard.
					} catch (error) {
						alert("Sign up failed: " + error.message);
					}
				});
				li.appendChild(signUpButton);
			}

			availableShiftsList.appendChild(li);
		});
	}
});

// Logout functionality.
document.getElementById("logoutButton").addEventListener("click", async () => {
	try {
		await signOut(auth);
		window.location.href = "index.html";
	} catch (error) {
		console.error("Logout error:", error);
	}
});
