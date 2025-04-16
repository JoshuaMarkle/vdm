// Admin.js
// Admin specific functionality

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

const ADMIN_REGION = "us-east4";

/**
 * Create a new admin.
 * This function is restricted to existing admins only.
 * Expects data:
 * {
 *   email: string,
 *   password: string,
 *   firstName: string,
 *   lastName: string,
 *   address?: string,
 *   birthday?: string
 * }
 */
exports.createAdmin = onCall({ region: ADMIN_REGION }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can create a new admin.");
	}
	const { email, password, firstName, lastName, address, birthday } = request.data;
	if (!email || !password || !firstName || !lastName) {
		throw new HttpsError("invalid-argument", "Missing required fields.");
	}
	try {
		// Create a new user in Firebase Auth.
		const userRecord = await admin.auth().createUser({
			email: email,
			password: password,
		});
		const uid = userRecord.uid;
		// Set custom claim 'admin' to true for this user.
		await admin.auth().setCustomUserClaims(uid, { admin: true });
		// Create the Firestore document with admin data.
		await db.collection("users").doc(uid).set({
			firstName,
			lastName,
			email,
			address: address || "",
			birthday: birthday || "",
			approved: true,
			role: "admin", // mark as admin
			shifts: []
		});
		return { success: true, message: "Admin created successfully.", uid };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Update admin password.
 * This function allows an admin to update the password for a given admin account.
 * Expects data:
 * {
 *   uid: string,         // UID of the admin account to update
 *   newPassword: string  // New password (min 6 characters)
 * }
 */
exports.updateAdminPassword = onCall({ region: ADMIN_REGION }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can update admin passwords.");
	}
	const { uid, newPassword } = request.data;
	if (!uid || !newPassword || newPassword.length < 6) {
		throw new HttpsError("invalid-argument", "Invalid UID or password; password must be at least 6 characters long.");
	}
	try {
		await admin.auth().updateUser(uid, { password: newPassword });
		return { success: true, message: "Admin password updated successfully." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Get all users.
 * Returns a list of all user documents from Firestore.
 */
exports.getAllUsers = onCall({ region: ADMIN_REGION }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can view all users.");
	}
	try {
		const usersSnapshot = await db.collection("users").get();
		const users = [];
		usersSnapshot.forEach((doc) => {
			users.push({ uid: doc.id, ...doc.data() });
		});
		return { success: true, users };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Get all shifts.
 * Returns a list of all shift documents from Firestore.
 */
exports.getAllShifts = onCall({ region: ADMIN_REGION }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can view all shifts.");
	}
	try {
		const shiftsSnapshot = await db.collection("shifts").get();
		const shifts = [];
		shiftsSnapshot.forEach((doc) => {
			shifts.push({ shiftId: doc.id, ...doc.data() });
		});
		return { success: true, shifts };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Promote a user to admin.
 * Grants admin privileges to an existing user by updating custom claims and Firestore document.
 * Expects data:
 * {
 *   uid: string  // the user ID to promote
 * }
 */
exports.promoteUserToAdmin = onCall({ region: ADMIN_REGION }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can promote a user to admin.");
	}
	const { uid } = request.data;
	if (!uid) {
		throw new HttpsError("invalid-argument", "User ID (uid) is required.");
	}
	try {
		// Update custom claim so the user is recognized as an admin.
		await admin.auth().setCustomUserClaims(uid, { admin: true });
		// Update the Firestore document to reflect admin role.
		await db.collection("users").doc(uid).update({ role: "admin", approved: true });
		return { success: true, message: "User promoted to admin." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});
