import { getServerSession } from "next-auth/next";

import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import AccessEvent from "@/models/accessEvent";

const EVENTS_LIMIT = 200;

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

      const { uid, estado, nombre } = req.body || {};

      if (typeof uid !== "string" || !uid.trim()) {
        return res.status(400).json({
          error: "uid es obligatorio",
        });
      }

      if (estado !== "AUTORIZADO" && estado !== "DENEGADO") {
        return res.status(400).json({
          error: "estado debe ser AUTORIZADO o DENEGADO",
        });
      }

      const safeUid = uid.trim();
      const safeNombre = typeof nombre === "string" && nombre.trim() ? nombre.trim() : "DESCONOCIDO";

      let tipo = "ERROR";

      if (estado === "AUTORIZADO") {
        const lastEvent = await AccessEvent.findOne({
          uid: safeUid,
          estado: "AUTORIZADO",
        }).sort({ createdAt: -1 });

        tipo = lastEvent?.tipo === "ENTRADA" ? "SALIDA" : "ENTRADA";
      }

      const event = await AccessEvent.create({
        uid: safeUid,
        nombre: estado === "AUTORIZADO" ? safeNombre : "DESCONOCIDO",
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

      const eventos = await AccessEvent.find()
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
