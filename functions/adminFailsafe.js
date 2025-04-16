// Used if there is no admin user

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Allows creating the first admin ONLY if no admin exists.
 * If a user with the given email exists, promotes that user.
 * Expects: { email, password, firstName, lastName, address?, birthday? }
 */
exports.createInitialAdmin = onCall({ region: "us-east4" }, async (request) => {
	const { email, password, firstName, lastName, address = "", birthday = "" } = request.data;

	if (!email || !password || !firstName || !lastName) {
		throw new HttpsError("invalid-argument", "Missing required fields.");
	}

	// Check if an admin already exists.
	const adminsSnapshot = await db.collection("users").where("role", "==", "admin").limit(1).get();
	if (!adminsSnapshot.empty) {
		throw new HttpsError("permission-denied", "An admin already exists.");
	}

	try {
		let userRecord;
		try {
			// See if a user already exists with this email.
			userRecord = await admin.auth().getUserByEmail(email);
		} catch (err) {
			// If not, create a new user.
			userRecord = await admin.auth().createUser({ email, password });
		}
		const uid = userRecord.uid;

		// Set the custom claim to mark as admin.
		await admin.auth().setCustomUserClaims(uid, { admin: true });

		// Create the corresponding Firestore user document.
		await db.collection("users").doc(uid).set({
			email,
			firstName,
			lastName,
			address,
			birthday,
			role: "admin", // Mark as admin.
			approved: true,
			shifts: []
		});

		return { success: true, message: "Initial admin created." };
	} catch (error) {
		throw new HttpsError("internal", error.message);
	}
});
