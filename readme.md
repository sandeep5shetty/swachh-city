# 🚀 Smart Garbage Management System (Backend)

## 📌 Overview

This project is a **Smart Garbage Management System Backend** built using Node.js, Express, and MongoDB.
It enables efficient waste management through **citizen reporting, admin control, and real-time tracking**.

---

## 🌐 Base URL

```
http://localhost:5000
```

---

## 🏠 Home Route

### 🔹 Welcome API

```
GET /
```

**Response:**

```
🚀 Welcome to Smart Garbage Management Backend API
```

---

## 👑 Admin Module

### 🔐 Admin Login

```
POST /api/admin/login
```

### 📥 Request Body

```json
{
  "email": "admin@swachh.city",
  "password": "admin123"
}
```

### 📤 Response

```json
{
  "role": "admin",
  "token": "JWT_TOKEN"
}
```

### 🔑 Admin Credentials

```
Email: admin@swachh.city
Password: admin123
```

---

### 🧠 Admin Capabilities

* Manage garbage bins
* Manage trucks
* View all complaints
* Monitor system

---

## 👤 User (Citizen) Module

### 📝 Register User

```
POST /api/user/register
```

### 📥 Request Body

```json
{
  "name": "",
  "email": "test@gmail.com",
  "password": "pass@123",
  "phone": "1234567890",
  "gender": "Male",
  "address": "Bull Temple road, Basavangudi -560019"
}
```

---

### 🔐 User Login

```
POST /api/user/login
```

### 📥 Request Body

```json
{
  "email": "test@gmail.com",
  "password": "pass@123"
}
```

---

### 🧾 Create Complaint

```
POST /api/user/complaint
```

🔒 Requires Token

---

### 📄 Get My Complaints

```
GET /api/user/my-complaints
```

🔒 Requires Token

---

## 🔑 Authentication

All protected routes require JWT token:

```
Authorization: Bearer <token>
```

---

## 📦 Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```
git clone https://github.com/sandeep5shetty/swachh-city.git
cd swachh-city
```

### 2. Install Dependencies

```
npm install
```

### 3. Setup Environment Variables

Create `.env` file:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/garbageDB
```

### 4. Run Server

```
npm run dev
```

---

## 📌 Current Features

* ✅ User Registration & Login
* ✅ Hardcoded Admin Login
* ✅ Complaint Reporting System
* ✅ JWT Authentication
* ✅ Role-based Access

---

## 🚀 Future Enhancements

* Real-time truck tracking
* AI-based garbage prediction
* Map-based visualization
* Notification system

---

## 👨‍💻 Developed For Hackathon

This project is built for solving **real-world urban waste management problems** using smart digital solutions.

---

🔥 *“Clean City, Smart City”*
