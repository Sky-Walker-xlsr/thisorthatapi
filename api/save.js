export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt." });
  }

  const { quiz, user, answers } = req.body;

  if (!quiz || !user || !answers) {
    return res.status(400).json({ error: "Fehlende Felder." });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

  const filePath = `data/${quiz}.json`;
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  let existingData = {};
  let sha = null;

  // 1. Bestehende Datei holen
  try {
    const response = await fetch(`${apiBase}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (response.ok) {
      const json = await response.json();
      const content = Buffer.from(json.content, 'base64').toString();
      existingData = JSON.parse(content);
      sha = json.sha;
    }
  } catch (err) {
    console.log("Datei existiert noch nicht oder konnte nicht gelesen werden.");
  }

  // 2. Neue Daten hinzufügen
  if (existingData[user]) {
    return res.status(409).json({ error: "Antwort wurde bereits gespeichert." });
  }
  
  existingData[user] = answers;

  const updatedContent = Buffer.from(
    JSON.stringify(existingData, null, 2)
  ).toString("base64");

  // 3. Speichern auf GitHub
  const saveResponse = await fetch(apiBase, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: `Update ${quiz}.json for user ${user}`,
      content: updatedContent,
      sha: sha || undefined,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!saveResponse.ok) {
    const error = await saveResponse.json();
    return res.status(500).json({ error: "Fehler beim Speichern auf GitHub", details: error });
  }

  return res.status(200).json({ success: true });
}
