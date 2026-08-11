import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/users";
import { isAdminEmail } from "@/lib/admin";
import {
  buildDisplayName,
  isUserAdult,
  normalizeUsername,
  validateUsername,
} from "@/lib/userProfile";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido",
    });
  }

  try {
    await connectDB();

    const {
      username,
      firstNames,
      lastNames,
      dateOfBirth,
      email,
      password,
    } = req.body;

    const safeUsername = normalizeUsername(username);
    const safeFirstNames = firstNames?.trim() || "";
    const safeLastNames = lastNames?.trim() || "";
    const safeEmail = email?.trim().toLowerCase() || "";
    const usernameError = validateUsername(safeUsername);

    if (usernameError) {
      return res.status(400).json({
        error: usernameError,
      });
    }

    if (!safeFirstNames) {
      return res.status(400).json({
        error: "Los nombres son obligatorios",
      });
    }

    if (!safeLastNames) {
      return res.status(400).json({
        error: "Los apellidos son obligatorios",
      });
    }

    if (!safeEmail || !password) {
      return res.status(400).json({
        error: "Correo y contraseña son obligatorios",
      });
    }

    if (!dateOfBirth) {
      return res.status(400).json({
        error: "La fecha de nacimiento es obligatoria",
      });
    }

    const parsedDateOfBirth = new Date(dateOfBirth);

    if (Number.isNaN(parsedDateOfBirth.getTime())) {
      return res.status(400).json({
        error: "La fecha de nacimiento no es válida",
      });
    }

    if (!isUserAdult(parsedDateOfBirth)) {
      return res.status(403).json({
        error: "Debes ser mayor de edad para registrarte",
      });
    }

    const existingEmail = await User.findOne({
      email: safeEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "Este correo ya está registrado",
      });
    }

    const existingUsername = await User.findOne({
      username: safeUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        error: "Este nombre de usuario ya está en uso",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: safeUsername,
      firstNames: safeFirstNames,
      lastNames: safeLastNames,
      dateOfBirth: parsedDateOfBirth,
      name: buildDisplayName(safeFirstNames, safeLastNames),
      email: safeEmail,
      password: hashedPassword,
      role: isAdminEmail(safeEmail) ? "admin" : "user",
    });

    return res.status(201).json({
      success: true,
      message: "Usuario registrado",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("ERROR REGISTER:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      if (field === "username") {
        return res.status(409).json({
          error: "Este nombre de usuario ya está en uso",
        });
      }

      return res.status(409).json({
        error: "Este correo ya está registrado",
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
}
