import { getServerSession } from "next-auth/next";

import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import AccessEvent from "@/models/accessEvent";
import Hangar from "@/models/hangars";
import { getUserDisplayLabel } from "@/lib/userProfile";

const EVENTS_LIMIT = 200;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function buildDateRange(rango, fecha) {
  if (rango === "hoy") {
    const hoy = new Date();
    return { $gte: startOfDay(hoy), $lte: endOfDay(hoy) };
  }

  if (rango === "semana") {
    const hoy = new Date();
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 7);
    return { $gte: startOfDay(hace7), $lte: endOfDay(hoy) };
  }

  if (rango === "fecha" && typeof fecha === "string" && fecha.trim()) {
    const dia = new Date(`${fecha}T00:00:00`);
    if (!Number.isNaN(dia.getTime())) {
      return { $gte: startOfDay(dia), $lte: endOfDay(dia) };
    }
  }

  return null;
}

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "POST") {
      const deviceKey = req.headers["x-device-key"];

      if (!process.env.ACCESS_DEVICE_KEY || deviceKey !== process.env.ACCESS_DEVICE_KEY) {
        return res.status(401).json({
          error: "Dispositivo no autorizado",
        });
      }

      const { uid, hangarId } = req.body || {};

      if (typeof uid !== "string" || !uid.trim()) {
        return res.status(400).json({
          error: "uid es obligatorio",
        });
      }

      if (typeof hangarId !== "string" || !hangarId.trim()) {
        return res.status(400).json({
          error: "hangarId es obligatorio",
        });
      }

      const hangar = await Hangar.findById(hangarId)
        .populate("owner", "name email username firstNames lastNames")
        .populate("members.user", "name email username firstNames lastNames");

      if (!hangar) {
        return res.status(404).json({
          error: "Hangar no encontrado",
        });
      }

      const safeUid = uid.trim().toUpperCase();

      // El estado y el nombre los decide el servidor a partir de la tarjeta
      // vinculada en el roster del hangar, no lo que mande el dispositivo.
      let estado = "DENEGADO";
      let nombre = "DESCONOCIDO";

      if (hangar.ownerRfidUid && hangar.ownerRfidUid === safeUid) {
        estado = "AUTORIZADO";
        nombre = getUserDisplayLabel(hangar.owner);
      } else {
        const member = hangar.members.find((entry) => entry.rfidUid === safeUid);

        if (member) {
          estado = "AUTORIZADO";
          nombre = getUserDisplayLabel(member.user);
        }
      }

      // Ya no se alterna ENTRADA/SALIDA: no es confiable si alguien abre la
      // puerta y no vuelve a pasar la tarjeta al salir. Todo evento
      // autorizado es simplemente eso, un acceso autorizado.
      const tipo = estado === "AUTORIZADO" ? "ENTRADA" : "ERROR";

      const event = await AccessEvent.create({
        hangar: hangar._id,
        uid: safeUid,
        nombre,
        estado,
        tipo,
        hora: new Date().toLocaleTimeString(),
      });

      return res.status(200).json({ evento: event });
    }

    if (req.method === "GET") {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({
          error: "No autorizado",
        });
      }

      const { hangarId, estado, rango, fecha } = req.query;

      if (typeof hangarId !== "string" || !hangarId.trim()) {
        return res.status(400).json({
          error: "hangarId es obligatorio",
        });
      }

      const hangar = await Hangar.findOne({
        _id: hangarId,
        $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
      }).lean();

      if (!hangar) {
        return res.status(404).json({
          error: "Hangar no encontrado o sin acceso",
        });
      }

      const query = { hangar: hangarId };

      if (estado === "AUTORIZADO" || estado === "DENEGADO") {
        query.estado = estado;
      }

      const rangoFechas = buildDateRange(rango, fecha);
      if (rangoFechas) {
        query.createdAt = rangoFechas;
      }

      const eventos = await AccessEvent.find(query)
        .sort({ createdAt: -1 })
        .limit(EVENTS_LIMIT)
        .lean();

      return res.status(200).json({ eventos });
    }

    return res.status(405).json({
      error: "Método no permitido",
    });
  } catch (error) {
    console.error("ERROR EN ACCESO:", error);

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}
