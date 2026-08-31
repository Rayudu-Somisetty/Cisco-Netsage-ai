import { allowMethod } from './_lib';
export default function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['GET'])) return;
  res.status(200).json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()) });
}
