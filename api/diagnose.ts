import { allowMethod, diagnose } from './_lib';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['POST'])) return;
  const result = await diagnose(req.body || {});
  res.status(result.status).json(result.body);
}
