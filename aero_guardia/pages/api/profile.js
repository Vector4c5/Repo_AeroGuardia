import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Aircraft from "@/models/aircraft";
import Hangar from "@/models/hangars";
import User from "@/models/users";
import {
  buildDisplayName,
  isUserAdult,
  normalizeUsername,
  validateUsername,
} from "@/lib/userProfile";

function formatProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username || "",
    firstNames: user.firstNames || "",
    lastNames: user.lastNames || "",
    dateOfBirth: user.dateOfBirth || null,
    email: user.email,
    role: user.role,
    image: user.image || null,
  };
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({
        error: "No autorizado",
      });
    }

    await connectDB();

    if (req.method === "GET") {
      const user = await User.findById(session.user.id).lean();

      if (!user) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        profile: formatProfile(user),
      });
    }

    if (req.method === "PUT") {
      const { username, firstNames, lastNames, dateOfBirth } = req.body;

      const safeUsername = normalizeUsername(username);
      const safeFirstNames = firstNames?.trim() || "";
      const safeLastNames = lastNames?.trim() || "";
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
          error: "Debes ser mayor de edad para usar AeroGuardia",
        });
      }

      const existingUsername = await User.findOne({
        username: safeUsername,
        _id: { $ne: session.user.id },
      }).lean();

      if (existingUsername) {
        return res.status(409).json({
          error: "Este nombre de usuario ya está en uso",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        {
          username: safeUsername,
          firstNames: safeFirstNames,
          lastNames: safeLastNames,
          dateOfBirth: parsedDateOfBirth,
          name: buildDisplayName(safeFirstNames, safeLastNames),
        },
        { new: true }
      ).lean();

      return res.status(200).json({
        profile: formatProfile(updatedUser),
        message: "Perfil actualizado correctamente",
      });
    }

    if (req.method === "DELETE") {
      const userId = session.user.id;

      const ownedHangars = await Hangar.find({
        owner: userId,
      })
        .select("_id")
        .lean();

      const ownedHangarIds = ownedHangars.map((hangar) => hangar._id);

      if (ownedHangarIds.length > 0) {
        await Aircraft.deleteMany({
          hangar: { $in: ownedHangarIds },
        });

        await Hangar.deleteMany({
          _id: { $in: ownedHangarIds },
        });
      }

      await Aircraft.deleteMany({
        owner: userId,
      });

      // Fixed: pull by members.user (correct nested path)
      await Hangar.updateMany(
        { "members.user": userId },
        { $pull: { members: { user: userId } } }
      );

      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Perfil eliminado correctamente",
      });
    }

    return res.status(405).json({
      error: "Método no permitido",
    });
  } catch (error) {
    console.error("ERROR EN PROFILE:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Este nombre de usuario ya está en uso",
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
}
