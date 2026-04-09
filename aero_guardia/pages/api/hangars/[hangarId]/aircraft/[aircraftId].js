import { readHangars, writeHangars } from "@/lib/hangarStore";

export default async function handler(req, res) {
  const { hangarId, aircraftId } = req.query;
  const hangars = await readHangars();
  const hangarIndex = hangars.findIndex((hangar) => hangar.id === hangarId);

  if (hangarIndex < 0) {
    return res.status(404).json({ error: "Hangar not found" });
  }

  const aircraftList = hangars[hangarIndex].aircraftList || [];
  const aircraftIndex = aircraftList.findIndex((aircraft) => aircraft.id === aircraftId);

  if (aircraftIndex < 0) {
    return res.status(404).json({ error: "Aircraft not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ aircraft: aircraftList[aircraftIndex] });
  }

  if (req.method === "PUT") {
    const { aircraft } = req.body || {};

    if (!aircraft || typeof aircraft !== "object") {
      return res.status(400).json({ error: "aircraft is required" });
    }

    const nextHangars = [...hangars];
    const nextAircraftList = [...aircraftList];
    nextAircraftList[aircraftIndex] = aircraft;

    nextHangars[hangarIndex] = {
      ...nextHangars[hangarIndex],
      aircraftList: nextAircraftList,
    };

    await writeHangars(nextHangars);
    return res.status(200).json({ aircraft });
  }

  if (req.method === "DELETE") {
    const nextHangars = [...hangars];
    nextHangars[hangarIndex] = {
      ...nextHangars[hangarIndex],
      aircraftList: aircraftList.filter((aircraft) => aircraft.id !== aircraftId),
    };

    await writeHangars(nextHangars);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
