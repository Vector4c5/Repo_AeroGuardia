import { readHangars, writeHangars } from "@/lib/hangarStore";

export default async function handler(req, res) {
  const { hangarId } = req.query;
  const hangars = await readHangars();
  const index = hangars.findIndex((hangar) => hangar.id === hangarId);

  if (index < 0) {
    return res.status(404).json({ error: "Hangar not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ aircraftList: hangars[index].aircraftList || [] });
  }

  if (req.method === "POST") {
    const { aircraft } = req.body || {};

    if (!aircraft || typeof aircraft !== "object") {
      return res.status(400).json({ error: "aircraft is required" });
    }

    const nextHangars = [...hangars];
    const current = nextHangars[index];
    nextHangars[index] = {
      ...current,
      aircraftList: [aircraft, ...(current.aircraftList || [])],
    };

    await writeHangars(nextHangars);
    return res.status(201).json({ aircraft });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
