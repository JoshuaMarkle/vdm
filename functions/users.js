// Users.js
// Logic for handling Users

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Create a new user.
 * Expects data: {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   address: string,
 *   birthday: string (ISO date or formatted date)
 * }
 * The user document is stored under the UID of the authenticated user.
 */
exports.createUser = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be logged in");
	}
	const uid = request.auth.uid;
	const { firstName, lastName, email, address, birthday } = request.data;

	try {
		await db.collection("users").doc(uid).set({
			firstName,
			lastName,
			email,
			address,
			birthday,
			approved: false,
			shifts: [] // will hold an array of shift IDs
		});
		return { success: true, message: "User created" };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Delete a user.
 * Deletes the Firestore user document and then deletes the user from Firebase Authentication.
 */
exports.deleteUser = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be logged in");
	}
	const uid = request.auth.uid;
	try {
		// Delete user document from Firestore
		await db.collection("users").doc(uid).delete();
		// Delete user from Firebase Authentication
		await admin.auth().deleteUser(uid);
		return { success: true, message: "User deleted" };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Update a user's information.
 * Expects data as an object containing any of the following fields:
 * firstName, lastName, email, address, birthday
 * Only allowed fields will be updated in the user document.
 */
exports.updateUserInfo = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be logged in");
	}
	const uid = request.auth.uid;
	const updateData = request.data;
	// Define which fields are allowed to be updated.
	const allowedFields = ["firstName", "lastName", "email", "address", "birthday"];
	const updatePayload = {};
	Object.keys(updateData).forEach((key) => {
		if (allowedFields.includes(key)) {
			updatePayload[key] = updateData[key];
		}
	});

	if (Object.keys(updatePayload).length === 0) {
		throw new HttpsError("invalid-argument", "No valid fields to update");
	}

	try {
		await db.collection("users").doc(uid).update(updatePayload);
		return { success: true, message: "User information updated" };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Update user password.
 * Expects data: { newPassword: string }
 * The new password must meet a minimum length requirement.
 */
exports.updateUserPassword = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be logged in");
	}
	const uid = request.auth.uid;
	const { newPassword } = request.data;
	if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
		throw new HttpsError("invalid-argument", "Invalid password provided; must be at least 6 characters long");
	}

	try {
		await admin.auth().updateUser(uid, { password: newPassword });
		return { success: true, message: "Password updated successfully" };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});
