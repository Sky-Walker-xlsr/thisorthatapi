import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  const quiz = req.query.quiz;
  if (!quiz) {
    return res.status(400).json({ error: "Kein Quiz angegeben." });
  }

  const filePath = path.join(process.cwd(), "./data", `${quiz}.json`);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return res.status(200).json(data);
  } catch (err) {
    // Datei existiert nicht oder ist leer
    return res.status(200).json({});
  }
}
