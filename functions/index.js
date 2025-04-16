// Index.js

const admin = require("firebase-admin");
admin.initializeApp();

// Import user, shift, and admin functions
const userFunctions = require("./users");
const shiftFunctions = require("./shifts");
const adminFunctions = require("./admin");

// User Functions
exports.createUser = userFunctions.createUser;
exports.deleteUser = userFunctions.deleteUser;
exports.updateUserInfo = userFunctions.updateUserInfo;
exports.updateUserPassword = userFunctions.updateUserPassword;

// Shift Functions
exports.createShift = shiftFunctions.createShift;
exports.getShiftInfo = shiftFunctions.getShiftInfo;
exports.updateShift = shiftFunctions.updateShift;
exports.deleteShift = shiftFunctions.deleteShift;
exports.signUpForShift = shiftFunctions.signUpForShift;
exports.checkIntoShift = shiftFunctions.checkIntoShift;
exports.dropShift = shiftFunctions.dropShift;
exports.checkIntoShift = shiftFunctions.checkIntoShift;

// Admin Functions
exports.createAdmin = adminFunctions.createAdmin;
exports.updateAdminPassword = adminFunctions.updateAdminPassword;
exports.getAllUsers = adminFunctions.getAllUsers;
exports.getAllShifts = adminFunctions.getAllShifts;
exports.promoteUserToAdmin = adminFunctions.promoteUserToAdmin;

// --- Extra --- //

// Admin failsafe
const failsafe = require("./adminFailsafe");
exports.createInitialAdmin = failsafe.createInitialAdmin;
