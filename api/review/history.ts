import { allowMethod } from '../_lib';
import { getHistory } from '../firebase';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['GET'])) return;
  try { res.status(200).json({ success: true, history: await getHistory() }); }
  catch (error) { res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Could not load review history.' }); }
}
