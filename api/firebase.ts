import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function firestore() {
  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) throw new Error('Firebase service-account credentials are not configured.');
  let credentials: Record<string, string>;
  try { credentials = JSON.parse(rawCredentials); } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.'); }
  const app = getApps()[0] || initializeApp({ credential: cert(credentials) });
  return getFirestore(app);
}

export function toCase(id: string, value: any) {
  const diagnosis = value.aiDiagnosis || {};
  return {
    caseId: id, timestamp: value.timestamp || new Date().toISOString(), title: diagnosis.rootCause || 'Network diagnosis',
    status: value.humanDecision === 'Reject' ? 'REJECTED' : 'RESOLVED', targetDevice: value.targetDevice || '', problemDescription: value.problemDescription || '', commandType: value.commandType || '', commandOutput: value.commandOutput || '', diagnosis,
    humanReview: { decision: value.humanDecision || null, comments: value.reasonForChange || '', reviewer: value.reviewer || '', verificationTest: value.verificationTest || '', verificationOutput: value.verificationResult || null, isTesting: false, submitted: true }, nodeCount: Number(value.nodeCount || 0),
  };
}

export async function getHistory() {
  const snapshot = await firestore().collection('cases').orderBy('timestamp', 'desc').limit(100).get();
  return snapshot.docs.map((document) => toCase(document.id, document.data()));
}
