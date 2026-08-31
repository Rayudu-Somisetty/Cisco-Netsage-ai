import { allowMethod, firestore } from './_lib';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['PUT'])) return;
  const topology = Array.isArray(req.body?.topology) ? req.body.topology : [];
  try {
    await firestore().collection('appState').doc('default').set({ topology, updatedAt: new Date().toISOString() }, { merge: true });
    res.status(200).json({ success: true, topology });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Could not save topology.' });
  }
}
