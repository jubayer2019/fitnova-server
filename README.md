# FitNova Backend API

This is the Node.js/Express backend server for the FitNova fitness and gym management platform. It serves the Next.js frontend with robust authentication, role-based access control, Stripe payment integration, and complete class/forum management.

## Features

- **Authentication**: JWT-based session management with HTTPOnly secure cookies. Compatible with Next.js frontend Better Auth flow.
- **Roles & Permissions**: Fine-grained access control for Users, Trainers, and Admins.
- **Security**: Built-in protection with Helmet, Express Rate Limit, and CORS configured for cross-origin credentials.
- **Payments**: Stripe API integration with PaymentIntents and Webhook handling for reliable booking creation.
- **Database**: MongoDB via Mongoose with optimized serverless connection caching.
- **Features**: Searchable Classes, Bookings, Favorites, Trainer Applications, Forum Posts, Comments, and Dashboards.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
MONGODB_URI=mongodb://localhost:27017/fitnova
JWT_SECRET=super_secret_jwt_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
COOKIE_NAME=fitnova_token
```

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed the database (optional):
   ```bash
   npm run seed
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

The server will be running at `http://localhost:5000`. 
Check `http://localhost:5000/api/health` to confirm.

## API Overview

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`
- **Users**: `/api/users/me`, `/api/users/dashboard-stats`
- **Classes**: `/api/classes` (GET, POST), `/api/classes/:id` (GET, PATCH, DELETE)
- **Bookings**: `/api/bookings` (POST, GET)
- **Favorites**: `/api/favorites` (POST, GET, DELETE)
- **Trainer Applications**: `/api/trainer-applications` (POST, GET)
- **Forum**: `/api/forum/posts` (GET, POST, PATCH, DELETE), `/api/forum/posts/:id/like`
- **Payments**: `/api/payments/create-payment-intent`, `/api/payments/confirm-booking`
- **Admin**: `/api/admin/overview`, `/api/admin/users`, `/api/admin/classes`
- **Trainer**: `/api/trainer/overview`, `/api/trainer/my-classes`

## Deployment Notes (Vercel)

This project is fully configured for deployment on Vercel using serverless functions.
The `vercel.json` maps all routes to `src/server.js`.
MongoDB connections are cached to prevent multiple instances from exhausting connection pools. Ensure all environment variables are properly set in the Vercel dashboard.
