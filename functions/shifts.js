// Shifts.js
// Logic for handling shifts

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Create a new shift.
 * Only an admin should be able to create a shift.
 * Expects data: {
 *   date: string,
 *   time: string,
 *   position: string,
 *   maxUsers: number
 * }
 */
exports.createShift = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can create a shift.");
	}
	const { date, time, position, maxUsers } = request.data;
	if (!date || !time || !position || !maxUsers) {
		throw new HttpsError("invalid-argument", "Missing required shift fields.");
	}
	try {
		const shiftRef = await db.collection("shifts").add({
			date,
			time,
			position,
			approved: false,
			maxUsers: Number(maxUsers),
			assignedUsers: [],
			signedInUsers: []
		});
		return { success: true, shiftId: shiftRef.id };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Get shift info by ID.
 * Expects data: { shiftId: string }
 */
exports.getShiftInfo = onCall({ region: "us-east4" }, async (request) => {
	const { shiftId } = request.data;
	if (!shiftId) {
		throw new HttpsError("invalid-argument", "Shift ID is required.");
	}
	try {
		const shiftDoc = await db.collection("shifts").doc(shiftId).get();
		if (!shiftDoc.exists) {
			throw new HttpsError("not-found", "Shift not found.");
		}
		return { success: true, shift: shiftDoc.data() };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Update an existing shift.
 * Only an admin should be able to update a shift.
 * Expects data: { shiftId: string, updateData: { … } }
 * updateData can include any of the fields: date, time, position, approved, maxUsers, etc.
 */
exports.updateShift = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can update a shift.");
	}
	const { shiftId, updateData } = request.data;
	if (!shiftId || !updateData) {
		throw new HttpsError("invalid-argument", "Missing shift ID or update data.");
	}
	try {
		await db.collection("shifts").doc(shiftId).update(updateData);
		return { success: true, message: "Shift updated successfully." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * Delete an existing shift.
 * Only an admin should be able to delete a shift.
 * Expects data: { shiftId: string }
 */
exports.deleteShift = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth || !request.auth.token.admin) {
		throw new HttpsError("permission-denied", "Only admins can delete shifts.");
	}
	const { shiftId } = request.data;
	if (!shiftId) {
		throw new HttpsError("invalid-argument", "Shift ID is required.");
	}
	try {
		await db.collection("shifts").doc(shiftId).delete();
		return { success: true, message: "Shift deleted successfully." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * User signs up for a shift.
 * Expects data: { shiftId: string }
 */
exports.signUpForShift = onCall({ region: "us-east4" }, async (request) => {
	const uid = request.auth?.uid;
	const { shiftId } = request.data;

	if (!uid || !shiftId) {
		throw new HttpsError("invalid-argument", "Missing shift ID or not authenticated.");
	}

	const shiftRef = db.collection("shifts").doc(shiftId);
	const userRef = db.collection("users").doc(uid);

	try {
		const shiftSnap = await shiftRef.get();
		const userSnap = await userRef.get();

		if (!shiftSnap.exists || !userSnap.exists) {
			throw new HttpsError("not-found", "Shift or user not found.");
		}

		const shiftData = shiftSnap.data();
		const userData = userSnap.data();

		const assigned = shiftData.assignedUsers || [];
		const userShifts = userData.shifts || [];

		if (assigned.includes(uid)) {
			throw new HttpsError("already-exists", "User already signed up for this shift.");
		}

		if (assigned.length >= shiftData.maxUsers) {
			throw new HttpsError("resource-exhausted", "Shift is full.");
		}

		// Update both documents
		await shiftRef.update({
			assignedUsers: [...assigned, uid]
		});

		await userRef.update({
			shifts: [...userShifts, shiftId]
		});

		return { success: true };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * User checks into a shift.
 * Expects data: { shiftId: string }
 * User must be signed up for the shift (i.e. in assignedUsers).
 */
exports.checkIntoShift = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be logged in.");
	}
	const uid = request.auth.uid;
	const { shiftId } = request.data;
	if (!shiftId) {
		throw new HttpsError("invalid-argument", "Shift ID is required.");
	}
	const shiftRef = db.collection("shifts").doc(shiftId);
	try {
		const shiftDoc = await shiftRef.get();
		if (!shiftDoc.exists) {
			throw new HttpsError("not-found", "Shift not found.");
		}
		const shiftData = shiftDoc.data();
		if (!shiftData.assignedUsers.includes(uid)) {
			throw new HttpsError("failed-precondition", "User is not signed up for this shift.");
		}
		if (shiftData.signedInUsers.includes(uid)) {
			throw new HttpsError("already-exists", "User already checked in.");
		}
		await shiftRef.update({
			signedInUsers: admin.firestore.FieldValue.arrayUnion(uid)
		});
		return { success: true, message: "User checked into shift." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});

/**
 * User drops (un-signs) a shift.
 * Expects data: { shiftId: string }
 * The user can only drop the shift if they haven't checked in yet.
 */
exports.dropShift = onCall({ region: "us-east4" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be logged in.");
	}
	const uid = request.auth.uid;
	const { shiftId } = request.data;
	if (!shiftId) {
		throw new HttpsError("invalid-argument", "Shift ID is required.");
	}
	const shiftRef = db.collection("shifts").doc(shiftId);
	try {
		const shiftDoc = await shiftRef.get();
		if (!shiftDoc.exists) {
			throw new HttpsError("not-found", "Shift not found.");
		}
		const shiftData = shiftDoc.data();
		if (shiftData.signedInUsers.includes(uid)) {
			throw new HttpsError("failed-precondition", "Cannot drop a shift after checking in.");
		}
		await shiftRef.update({
			assignedUsers: admin.firestore.FieldValue.arrayRemove(uid)
		});
		return { success: true, message: "User dropped from shift." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});
