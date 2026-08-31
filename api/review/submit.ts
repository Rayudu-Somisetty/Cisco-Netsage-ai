import { allowMethod } from '../_lib';
import { firestore, getHistory } from '../firebase';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['POST'])) return;
  try {
    const caseId = typeof req.body?.caseId === 'string' && req.body.caseId !== 'NEW' ? req.body.caseId : `C${Date.now()}`;
    await firestore().collection('cases').doc(caseId).set({ ...req.body, timestamp: new Date().toISOString() }, { merge: true });
    res.status(200).json({ success: true, caseId, history: await getHistory() });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Could not save review.' });
  }
}
