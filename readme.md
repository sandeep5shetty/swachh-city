# Swachh City

Smart Garbage Management Platform for urban waste operations, built for hackathon use-cases with role-based workflows for citizens, drivers, and admins.

## GitHub Project URL

Public repository:

https://github.com/sandeep5shetty/swachh-city

## Problem Statement

Cities struggle with delayed pickups, overflowing bins, fragmented complaint handling, and low operational visibility. Swachh City digitizes the full loop: reporting, dispatching, collection tracking, analytics, and communication.

## What This Project Delivers

- Citizen complaint reporting with image upload support
- Role-based operations dashboard (Citizen, Driver, Admin)
- Live map + digital twin view for bins and fleet
- Bin and truck lifecycle management APIs
- Open data landing page with public operational stats
- Driver assignment and task workflow
- Email alerts to drivers on critical assignments
- Seeded demo dataset for quick hackathon demonstrations

## System Architecture

### Frontend

- Next.js App Router + TypeScript
- Public landing page at root route
- Authenticated operational dashboard at dashboard route
- Map UI with role-filtered navigation and actions
- Cloudinary upload API route for complaint evidence images

### Backend

- Node.js + Express + MongoDB (Mongoose)
- JWT-based auth middleware and admin guard
- Modules for bins, trucks, complaints, users, drivers, stats, email
- Seed script for Bengaluru-like demo data

### Data Flow

1. Citizen submits complaint and optional image evidence.
2. Complaint and bin pressure generate driver tasks.
3. Driver receives assignment and updates status.
4. Admin monitors fleet and complaint resolution.
5. Public landing page consumes stats endpoints for transparency.

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MapLibre GL
- Lucide icons

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcryptjs
- Nodemailer

### External Integrations

- Cloudinary (image upload)
- SMTP (driver alert emails)

## Repository Structure

```text
swachh-city/
  backend/                 # Express API + MongoDB models/controllers/routes
  swachh-city-fe/          # Next.js frontend (landing + dashboard)
  readme.md                # Project documentation
```

## Roles and Access

### Citizen

- Register and login
- Submit complaints
- View own complaint activity in dashboard report flows

### Driver

- Login only (registration managed by admin workflow in dashboard)
- View assigned tasks
- Accept task and mark task completed

### Admin

- Login
- Monitor complaints, bins, fleet metrics
- Register new drivers from admin dashboard
- Manage bins, trucks, complaint statuses

## Key Routes

Base backend URL:

http://localhost:5000

### Core

- GET / : API health/welcome
- GET /api/stats
- GET /api/stats/collection
- GET /api/stats/today

### Auth and Role APIs

- POST /api/user/register
- POST /api/user/login
- POST /api/user/complaint (protected)
- GET /api/user/my-complaints (protected)
- POST /api/admin/login
- GET /api/admin/complaints (admin protected)
- POST /api/driver/register
- POST /api/driver/login

### Bin and Truck APIs

- POST /api/bins
- GET /api/bins
- POST /api/bins/:id
- POST /api/bins/:id/collect
- POST /api/bins/:id/assign-truck
- POST /api/trucks
- GET /api/trucks
- GET /api/trucks/:id
- POST /api/trucks/:id
- POST /api/trucks/:id/location
- POST /api/trucks/truck/:id/empty
- POST /api/trucks/:id/assign-driver

### Notifications

- POST /api/email/driver-alert

## Environment Variables

Create environment files for both backend and frontend.

### backend/.env

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/garbageDB

# Email alert configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=alerts@swachh.city

# Optional override for testing all driver alerts on one inbox
TEST_DRIVER_EMAIL=devfolio0124@gmail.com
```

### swachh-city-fe/.env.local

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Cloudinary (used by frontend API route)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional
NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER=swachh-city/reports
```

## Local Setup

### 1. Clone

```bash
git clone https://github.com/sandeep5shetty/swachh-city.git
cd swachh-city
```

### 2. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../swachh-city-fe
npm install
```

### 3. Seed demo data (recommended)

```bash
cd ../backend
npm run seed
```

### 4. Run backend

```bash
cd backend
npm run dev
```

### 5. Run frontend

In another terminal:

```bash
cd swachh-city-fe
npm run dev
```

Frontend default URL:

http://localhost:3000

## Demo Accounts

### Admin

- Email: admin@swachh.city
- Password: admin123

### Citizens

- citizen@swachh.city / user123
- asha@swachh.city / user123
- rohit@swachh.city / user123
- meera@swachh.city / user123

### Drivers

- manjunath.driver@swachh.city / driver123
- shalini.driver@swachh.city / driver123
- imran.driver@swachh.city / driver123
- naveen.driver@swachh.city / driver123

## Hackathon Demo Flow

1. Open landing page and show live public stats.
2. Login as citizen and create a complaint with image.
3. Login as admin to monitor complaint and register a driver.
4. Login as driver and accept/complete assigned tasks.
5. Trigger assignment and show driver email alert behavior.

## Validation Commands

Frontend lint:

```bash
cd swachh-city-fe
npm run lint
```

Backend run:

```bash
cd backend
npm run dev
```

## Known Notes

- This repository is optimized for hackathon velocity and demo readiness.
- Ensure MongoDB is running before seeding or starting backend.
- Keep repository public and updated for hackathon evaluation.

## Hackathon Submission Checklist

- Public GitHub repository
- Complete README with setup, architecture, and demo instructions
- Working local run steps for backend and frontend
- Demo credentials and sample flow documented

## Authors

- Sandeep Shetty and team

## Tagline

Clean City, Smart City.
