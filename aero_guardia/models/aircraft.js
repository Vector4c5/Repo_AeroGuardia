import mongoose from "mongoose";

const ConditionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const MaintenanceTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    taskType: {
      type: String,
      enum: [
        "Documentación",
        "Mantenimiento",
        "Inspección",
        "Pruebas",
        "Operaciones",
        "Otro",
      ],
      default: "Otro",
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    completedByName: {
      type: String,
      default: "",
      trim: true,
    },

    completionNote: {
      type: String,
      default: "",
      trim: true,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const AircraftReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AircraftSchema = new mongoose.Schema(
  {
    intakeReportByName: {
      type: String,
      required: true,
      trim: true,
    },

    registration: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },

    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    aircraftType: {
      type: String,
      enum: ["Ala fija", "Ala rotativa", "Vehículo no tripulado", "Otro"],
      required: true,
    },

    stayReason: {
      type: String,
      required: true,
      trim: true,
    },

    entryDate: {
      type: Date,
      required: true,
    },

    arrivalConditions: {
      type: [ConditionSchema],
      default: [],
    },

    stayObservations: {
      type: [ConditionSchema],
      default: [],
    },

    maintenanceTasks: {
      type: [MaintenanceTaskSchema],
      default: [],
    },

    hangar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hangar",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    model: {
      type: String,
      required: false,
      default: "",
    },

    status: {
      type: String,
      enum: ["En hangar", "Salida"],
      default: "En hangar",
    },

    exitDate: {
      type: Date,
    },

    exitReportByName: {
      type: String,
      default: "",
      trim: true,
    },

    exitNote: {
      type: String,
      default: "",
      trim: true,
    },

    exitRegisteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reports: [AircraftReportSchema],
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Aircraft) {
  delete mongoose.models.Aircraft;
}

export default mongoose.model("Aircraft", AircraftSchema);
