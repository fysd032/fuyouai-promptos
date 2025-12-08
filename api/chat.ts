// api/chat.js

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body = req.body || {};
  const message = body.message || "";

  res.status(200).json({
    reply: `后端部署成功，你说：${message}`,
  });
}
