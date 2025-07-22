import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt." });
  }

  const body = req.body;

  // Wenn body als x-www-form-urlencoded gesendet wird, müssen wir das manuell parsen
  let quiz, user, answers;

  if (typeof body === "string") {
    const params = new URLSearchParams(body);
    quiz = params.get("quiz");
    user = params.get("user");
    answers = params.get("answers");
  } else {
    quiz = body.quiz;
    user = body.user;
    answers = body.answers;
  }

  if (!quiz || !user || !answers) {
    return res.status(400).json({ error: "Fehlende Felder." });
  }

  const filePath = path.join(process.cwd(), "./data", `${quiz}.json`);

  let existing = {};

  try {
    const content = await fs.readFile(filePath, "utf-8");
    existing = JSON.parse(content);
  } catch (err) {
    // Datei existiert noch nicht, dann fangen wir leer an
    existing = {};
  }

  try {
    const parsed = JSON.parse(answers);
    existing[user] = parsed;

    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Fehler beim Speichern." });
  }
}
