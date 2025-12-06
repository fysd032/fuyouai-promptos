import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body ?? {};

  res.status(200).json({
    reply: `后端部署成功，你说：${message}`
  });
}
