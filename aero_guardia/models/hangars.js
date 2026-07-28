import mongoose from "mongoose";

const HangarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      default: "",
    },

    baseAirport: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    classification: {
      type: String,
      enum: [
        "Mantenimiento",
        "Aviación General",
        "Aviación Ejecutiva",
        "Comercial",
        "Militar/Gubernamental",
        "Multipropósito",
      ],
      default: "Multipropósito",
    },

    hangarType: {
      type: String,
      enum: ["mantenimiento", "escuela", "almacenamiento"],
      default: "mantenimiento",
    },

    zoneTitle: {
      type: String,
      default: "Hangar de mantenimiento",
    },

    image: {
      type: String,
      default: "/Hangar_Mantenimiento.jpg",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },

    inviteCodeExpiresAt: {
      type: Date,
      default: null,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        role: {
          type: String,
          enum: ["admin", "engineer", "technician"],
          default: "technician",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Hangar) {
  delete mongoose.models.Hangar;
}

export default mongoose.model("Hangar", HangarSchema);
