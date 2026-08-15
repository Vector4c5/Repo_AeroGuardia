import mongoose from "mongoose";

const AccessEventSchema = new mongoose.Schema(
  {
    hangar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hangar",
      required: true,
    },

    uid: {
      type: String,
      required: true,
      trim: true,
    },

    nombre: {
      type: String,
      default: "",
      trim: true,
    },

    estado: {
      type: String,
      enum: ["AUTORIZADO", "DENEGADO"],
      required: true,
    },

    tipo: {
      type: String,
      enum: ["ENTRADA", "SALIDA", "ERROR"],
      required: true,
    },

    hora: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.AccessEvent) {
  delete mongoose.models.AccessEvent;
}

export default mongoose.model("AccessEvent", AccessEventSchema);
