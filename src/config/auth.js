import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "fallback_secret_for_local_dev",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache session in memory for 5 minutes
    }
  },
  plugins: [
    jwt({
      jwt: {
        secret: process.env.JWT_SECRET || "super_secret_jwt_key",
        expiresIn: "7d"
      }
    })
  ],
  advanced: {
    cookiePrefix: process.env.COOKIE_NAME || "fitnova_token",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // To support cross-domain frontend/backend
    }
  },
  // Since we are primarily using a separate Express architecture, we might use
  // a custom database adapter, but wait, Better Auth requires a DB adapter to store users.
  // It has a Mongoose plugin/adapter! But the MongoDB adapter requires `@better-auth/mongodb` or we can just use our Mongoose models directly for other things.
  // Wait, Better Auth requires storing User and Session in the DB. We should use the mongodb or mongoose adapter if possible, or just manage users manually via standard JWT if Better Auth is too complex to integrate without its adapters.
  // However, the requirement says: "Use Better Auth compatible backend flow." and "Use Better Auth for authentication."
  // I will use `mongodb` adapter, but we need to install `mongodb` package maybe? Or I can just pass `mongoose.connection.db`.
});
