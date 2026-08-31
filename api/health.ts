export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  }
  res.status(200).json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()) });
}
