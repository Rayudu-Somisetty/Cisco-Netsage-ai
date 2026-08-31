import { allowMethod } from '../_lib';
import { getHistory } from '../firebase';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['GET'])) return;
  try {
    const history = await getHistory(); const issueTypes: Record<string, number> = {}; const severity: Record<string, number> = {};
    const decisions = { Accepted: 0, Edited: 0, Rejected: 0 };
    history.forEach((item: any) => {
      const diagnosis = item.diagnosis || {}; const decision = item.humanReview?.decision;
      issueTypes[diagnosis.rootCause || 'Unknown'] = (issueTypes[diagnosis.rootCause || 'Unknown'] || 0) + 1;
      severity[diagnosis.confidenceLevel || 'UNKNOWN'] = (severity[diagnosis.confidenceLevel || 'UNKNOWN'] || 0) + 1;
      if (decision === 'Accept') decisions.Accepted++; else if (decision === 'Edit') decisions.Edited++; else if (decision === 'Reject') decisions.Rejected++;
    });
    res.status(200).json({ totalCases: history.length, issueTypes, severity, decisions, aiAgreementRate: history.length ? Math.round((decisions.Accepted / history.length) * 100) : 0 });
  } catch (error) {
    console.error('Firestore review statistics unavailable:', error);
    res.status(200).json({ totalCases: 0, issueTypes: {}, severity: {}, decisions: { Accepted: 0, Edited: 0, Rejected: 0 }, aiAgreementRate: 0, persistenceAvailable: false });
  }
}
