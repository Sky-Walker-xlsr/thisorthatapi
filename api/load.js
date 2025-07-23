export default async function handler(req, res) {
  const quiz = req.query.quiz;

  if (!quiz) {
    return res.status(400).json({ error: "Fehlender Quizname." });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

  const filePath = `data/${quiz}.json`;
  const apiURL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;

  try {
    const response = await fetch(apiURL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Datei nicht gefunden (${response.status})`);
    }

    const json = await response.json();
    const content = Buffer.from(json.content, "base64").toString("utf-8");
    const data = JSON.parse(content);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({}); // leere Antwort wenn Datei nicht existiert
  }
}
