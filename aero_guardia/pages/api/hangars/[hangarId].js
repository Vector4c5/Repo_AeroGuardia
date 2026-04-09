import { readHangars, writeHangars } from "@/lib/hangarStore";

export default async function handler(req, res) {
  const { hangarId } = req.query;
  const hangars = await readHangars();
  const index = hangars.findIndex((hangar) => hangar.id === hangarId);

  if (index < 0) {
    return res.status(404).json({ error: "Hangar not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ hangar: hangars[index] });
  }

  if (req.method === "PUT") {
    const { hangar } = req.body || {};

    if (!hangar || typeof hangar !== "object") {
      return res.status(400).json({ error: "hangar is required" });
    }

    const nextHangars = [...hangars];
    nextHangars[index] = hangar;
    await writeHangars(nextHangars);

    return res.status(200).json({ hangar });
  }

  if (req.method === "DELETE") {
    const nextHangars = hangars.filter((hangar) => hangar.id !== hangarId);
    await writeHangars(nextHangars);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
