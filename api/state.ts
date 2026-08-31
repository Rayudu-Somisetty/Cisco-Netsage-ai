import { allowMethod } from './_lib';
import { firestore, getHistory } from './firebase';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['GET'])) return;
  try {
    const [state, history] = await Promise.all([firestore().collection('appState').doc('default').get(), getHistory()]);
    res.status(200).json({ topology: state.data()?.topology || [], history, nextCaseId: `C${String(history.length + 1).padStart(4, '0')}` });
  } catch (error) {
    console.error('Firestore state unavailable:', error);
    res.status(200).json({ topology: [], history: [], nextCaseId: 'C0001', persistenceAvailable: false });
  }
}
