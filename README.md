# ♻️ E-Waste Recycling Platform

## 📌 Project Overview

The **E-Waste Recycling Platform** is a full-stack web application designed to manage and promote responsible disposal and recycling of electronic waste. The platform connects **users, organizations, and recycling centers** to facilitate the collection, tracking, and recycling of electronic devices.

The goal of the project is to provide a **digital solution to the growing problem of electronic waste** by enabling users to submit e-waste recycling requests and allowing organizations to manage device recycling efficiently.

---

# 🚨 Problem Statement

Electronic waste (e-waste) is one of the fastest-growing waste streams in the world. Improper disposal of electronic devices leads to:

* Environmental pollution
* Toxic chemical leakage
* Loss of valuable recyclable materials
* Health hazards

Many people do not know **where or how to dispose of their old electronics responsibly**.

---

# 💡 Proposed Solution

This platform provides a **centralized system** where:

* Users can register and submit e-waste recycling requests
* Organizations can manage device collection
* Recycling centers can track and process e-waste
* Administrators can monitor recycling activity

The platform helps ensure **proper disposal, tracking, and recycling of electronic waste**.

---

# 🎯 Objectives

* Promote responsible e-waste disposal
* Provide a digital platform for recycling requests
* Track electronic devices submitted for recycling
* Connect users with recycling organizations
* Improve transparency in recycling processes

---

# 👥 Target Users

* Individuals with old electronic devices
* Recycling organizations
* Waste management authorities
* Environmental organizations

---

# ⚙️ Tech Stack

## Frontend

* HTML
* CSS
* JavaScript
* Fetch API

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose ODM

## Authentication

* JSON Web Token (JWT)
* bcrypt.js

## Development Tools

* VS Code
* Git
* Postman / Thunder Client

---

# 🏗 System Architecture

```
User Browser
     │
     ▼
Frontend Interface
     │
HTTP Requests (API)
     ▼
Backend Server (Node.js + Express)
     │
Database Queries
     ▼
MongoDB Database
```

---

# 📂 Project Structure

```
PBL
│
├── backend
│   │
│   ├── config
│   │   └── db.js
│   │
│   ├── middleware
│   │   └── authMiddleware.js
│   │
│   ├── models
│   │   ├── User.js
│   │   ├── Devices.js
│   │   └── Organization.js
│   │
│   ├── node_modules
│   │
│   ├── .env
│   ├── package.json
│
├── app.js
├── API_KEY.txt
└── README.md
```

---

# 🔑 Key Features

### 👤 User Management

* User registration
* Secure login authentication
* Password encryption using bcrypt

### ♻️ Device Recycling Management

* Add electronic devices for recycling
* Track submitted devices
* Manage recycling requests

### 🏢 Organization Management

* Register recycling organizations
* Manage device collection
* Track recycling status

### 🔐 Security

* JWT authentication
* Protected API routes
* Secure password storage

---

# 🗄 Database Design

## User Collection

Stores information about platform users.

Fields:

* Name
* Email
* Password
* Role

---

## Device Collection

Stores information about electronic devices submitted for recycling.

Fields:

* Device name
* Device type
* User ID
* Recycling status

---

## Organization Collection

Stores recycling organization details.

Fields:

* Organization name
* Contact details
* Address
* Managed devices

---

# 🔌 API Endpoints

## Authentication APIs

```
POST /api/register
POST /api/login
```

---

## Device APIs

```
GET /api/devices
POST /api/devices
DELETE /api/devices/:id
```

---

## Organization APIs

```
GET /api/organizations
POST /api/organizations
```

---

# 🛠 Installation Guide

## 1️⃣ Clone the Repository

```
git clone https://github.com/yourusername/pbl-project.git
```

```
cd pbl-project
```

---

## 2️⃣ Install Backend Dependencies

```
cd backend
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file inside the backend folder.

Example:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 4️⃣ Start the Backend Server

```
node app.js
```

Server will start on:

```
http://localhost:5000
```

---

# 🚀 Deployment

The project can be deployed using free cloud services:

* Backend → Render
* Frontend → Vercel
* Database → MongoDB Atlas
* Source Code → GitHub

---

# 🔒 Security Measures

* Password hashing using bcrypt
* JWT authentication
* Protected routes using middleware
* Environment variables for sensitive data

---

# 🌍 Environmental Impact

This platform encourages responsible recycling of electronic devices and contributes to:

* Reduced landfill waste
* Safer disposal of hazardous materials
* Recovery of valuable recyclable components
* Sustainable waste management

---

# 📈 Future Improvements

* Mobile application support
* Pickup scheduling system
* AI-based waste classification
* Location-based recycling center finder
* Recycling analytics dashboard

---

# 👨‍💻 Contributors

Project developed as part of **Project Based Learning (PBL)**.

Students:

Bhumi Jha 
Anushka Kolhe 
Jagruti Bharsat
Ankita Swami

---

# 📄 License

This project is created for **educational and research purposes**.

---

# ⭐ Acknowledgements

Special thanks to the faculty and mentors who supported the development of this PBL project.
