<div align="center">
  <h1>🙋 Volunteer Volume</h1>
  <h4>Software solution to managing volunteer shifts for the Virginia Discovery Museum</h4>
  <p>Joshua Markle, Aryan Mhaskar, Neil Patel, & Mani Ferdosian</p>
</div>

<div>
  <img src="https://img.shields.io/badge/-Firebase-%23DD2C00?style=flat-square&logo=firebase&labelColor=%23DD2C00" alt="Firebase Badge">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff&style=flat-square" alt="HTML5 Badge">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff&style=flat-square" alt="CSS3 Badge">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=flat-square" alt="JavaScript Badge">
</div>

**Volunteer Volume** is a no-cost web app that allows the VDM to:
- Manage volunteer shift scheduling
- Allow users to check in upon arrival
- Maintain data privacy and scalability with Firebase

## ✨ Features

- 🔐 **Secure by Design**
  - Firebase Authentication handles user login and admin roles
  - All sensitive operations handled via **server-side Cloud Functions**
- 📆 **User Flow**
  - Volunteers register and view upcoming shifts on their dashboard
  - Check in at the museum using a simple interface
- 🛠️ **Admin Dashboard**
  - Admins can create/delete shifts, view volunteers, and monitor attendance
- 💵 **Virtually Free**
  - See [Cost Breakdown](#-cost-breakdown) — up to ~100 active users with 0 cost

## 📁 Technologies

- Firebase (Auth, Firestore, Cloud Functions, Hosting)
- JavaScript (Vanilla, client-side)
- HTML/CSS for simplicity and control

## 💸 Cost Breakdown

There is effectively **no cost** to this solution unless the museam picks up a bunch of volunteers.

### 🔢 Users Supported Under Free Tier
| New Shifts/Week | Firestore Ops/Week from Shifts | Users to Hit Free Tier (~70k ops/month) |
|---|---|---|
| 15 | 60 | ~90 users |
| 20 | 80 | ~85 users |
| 25 | 100 | ~80 users |
| 30 | 120 | ~75 users |

>[!IMPORTANT]
> This assumes that ALL users are active each week which will NOT be true. It will probably be around 1/10th of the users are active meaning that you could safely 10x the amount of users the software can handle so ~1000 users before breaking into any cost territory.

### ➕ Additional Users per $1/Month
| New Shifts/Week | Shift Ops/Month | User Budget Left | Extra Users per $1 |
|---|---|---|---|
| 15 | ~240 | ~277k - 240 = ~276,760 | ~3,950 users |
| 20 | ~320 | ~276,680 | ~3,952 users |
| 25 | ~400 | ~276,600 | ~3,951 users |
| 30 | ~480 | ~276,520 | ~3,950 users |

If you spend $2/month, this system can handle 2x the amount of users in the table.

Realistically, if you pay 1 dollar, there is virtually no chance that any more money will be spent due to the large amount of scalability that 1 dollar will provide you.

### 🧮 Assumptions
- ALL users are active each week
- Every new shift per week = ~1 write (shift creation)
- Every user signs up & checks into 1 shift/week = ~4 Firestore ops (reads/writes) + 1 function call
- Free tier = 50,000 reads / 20,000 writes / 2M function calls

Pricing:
- $0.06 per 100,000 reads
- $0.18 per 100,000 writes
- Cloud Function calls are negligible at this level

### 👷 Previous Work

This repo is a continuation of [https://github.com/aryanmhaskar/VolunteerVolume](https://github.com/aryanmhaskar/VolunteerVolume)
