import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Hangar from "@/models/hangars";
import Aircraft from "@/models/aircraft";
import { getPendingTaskType } from "@/lib/pendingTaskTypes";

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

    const { hangarId, aircraftId } = req.query;

    if (!hangarId || !aircraftId) {
      return res.status(400).json({
        error: "Faltan ids de hangar o aeronave",
      });
    }

    const hangar = await getHangarWithAccess(hangarId, session.user.id);

    if (!hangar) {
      return res.status(404).json({
        error: "Hangar no encontrado o sin acceso",
      });
    }

    if (req.method === "GET") {
      const aircraft = await Aircraft.findOne({
        _id: aircraftId,
        hangar: hangarId,
      }).lean();

      if (!aircraft) {
        return res.status(404).json({
          error: "Aeronave no encontrada",
        });
      }

      return res.status(200).json({
        aircraft,
        hangar: {
          _id: hangar._id,
          name: hangar.name,
        },
      });
    }

    if (req.method === "POST") {
      const { title, notes } = req.body;
      const reportTitle = title?.trim();
      const reportNotes = notes?.trim() || "";

      if (!reportTitle) {
        return res.status(400).json({
          error: "El título del reporte es obligatorio",
        });
      }

      const updatedAircraft = await Aircraft.findOneAndUpdate(
        {
          _id: aircraftId,
          hangar: hangarId,
          owner: session.user.id,
        },
        {
          $push: {
            reports: {
              title: reportTitle,
              notes: reportNotes,
              createdBy: session.user.id,
            },
          },
        },
        { new: true }
      ).lean();

      if (!updatedAircraft) {
        return res.status(404).json({
          error: "Aeronave no encontrada",
        });
      }

      return res.status(200).json({
        aircraft: updatedAircraft,
        hangar: {
          _id: hangar._id,
          name: hangar.name,
        },
      });
    }

    if (req.method === "PATCH") {
      const {
        action = "complete_task",
        taskId,
        completedByName,
        completionNote,
        exitReportByName,
        exitNote,
        title,
        description,
      } = req.body;

      const aircraft = await Aircraft.findOne({
        _id: aircraftId,
        hangar: hangarId,
      });

      if (!aircraft) {
        return res.status(404).json({
          error: "Aeronave no encontrada",
        });
      }

      if (aircraft.status === "Salida") {
        const allowedWhileDeparted = new Set(["register_exit"]);

        if (!allowedWhileDeparted.has(action)) {
          return res.status(400).json({
            error:
              "No se pueden agregar pendientes ni observaciones a una aeronave que ya salió",
          });
        }
      }

      if (action === "add_pending_task") {
        const safeTitle = title?.trim();
        const safeDescription = description?.trim() || "";
        const taskType = getPendingTaskType(req.body);

        if (!safeTitle) {
          return res.status(400).json({
            error: "El título del pendiente es obligatorio",
          });
        }

        const updatedAircraft = await Aircraft.findByIdAndUpdate(
          aircraftId,
          {
            $push: {
              maintenanceTasks: {
                title: safeTitle,
                description: safeDescription,
                taskType,
                status: "pending",
                createdBy: session.user.id,
              },
            },
          },
          { new: true }
        ).lean();

        return res.status(200).json({
          aircraft: updatedAircraft,
          hangar: {
            _id: hangar._id,
            name: hangar.name,
          },
        });
      }

      if (action === "add_stay_observation") {
        const safeTitle = title?.trim();
        const safeDescription = description?.trim() || "";

        if (!safeTitle) {
          return res.status(400).json({
            error: "El título de la observación es obligatorio",
          });
        }

        const updatedAircraft = await Aircraft.findByIdAndUpdate(
          aircraftId,
          {
            $push: {
              stayObservations: {
                title: safeTitle,
                description: safeDescription,
              },
            },
          },
          { new: true }
        ).lean();

        return res.status(200).json({
          aircraft: updatedAircraft,
          hangar: {
            _id: hangar._id,
            name: hangar.name,
          },
        });
      }

      if (action === "register_exit") {
        const safeExitReportByName = exitReportByName?.trim();
        const safeExitNote = exitNote?.trim();

        if (!safeExitReportByName) {
          return res.status(400).json({
            error: "El nombre de quien registra la salida es obligatorio",
          });
        }

        if (!safeExitNote) {
          return res.status(400).json({
            error: "Agrega una breve descripción de la salida de la aeronave",
          });
        }

        if (aircraft.status === "Salida") {
          return res.status(400).json({
            error: "Esta aeronave ya fue registrada como salida",
          });
        }

        const openPendingTasks = (aircraft.maintenanceTasks || []).filter(
          (task) => task.status === "pending"
        );

        if (openPendingTasks.length > 0) {
          return res.status(400).json({
            error: `No se puede registrar la salida: hay ${openPendingTasks.length} pendiente${openPendingTasks.length === 1 ? "" : "s"} sin completar.`,
          });
        }

        const updatedAircraft = await Aircraft.findByIdAndUpdate(
          aircraftId,
          {
            $set: {
              status: "Salida",
              exitDate: new Date(),
              exitReportByName: safeExitReportByName,
              exitNote: safeExitNote,
              exitRegisteredBy: session.user.id,
            },
          },
          { new: true }
        ).lean();

        return res.status(200).json({
          aircraft: updatedAircraft,
          hangar: {
            _id: hangar._id,
            name: hangar.name,
          },
        });
      }

      if (action !== "complete_task") {
        return res.status(400).json({
          error: "Acción no válida",
        });
      }

      const safeCompletedByName = completedByName?.trim();
      const safeCompletionNote = completionNote?.trim();

      if (!taskId) {
        return res.status(400).json({
          error: "Faltan datos del pendiente a completar",
        });
      }

      if (!safeCompletedByName) {
        return res.status(400).json({
          error: "El nombre de quien completa el trabajo es obligatorio",
        });
      }

      if (!safeCompletionNote) {
        return res.status(400).json({
          error: "Agrega una breve descripción del trabajo realizado",
        });
      }

      const task = aircraft.maintenanceTasks.id(taskId);

      if (!task) {
        return res.status(404).json({
          error: "Pendiente no encontrado",
        });
      }

      if (task.status === "completed") {
        return res.status(400).json({
          error: "Este pendiente ya fue marcado como terminado",
        });
      }

      const updatedAircraft = await Aircraft.findOneAndUpdate(
        {
          _id: aircraftId,
          "maintenanceTasks._id": taskId,
        },
        {
          $set: {
            "maintenanceTasks.$.status": "completed",
            "maintenanceTasks.$.completedBy": session.user.id,
            "maintenanceTasks.$.completedByName": safeCompletedByName,
            "maintenanceTasks.$.completionNote": safeCompletionNote,
            "maintenanceTasks.$.completedAt": new Date(),
          },
        },
        { new: true }
      ).lean();

      return res.status(200).json({
        aircraft: updatedAircraft,
        hangar: {
          _id: hangar._id,
          name: hangar.name,
        },
      });
    }

    if (req.method === "DELETE") {
      const deleted = await Aircraft.findOneAndDelete({
        _id: aircraftId,
        hangar: hangarId,
      });

      if (!deleted) {
        return res.status(404).json({
          error: "Aeronave no encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Aeronave eliminada",
      });
    }

    return res.status(405).json({
      error: "Método no permitido",
    });
  } catch (error) {
    console.error("ERROR EN AIRCRAFT DETAIL:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
}
