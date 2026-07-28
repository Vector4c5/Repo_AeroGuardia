import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Hangar from "@/models/hangars";
import Aircraft from "@/models/aircraft";
import { getPendingTaskType } from "@/lib/pendingTaskTypes";

const AIRCRAFT_TYPES = [
  "Ala fija",
  "Ala rotativa",
  "Vehículo no tripulado",
  "Otro",
];

async function getHangarWithAccess(hangarId, userId) {
  return Hangar.findOne({
    _id: hangarId,
    $or: [{ owner: userId }, { "members.user": userId }],
  });
}

function sanitizeConditions(items = []) {
  return items
    .map((item) => ({
      title: item.title?.trim(),
      description: item.description?.trim() || "",
    }))
    .filter((item) => item.title);
}

function sanitizeMaintenanceTasks(items = [], userId) {
  return items
    .map((item) => ({
      title: item.title?.trim(),
      description: item.description?.trim() || "",
      taskType: getPendingTaskType(item),
      status: "pending",
      createdBy: userId,
    }))
    .filter((item) => item.title);
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

    const hangar = await getHangarWithAccess(hangarId, session.user.id);

    if (!hangar) {
      return res.status(404).json({
        error: "Hangar no encontrado o sin acceso",
      });
    }

    if (req.method === "GET") {
      const aircraft = await Aircraft.find({
        hangar: hangarId,
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        aircraftList: aircraft,
        hangar: {
          _id: hangar._id,
          name: hangar.name,
        },
      });
    }

    if (req.method === "POST") {
      const {
        mode = "create",
        aircraftId,
        intakeReportByName,
        registration,
        manufacturer,
        model,
        serialNumber,
        aircraftType,
        stayReason,
        entryDate,
        arrivalConditions,
        maintenanceTasks,
      } = req.body;

      const safeIntakeName =
        intakeReportByName?.trim() ||
        [session.user.firstNames, session.user.lastNames]
          .filter(Boolean)
          .join(" ") ||
        session.user.name ||
        "";
      const safeStayReason = stayReason?.trim();
      const parsedEntryDate = entryDate ? new Date(entryDate) : null;

      if (mode === "reentry") {
        if (!aircraftId) {
          return res.status(400).json({
            error: "Falta el id de la aeronave a reingresar",
          });
        }

        if (!safeIntakeName || !safeStayReason || !entryDate) {
          return res.status(400).json({
            error:
              "Completa fecha de ingreso, razón de estancia y responsable del reporte",
          });
        }

        if (Number.isNaN(parsedEntryDate?.getTime())) {
          return res.status(400).json({
            error: "La fecha de ingreso no es válida",
          });
        }

        const existing = await Aircraft.findById(aircraftId);

        if (!existing) {
          return res.status(404).json({
            error: "Aeronave no encontrada",
          });
        }

        const userHangars = await Hangar.find({
          $or: [
            { owner: session.user.id },
            { "members.user": session.user.id },
          ],
        })
          .select("_id")
          .lean();

        const userHangarIdSet = new Set(
          userHangars.map((item) => item._id.toString())
        );
        const existingHangarId =
          existing.hangar?.toString?.() || String(existing.hangar);

        if (!userHangarIdSet.has(existingHangarId)) {
          return res.status(403).json({
            error:
              "Esta aeronave estuvo (o está) registrada en otro hangar dentro de AeroGuardia. Usa el ingreso manual.",
          });
        }

        if (
          existing.status === "En hangar" &&
          existingHangarId === String(hangarId)
        ) {
          return res.status(409).json({
            error: "Esta aeronave ya está en este hangar",
          });
        }

        const newTasks = sanitizeMaintenanceTasks(
          maintenanceTasks,
          session.user.id
        );
        const newConditions = sanitizeConditions(arrivalConditions);

        existing.hangar = hangarId;
        existing.owner = session.user.id;
        existing.status = "En hangar";
        existing.intakeReportByName = safeIntakeName;
        existing.stayReason = safeStayReason;
        existing.entryDate = parsedEntryDate;
        existing.arrivalConditions = newConditions;
        existing.exitDate = undefined;
        existing.exitReportByName = "";
        existing.exitNote = "";
        existing.exitRegisteredBy = undefined;

        for (const task of newTasks) {
          existing.maintenanceTasks.push(task);
        }

        await existing.save();

        return res.status(200).json({
          aircraft: existing.toObject(),
          mode: "reentry",
          message: "Aeronave reingresada correctamente",
        });
      }

      if (mode === "claim") {
        const safeRegistration = registration
          ?.trim()
          .toUpperCase()
          .replace(/\s+/g, "");
        const safeManufacturer = manufacturer?.trim();
        const safeModel = model?.trim();
        const safeSerialNumber = serialNumber?.trim();

        if (
          !safeIntakeName ||
          !safeRegistration ||
          !safeManufacturer ||
          !safeModel ||
          !safeSerialNumber ||
          !aircraftType ||
          !safeStayReason ||
          !entryDate
        ) {
          return res.status(400).json({
            error: "Completa todos los campos obligatorios del ingreso",
          });
        }

        if (!AIRCRAFT_TYPES.includes(aircraftType)) {
          return res.status(400).json({
            error: "El tipo de aeronave no es válido",
          });
        }

        if (Number.isNaN(parsedEntryDate?.getTime())) {
          return res.status(400).json({
            error: "La fecha de ingreso no es válida",
          });
        }

        const existing = await Aircraft.findOne({
          registration: safeRegistration,
        });

        if (!existing) {
          return res.status(404).json({
            error: "No existe una aeronave con esa matrícula",
          });
        }

        const existingHangarId =
          existing.hangar?.toString?.() || String(existing.hangar);

        if (
          existing.status === "En hangar" &&
          existingHangarId === String(hangarId)
        ) {
          return res.status(409).json({
            error: "Esta aeronave ya está en este hangar",
          });
        }

        const serialConflict = await Aircraft.findOne({
          serialNumber: safeSerialNumber,
          _id: { $ne: existing._id },
        }).lean();

        if (serialConflict) {
          return res.status(409).json({
            error: "El número de serie ya está registrado en otra aeronave",
          });
        }

        const newTasks = sanitizeMaintenanceTasks(
          maintenanceTasks,
          session.user.id
        );
        const newConditions = sanitizeConditions(arrivalConditions);

        // Unique matrícula: move record here with manually provided data (no leak of prior private fields)
        existing.hangar = hangarId;
        existing.owner = session.user.id;
        existing.status = "En hangar";
        existing.intakeReportByName = safeIntakeName;
        existing.manufacturer = safeManufacturer;
        existing.model = safeModel;
        existing.serialNumber = safeSerialNumber;
        existing.aircraftType = aircraftType;
        existing.stayReason = safeStayReason;
        existing.entryDate = parsedEntryDate;
        existing.arrivalConditions = newConditions;
        existing.exitDate = undefined;
        existing.exitReportByName = "";
        existing.exitNote = "";
        existing.exitRegisteredBy = undefined;

        for (const task of newTasks) {
          existing.maintenanceTasks.push(task);
        }

        await existing.save();

        return res.status(200).json({
          aircraft: existing.toObject(),
          mode: "claim",
          message: "Aeronave ingresada correctamente",
        });
      }

      const safeRegistration = registration?.trim().toUpperCase().replace(/\s+/g, "");
      const safeManufacturer = manufacturer?.trim();
      const safeModel = model?.trim();
      const safeSerialNumber = serialNumber?.trim();

      if (
        !safeIntakeName ||
        !safeRegistration ||
        !safeManufacturer ||
        !safeModel ||
        !safeSerialNumber ||
        !aircraftType ||
        !safeStayReason ||
        !entryDate
      ) {
        return res.status(400).json({
          error: "Completa todos los campos obligatorios del ingreso",
        });
      }

      if (!AIRCRAFT_TYPES.includes(aircraftType)) {
        return res.status(400).json({
          error: "El tipo de aeronave no es válido",
        });
      }

      if (Number.isNaN(parsedEntryDate?.getTime())) {
        return res.status(400).json({
          error: "La fecha de ingreso no es válida",
        });
      }

      const existingRegistration = await Aircraft.findOne({
        registration: safeRegistration,
      }).lean();

      if (existingRegistration) {
        const userHangars = await Hangar.find({
          $or: [
            { owner: session.user.id },
            { "members.user": session.user.id },
          ],
        })
          .select("_id")
          .lean();

        const userHangarIdSet = new Set(
          userHangars.map((item) => item._id.toString())
        );
        const existingHangarId =
          existingRegistration.hangar?.toString?.() ||
          String(existingRegistration.hangar);

        if (!userHangarIdSet.has(existingHangarId)) {
          return res.status(409).json({
            error:
              "Esta matrícula ya existe en otro hangar. Usa la búsqueda para ingresarla manualmente.",
          });
        }

        return res.status(409).json({
          error:
            "Esta matrícula ya existe en tus hangares. Usa la búsqueda para reingresarla.",
        });
      }

      const existingSerial = await Aircraft.findOne({
        serialNumber: safeSerialNumber,
      }).lean();

      if (existingSerial) {
        return res.status(409).json({
          error: "El número de serie ya está registrado",
        });
      }

      const aircraft = await Aircraft.create({
        hangar: hangarId,
        owner: session.user.id,
        intakeReportByName: safeIntakeName,
        registration: safeRegistration,
        manufacturer: safeManufacturer,
        model: safeModel,
        serialNumber: safeSerialNumber,
        aircraftType,
        stayReason: safeStayReason,
        entryDate: parsedEntryDate,
        arrivalConditions: sanitizeConditions(arrivalConditions),
        maintenanceTasks: sanitizeMaintenanceTasks(
          maintenanceTasks,
          session.user.id
        ),
        status: "En hangar",
      });

      return res.status(201).json({
        aircraft,
        mode: "create",
      });
    }

    return res.status(405).json({
      error: "Método no permitido",
    });
  } catch (error) {
    console.error("ERROR EN AIRCRAFT LIST:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        error:
          field === "registration"
            ? "La matrícula ya está registrada"
            : "El número de serie ya está registrado",
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
}
