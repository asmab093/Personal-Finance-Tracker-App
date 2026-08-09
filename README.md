# 📊 Personal Finance Tracker

A full-stack mobile application designed to help users take control of their financial health. This app provides secure authentication, intuitive income and expense tracking, dynamic visual analytics, and monthly budget management.

This project was built to demonstrate end-to-end full-stack development, from a cross-platform mobile frontend to a secure, serverless cloud backend.

## ✨ Key Features

- **Secure Authentication:** Custom JWT-based registration and login system, featuring password hashing with bcryptjs.
- **Intuitive Dashboard:** Real-time calculation of total balance, income, and expenses with filtering and sorting capabilities.
- **Dynamic Analytics:** Visual expense breakdown using interactive pie charts to categorize spending habits.
- **Budget Management:** Set monthly budget goals with visual progress bars indicating remaining allowances or overspending.
- **Exportable Reports:** Instantly generate and share monthly financial reports as structured PDF documents.
- **Advanced Security & Customization:** Features biometric app lock (fingerprint/face ID), dark/light mode toggling, and multi-currency support.

---

## 🛠️ Tech Stack

**Frontend (Mobile App)**
- **Framework:** React Native (via Expo)
- **Routing:** Expo Router
- **State Management:** React Context API & AsyncStorage
- **Data Visualization:** react-native-chart-kit
- **Utilities:** expo-print (PDF generation), expo-local-authentication (Biometrics)

**Backend (RESTful API)**
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Security:** JSON Web Tokens (JWT), bcryptjs, CORS
- **Deployment:** Vercel (Serverless Functions)

---

## 🚀 Getting Started

To run this project locally on your machine, follow these steps:

### 1. Clone the Repository

```bash
git clone [https://github.com/asmab093/Personal-Finance-Tracker-App.git](https://github.com/asmab093/Personal-Finance-Tracker-App.git)
cd Personal-Finance-Tracker-App
***
2. Backend Setup
Navigate to the backend directory, install dependencies, and set up your environment variables.

Bash
cd backend
npm install
Create a .env file in the backend folder and add the following:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
Start the local server:

Bash
npm run dev
***3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies.

Bash
cd frontend
npm install
Update the API_BASE_URL in your frontend API files (e.g., index.tsx, wallet.tsx) to point to your local machine's IP address while testing locally (e.g., http://192.168.1.X:5000/api).

Start the Expo development server:

Bash
npx expo start
Scan the QR code with the Expo Go app on your physical device, or run it on an Android/iOS emulator.
***📡 API Endpoints
The backend exposes a RESTful API. Here are the core endpoints:

Authentication

POST /api/auth/register - Create a new user account

POST /api/auth/login - Authenticate user and receive JWT

PUT /api/auth/change-password - Update account password securely

Transactions (Protected Routes)

GET /api/transactions - Retrieve all user transactions

POST /api/transactions - Add a new income/expense record

PUT /api/transactions/:id - Update an existing transaction

DELETE /api/transactions/:id - Remove a transaction

DELETE /api/transactions/all - Account reset (clears all records)
***📱 Screenshots
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 46 PM (1)" src="https://github.com/user-attachments/assets/1f3c5314-d1a8-42ad-b50c-95a137518b18" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 49 PM" src="https://github.com/user-attachments/assets/25cc0f88-cb07-434b-8557-68eea45112cc" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 49 PM (1)" src="https://github.com/user-attachments/assets/db0b8090-0fda-4ff0-bed5-459c657b5638" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 48 PM" src="https://github.com/user-attachments/assets/3de5422b-aac9-4687-b539-71781d114cb7" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 48 PM (1)" src="https://github.com/user-attachments/assets/b6230a92-6de5-476a-bda1-ccc473e6418c" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 47 PM" src="https://github.com/user-attachments/assets/36a1e943-2225-4bc6-b410-122fdbca7ca1" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 47 PM (1)" src="https://github.com/user-attachments/assets/dae7bb19-7c31-496a-88ba-0a407243f2a1" />
<img width="738" height="1600" alt="WhatsApp Image 2026-08-09 at 1 08 46 PM" src="https://github.com/user-attachments/assets/bd6814b4-c1a8-4095-af3a-674cdc870f1f" />




