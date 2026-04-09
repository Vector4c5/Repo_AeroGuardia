import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "hangars.json");

const DEFAULT_HANGARS = [
  {
    id: "hangar-1",
    label: "Hangar Principal",
    location: "Terminal Norte",
    description: "Zona principal para aeronaves de linea.",
    hangarType: "mantenimiento",
    zoneTitle: "Hangar de mantenimiento",
    image: "/Hangar_Mantenimiento.jpg",
    aircraftList: [
      { id: "AG-101", model: "Boeing 737-800", status: "Listo" },
      { id: "AG-224", model: "Airbus A320", status: "En revision" },
      { id: "AG-315", model: "Cessna 208", status: "En mantenimiento" },
      { id: "AG-402", model: "Embraer 190", status: "Listo" },
    ],
  },
];

async function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_HANGARS, null, 2), "utf8");
  }
}

export async function readHangars() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_HANGARS;
  } catch {
    return DEFAULT_HANGARS;
  }
}

export async function writeHangars(hangars) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(hangars, null, 2), "utf8");
}
