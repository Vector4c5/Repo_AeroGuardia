import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "./mongodb";
import User from "../models/users";
import { isAdminEmail } from "./admin";
import {
  isProfileComplete,
  isUserAdult,
  parseLoginIdentifier,
} from "./userProfile";

export const authOptions = {
  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        identifier: {
          label: "Correo o usuario",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        await connectDB();

        const login = parseLoginIdentifier(credentials?.identifier);

        if (!login.value || !credentials?.password) {
          throw new Error("Correo o usuario y contraseña son requeridos");
        }

        const query =
          login.type === "email"
            ? { email: login.value }
            : { username: login.value };

        const user = await User.findOne(query);

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        if (!user.password) {
          throw new Error("Esta cuenta utiliza Google para iniciar sesión");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Contraseña incorrecta");
        }

        if (user.dateOfBirth && !isUserAdult(user.dateOfBirth)) {
          throw new Error("Debes ser mayor de edad para acceder");
        }

        await User.findByIdAndUpdate(user._id, {
          lastLogin: new Date(),
        });

        const role = isAdminEmail(user.email) ? "admin" : user.role || "user";

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      await connectDB();

      const email = (user?.email || profile?.email || "").trim().toLowerCase();

      if (!email) {
        return false;
      }

      const name = user?.name || profile?.name || "";

      const existingUser = await User.findOne({
        email,
      });

      if (existingUser?.dateOfBirth && !isUserAdult(existingUser.dateOfBirth)) {
        return "/login?error=minor";
      }

      const role = isAdminEmail(email)
        ? "admin"
        : existingUser?.role || "user";

      if (!existingUser) {
        await User.create({
          name,
          email,
          image: user?.image || null,
          role,
          lastLogin: new Date(),
        });
      } else {
        await User.findByIdAndUpdate(existingUser._id, {
          $set: {
            name,
            image: user?.image || existingUser.image,
            lastLogin: new Date(),
          },
        });
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.email || trigger === "update") {
        await connectDB();

        const email = (user?.email || token.email || "").trim().toLowerCase();

        if (!email) {
          return token;
        }

        const dbUser = await User.findOne({
          email,
        }).lean();

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.image = dbUser.image;
          token.username = dbUser.username || "";
          token.firstNames = dbUser.firstNames || "";
          token.lastNames = dbUser.lastNames || "";
          token.dateOfBirth = dbUser.dateOfBirth
            ? dbUser.dateOfBirth.toISOString()
            : null;
          token.profileComplete = isProfileComplete(dbUser);
          token.role = isAdminEmail(dbUser.email)
            ? "admin"
            : dbUser.role || "user";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.username = token.username || "";
        session.user.firstNames = token.firstNames || "";
        session.user.lastNames = token.lastNames || "";
        session.user.dateOfBirth = token.dateOfBirth || null;
        session.user.profileComplete = Boolean(token.profileComplete);
        session.user.role = token.role || "user";
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
