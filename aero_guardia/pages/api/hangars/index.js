import { readHangars, writeHangars } from "@/lib/hangarStore";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const hangars = await readHangars();
    return res.status(200).json({ hangars });
  }

  if (req.method === "PUT") {
    const { hangars } = req.body || {};

    if (!Array.isArray(hangars)) {
      return res.status(400).json({ error: "hangars must be an array" });
    }

    await writeHangars(hangars);
    return res.status(200).json({ hangars });
  }

  if (req.method === "POST") {
    const { hangar } = req.body || {};

    if (!hangar || typeof hangar !== "object") {
      return res.status(400).json({ error: "hangar is required" });
    }

    const hangars = await readHangars();
    const nextHangars = [hangar, ...hangars];
    await writeHangars(nextHangars);

    return res.status(201).json({ hangar });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
