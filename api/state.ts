import { allowMethod, firestore, getHistory } from './_lib';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['GET'])) return;
  try {
    const [state, history] = await Promise.all([firestore().collection('appState').doc('default').get(), getHistory()]);
    res.status(200).json({ topology: state.data()?.topology || [], history, nextCaseId: `C${String(history.length + 1).padStart(4, '0')}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Could not load Firestore state.' });
  }
}
