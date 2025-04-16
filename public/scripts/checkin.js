// checkin.js
// Handle check in logic

import { functions } from "./firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

const checkInFn = httpsCallable(functions, "checkIntoShift");

const form = document.getElementById("checkInForm");
const messageDiv = document.getElementById("checkInMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("checkInEmail").value;
  messageDiv.textContent = "Checking for today’s shift...";

  try {
    const result = await checkInFn({ email });
    const { message, shift } = result.data;

    if (shift) {
      messageDiv.innerHTML = `
        <p>${message}</p>
        <p>Shift: ${shift.date} at ${shift.time} – ${shift.position}</p>
      `;
    } else {
      messageDiv.textContent = message;
    }
  } catch (error) {
    messageDiv.textContent = `Error: ${error.message}`;
  }
});
