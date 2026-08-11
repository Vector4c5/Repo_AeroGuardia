import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Hangar from "@/models/hangars";
import Aircraft from "@/models/aircraft";

const PRIVACY_MESSAGE =
  "Esta aeronave estuvo (o está) registrada en otro hangar dentro de AeroGuardia. Puedes ingresarla aquí, pero debes completar los datos manualmente.";

async function getHangarWithAccess(hangarId, userId) {
  return Hangar.findOne({
    _id: hangarId,
    $or: [{ owner: userId }, { "members.user": userId }],
  });
}

async function getUserHangarIds(userId) {
  const hangars = await Hangar.find({
    $or: [{ owner: userId }, { "members.user": userId }],
  })
    .select("_id")
    .lean();

  return hangars.map((hangar) => hangar._id);
}

function publicAircraftSummary(aircraft) {
  return {
    _id: aircraft._id,
    registration: aircraft.registration,
    manufacturer: aircraft.manufacturer,
    model: aircraft.model,
    serialNumber: aircraft.serialNumber,
    aircraftType: aircraft.aircraftType,
    stayReason: aircraft.stayReason,
    status: aircraft.status,
    hangar: aircraft.hangar,
    entryDate: aircraft.entryDate,
    exitDate: aircraft.exitDate,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "No autorizado" });
    }

    await connectDB();

    const { hangarId, registration } = req.query;

    if (!hangarId) {
      return res.status(400).json({ error: "Falta el id del hangar" });
    }

    const hangar = await getHangarWithAccess(hangarId, session.user.id);

    if (!hangar) {
      return res.status(404).json({
        error: "Hangar no encontrado o sin acceso",
      });
    }

    const safeRegistration = String(registration || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (!safeRegistration || safeRegistration.length < 2) {
      return res.status(400).json({
        error: "Indica una matrícula válida para buscar",
      });
    }

    const userHangarIds = await getUserHangarIds(session.user.id);

    const aircraftInUserHangars = await Aircraft.findOne({
      registration: safeRegistration,
      hangar: { $in: userHangarIds },
    }).lean();

    if (aircraftInUserHangars) {
      const aircraftHangarId =
        aircraftInUserHangars.hangar?.toString?.() ||
        String(aircraftInUserHangars.hangar);
      const sameHangar = aircraftHangarId === String(hangarId);
      const isInHangar = aircraftInUserHangars.status === "En hangar";

      if (isInHangar && sameHangar) {
        return res.status(200).json({
          found: true,
          registration: safeRegistration,
          canCreate: false,
          canReenter: false,
          canClaim: false,
          reason: "already_here",
          message: "Esta aeronave ya está registrada en este hangar.",
          aircraft: publicAircraftSummary(aircraftInUserHangars),
        });
      }

      // Belongs to user's hangars: autofill and allow move/reentry into current hangar
      return res.status(200).json({
        found: true,
        registration: safeRegistration,
        canCreate: false,
        canReenter: true,
        canClaim: false,
        reason: "reentry",
        message: isInHangar
          ? "Aeronave encontrada en otro de tus hangares. Se autorrellenaron los datos para ingresarla aquí."
          : "Aeronave encontrada en tus hangares. Se autorrellenaron los datos para reingresarla.",
        aircraft: publicAircraftSummary(aircraftInUserHangars),
      });
    }

    const existsElsewhere = await Aircraft.exists({
      registration: safeRegistration,
    });

    if (existsElsewhere) {
      // Unique matrícula elsewhere: allow intake with manual fields, no private record data
      return res.status(200).json({
        found: true,
        registration: safeRegistration,
        canCreate: false,
        canReenter: false,
        canClaim: true,
        reason: "private_other_hangar",
        message: PRIVACY_MESSAGE,
      });
    }

    return res.status(200).json({
      found: false,
      registration: safeRegistration,
      canCreate: true,
      canReenter: false,
      canClaim: false,
    });
  } catch (error) {
    console.error("ERROR AIRCRAFT LOOKUP:", error);
    return res.status(500).json({ error: error.message });
  }
}
