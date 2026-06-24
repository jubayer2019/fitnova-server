# FitNova - The Premium Fitness Operating System 🏋️‍♂️

FitNova is a comprehensive, modern operating system designed for fitness studios, personal trainers, and the members who power them. It provides a seamless experience for booking classes, engaging with the community, and managing studio operations through dedicated dashboards.

## 🔗 Live URLs

- **Client App (Vercel)**: [Live Demo Link] *(Replace with your Vercel URL)*
- **Backend API**: [Live API Link] *(Replace with your API URL)*

## 🎯 Purpose

The primary purpose of FitNova is to bridge the gap between fitness enthusiasts and trainers by providing an all-in-one platform. 
- **For Members**: Discover and book fitness classes effortlessly, track bookings, and interact with others in the community forum.
- **For Trainers**: Create and manage classes, review rosters, and share fitness tips on the community forum.
- **For Admins**: Network-wide controls to moderate users, approve or reject trainer applications and classes, and view platform analytics.

## ✨ Key Features

- **Role-Based Dashboards**: Tailored experiences for Users, Trainers, and Admins.
- **Class Booking System**: Users can browse classes, filter by category/price, and seamlessly book them.
- **Community Forum**: A social space for users and trainers to share posts, react (like/dislike), and comment.
- **Trainer Applications**: Users can apply to become trainers, subject to admin approval.
- **Stripe Payment Integration**: Secure transaction processing for class bookings.
- **Dynamic Analytics**: Real-time charts for revenue, member growth, and category shares in the admin dashboard.
- **Secure Authentication**: Modern and secure user authentication powered by Better Auth.

## 🛠️ Technology Stack & Packages

### Frontend (Client)
Built with **Next.js 16** (App Router) and **React 19**, featuring a highly responsive and animated UI.
- **UI & Styling**: TailwindCSS v4, Framer Motion, Radix UI (accessible headless components), Lucide React (icons)
- **State & Data Fetching**: @tanstack/react-query, Axios
- **Authentication**: Better Auth Client
- **Data Visualization**: Recharts
- **Forms & Validation**: React Hook Form, Zod
- **Notifications**: React Hot Toast, Sonner

### Backend (Server)
Built with **Node.js** and **Express.js**, adhering to RESTful API principles.
- **Framework**: Express.js
- **Database & ORM**: MongoDB, Mongoose
- **Authentication & Security**: Better Auth (with Mongo Adapter), JSONWebToken (JWT), Bcrypt, Helmet, CORS, Express Rate Limit
- **Payments**: Stripe Node.js Library
- **Logging & Utilities**: Morgan, Compression, Cookie Parser, Zod

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Connection String
- Stripe API Keys

### Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fitnova.git
   ```

2. **Setup the Server**
   ```bash
   cd server
   npm install
   # Create a .env file and add necessary credentials (DB_URI, JWT_SECRET, STRIPE_KEY, etc.)
   npm run dev
   ```

3. **Setup the Client**
   ```bash
   cd ../client
   npm install
   # Create a .env.local file and set NEXT_PUBLIC_API_URL
   npm run dev
   ```

4. **Open in Browser**
   Visit `http://localhost:3000` to see the app in action!

---
*Built with ❤️ for modern fitness communities.*
