import { getServerSession } from "next-auth/next";

import connectDB from "@/lib/mongodb";
import Hangar from "@/models/hangars";
import Aircraft from "@/models/aircraft";
import { authOptions } from "@/lib/authOptions";
import {
  generateInviteCode,
  getInviteCodeExpiryDate,
  isInviteCodeExpired,
  isInviteCodeVisible,
} from "@/lib/hangarInvite";
import { formatHangarMember } from "@/lib/userProfile";
import { resolveHangarVisualFields } from "@/lib/hangarTypes";

async function rotateExpiredInviteCode(hangar) {
  if (!isInviteCodeExpired(hangar)) {
    return hangar;
  }

  return Hangar.findByIdAndUpdate(
    hangar._id,
    {
      $set: {
        inviteCode: generateInviteCode(),
        inviteCodeExpiresAt: null,
      },
    },
    { new: true }
  ).lean();
}

function formatHangarForUser(hangar, userId) {
  const ownerId = hangar.owner?._id?.toString() || hangar.owner?.toString();
  const member = hangar.members?.find((entry) => {
    const memberUserId =
      entry.user?._id?.toString() || entry.user?.toString();

    return memberUserId === userId?.toString();
  });
  const isOwner = ownerId === userId?.toString();

  const formattedHangar = {
    ...hangar,
    id: hangar._id?.toString?.() || hangar._id,
    label: hangar.name,
    isOwner,
    role: isOwner ? "owner" : member?.role || null,
    inviteCodeVisible: false,
    inviteCodeExpiresAt: hangar.inviteCodeExpiresAt || null,
    members: hangar.members?.map(formatHangarMember) || [],
  };

  if (isOwner && isInviteCodeVisible(hangar)) {
    formattedHangar.inviteCodeVisible = true;
    formattedHangar.inviteCode = hangar.inviteCode;
  } else {
    delete formattedHangar.inviteCode;
  }

  if (!isOwner) {
    delete formattedHangar.inviteCode;
    delete formattedHangar.inviteCodeExpiresAt;
  }

  return formattedHangar;
}

async function getHangarWithAccess(hangarId, userId) {
  return Hangar.findOne({
    _id: hangarId,
    $or: [{ owner: userId }, { "members.user": userId }],
  });
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({
        error: "No autorizado",
      });
    }

    await connectDB();

    const { hangarId } = req.query;

    if (!hangarId) {
      return res.status(400).json({
        error: "Falta el id del hangar",
      });
    }

    if (req.method === "GET") {
      let hangar = await Hangar.findOne({
        _id: hangarId,
        $or: [
          { owner: session.user.id },
          { "members.user": session.user.id },
        ],
      })
        .populate("owner", "name email username firstNames lastNames")
        .populate("members.user", "name email username firstNames lastNames")
        .lean();

      if (!hangar) {
        return res.status(404).json({
          error: "Hangar no encontrado o sin acceso",
        });
      }

      const ownerId = hangar.owner._id.toString();
      if (ownerId === session.user.id) {
        hangar = (await rotateExpiredInviteCode(hangar)) || hangar;
        if (!hangar.owner?.email) {
          hangar = await Hangar.findById(hangar._id)
            .populate("owner", "name email username firstNames lastNames")
            .populate(
              "members.user",
              "name email username firstNames lastNames"
            )
            .lean();
        }
      }

      return res.status(200).json({
        hangar: formatHangarForUser(hangar, session.user.id),
      });
    }

    if (req.method === "PATCH") {
      const { action, memberUserId } = req.body;

      if (action === "remove_member") {
        if (!memberUserId) {
          return res.status(400).json({
            error: "Falta el usuario a expulsar",
          });
        }

        const hangar = await Hangar.findOne({
          _id: hangarId,
          owner: session.user.id,
        });

        if (!hangar) {
          return res.status(404).json({
            error: "Hangar no encontrado o no tienes permisos",
          });
        }

        hangar.members = hangar.members.filter(
          (entry) => entry.user.toString() !== memberUserId
        );
        await hangar.save();

        const updatedHangar = await Hangar.findById(hangar._id)
          .populate("owner", "name email username firstNames lastNames")
          .populate("members.user", "name email username firstNames lastNames")
          .lean();

        return res.status(200).json({
          hangar: formatHangarForUser(updatedHangar, session.user.id),
          message: "Miembro expulsado correctamente",
        });
      }

      if (action === "leave_hangar") {
        const hangar = await Hangar.findOne({
          _id: hangarId,
          "members.user": session.user.id,
        });

        if (!hangar) {
          return res.status(404).json({
            error: "Hangar no encontrado o no formas parte de él",
          });
        }

        if (hangar.owner.toString() === session.user.id) {
          return res.status(400).json({
            error: "El propietario no puede salir del hangar.",
          });
        }

        hangar.members = hangar.members.filter(
          (entry) => entry.user.toString() !== session.user.id
        );
        await hangar.save();

        return res.status(200).json({
          success: true,
          hangarId,
          message: "Has salido del hangar correctamente",
        });
      }

      if (action === "reveal_invite_code") {
        let hangar = await Hangar.findOne({
          _id: hangarId,
          owner: session.user.id,
        }).lean();

        if (!hangar) {
          return res.status(404).json({
            error: "Hangar no encontrado o no tienes permisos",
          });
        }

        if (isInviteCodeExpired(hangar)) {
          hangar = (await rotateExpiredInviteCode(hangar)) || hangar;
        }

        if (!isInviteCodeVisible(hangar)) {
          hangar = await Hangar.findByIdAndUpdate(
            hangar._id,
            {
              $set: {
                inviteCodeExpiresAt: getInviteCodeExpiryDate(),
              },
            },
            { new: true }
          ).lean();
        }

        return res.status(200).json({
          hangar: formatHangarForUser(hangar, session.user.id),
          message: "Código de invitación visible por 24 horas",
        });
      }

      return res.status(400).json({
        error: "Acción no válida",
      });
    }

    if (req.method === "PUT") {
      const {
        name,
        label,
        location,
        baseAirport,
        description,
        hangarType,
        classification,
      } = req.body;

      const hangarName = (name || label)?.trim();

      if (!hangarName) {
        return res.status(400).json({
          error: "El nombre es obligatorio",
        });
      }

      if (!location?.trim()) {
        return res.status(400).json({
          error: "La ubicación es obligatoria",
        });
      }

      const visual = resolveHangarVisualFields(hangarType);
      const safeBaseAirport = (baseAirport || "XXXX").trim().toUpperCase();

      if (baseAirport && !/^[A-Z]{4}$/.test(safeBaseAirport)) {
        return res.status(400).json({
          error:
            "El aeropuerto base debe ser un código ICAO de 4 letras (ej. MMMX)",
        });
      }

      const updatedHangar = await Hangar.findOneAndUpdate(
        {
          _id: hangarId,
          owner: session.user.id,
        },
        {
          name: hangarName,
          location: location.trim(),
          baseAirport: safeBaseAirport,
          description: description?.trim() || "",
          classification: classification || visual.classification,
          hangarType: visual.hangarType,
          zoneTitle: visual.zoneTitle,
          image: visual.image,
        },
        { new: true }
      )
        .populate("owner", "name email username firstNames lastNames")
        .populate("members.user", "name email username firstNames lastNames")
        .lean();

      if (!updatedHangar) {
        return res.status(404).json({
          error: "Hangar no encontrado o no tienes permisos",
        });
      }

      return res.status(200).json({
        hangar: formatHangarForUser(updatedHangar, session.user.id),
      });
    }

    if (req.method === "DELETE") {
      const deletedHangar = await Hangar.findOneAndDelete({
        _id: hangarId,
        owner: session.user.id,
      });

      if (!deletedHangar) {
        return res.status(404).json({
          error: "Hangar no encontrado o no tienes permisos",
        });
      }

      // Improvement: cascade delete aircraft
      await Aircraft.deleteMany({ hangar: hangarId });

      return res.status(200).json({
        success: true,
        message: "Hangar eliminado",
      });
    }

    return res.status(405).json({
      error: "Método no permitido",
    });
  } catch (error) {
    console.error("ERROR EN HANGAR DETAIL:", error);

    return res.status(500).json({
      error: error.message || "Error interno del servidor",
    });
  }
}
