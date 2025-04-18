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

// Create a shift card (replaces <li> usage)
function createShiftCard({ date, time, position, cancelable = false, signUpHandler = null }) {
	const card = document.createElement("div");
	card.className = "shift";

	const header = document.createElement("div");
	header.className = "shift-header";

	const title = document.createElement("h4");
	title.textContent = `${formatDateHumanReadable(date)} - ${position || "Shift"}`;

	header.appendChild(title);

	if (cancelable) {
		const cancelLink = document.createElement("a");
		cancelLink.href = "#";
		cancelLink.innerHTML = '<i class="fas fa-xmark"></i> Cancel';
		header.appendChild(cancelLink);
	}

	card.appendChild(header);

	const timeElem = document.createElement("p");
	timeElem.style.fontWeight = "bold";
	timeElem.textContent = time;
	card.appendChild(timeElem);

	if (signUpHandler) {
		const signUpBtn = document.createElement("button");
		signUpBtn.textContent = "Sign Up";
		signUpBtn.className = "shift-signup-btn";
		signUpBtn.addEventListener("click", signUpHandler);
		card.appendChild(signUpBtn);
	}

	return card;
}

// Main logic after auth state is resolved
onAuthStateChanged(auth, async (user) => {
	if (!user) {
		window.location.href = "index.html";
		return;
	}

	const userRef = doc(db, "users", user.uid);
	const userSnap = await getDoc(userRef);

	if (userSnap.exists()) {
		const userData = userSnap.data();

		// Load user shifts
		const userShifts = userData.shifts || [];
		userShiftsList.innerHTML = "";

		if (userShifts.length > 0) {
			for (const shiftId of userShifts) {
				const shiftSnap = await getDoc(doc(db, "shifts", shiftId));
				if (shiftSnap.exists()) {
					const shiftData = shiftSnap.data();
					const card = createShiftCard({
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
			if (shiftData.assignedUsers?.includes(user.uid)) return;

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
				date: shiftData.date,
				time: shiftData.time,
				position: shiftData.position,
				signUpHandler
			});

			availableShiftsList.appendChild(card);
		});
	}
});

// Logout
document.getElementById("logoutButton").addEventListener("click", async () => {
	try {
		await signOut(auth);
		window.location.href = "index.html";
	} catch (error) {
		console.error("Logout error:", error);
	}
});

// Format date
function formatDateHumanReadable(dateStr) {
	const date = new Date(dateStr);
	const options = { year: 'numeric', month: 'long', day: 'numeric' };
	return date.toLocaleDateString(undefined, options);
}
