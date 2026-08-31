import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function firebaseCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) throw new Error('Firebase credentials are not configured.');

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(rawCredentials);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }

  return {
    projectId: parsed.project_id || parsed.projectId,
    clientEmail: parsed.client_email || parsed.clientEmail,
    privateKey: (parsed.private_key || parsed.privateKey || '').replace(/\\n/g, '\n'),
  };
}

export function firestore() {
  const credentials = firebaseCredentials();
  if (!credentials.projectId || !credentials.clientEmail || !credentials.privateKey) {
    throw new Error('Firebase credentials are incomplete.');
  }
  const app = getApps()[0] || initializeApp({ credential: cert(credentials), projectId: credentials.projectId });
  return getFirestore(app);
}

export function toCase(id: string, value: any) {
  const diagnosis = value.aiDiagnosis || {};
  const decision = value.humanDecision || null;
  return {
    caseId: id, timestamp: value.timestamp || new Date().toISOString(), title: diagnosis.rootCause || 'Network diagnosis',
    status: !decision ? 'OPEN' : decision === 'Reject' ? 'REJECTED' : 'RESOLVED', targetDevice: value.targetDevice || '', problemDescription: value.problemDescription || '', commandType: value.commandType || '', commandOutput: value.commandOutput || '', diagnosis,
    humanReview: { decision, comments: value.reasonForChange || '', reviewer: value.reviewer || '', verificationTest: value.verificationTest || '', verificationOutput: value.verificationResult || null, isTesting: false, submitted: Boolean(decision) }, nodeCount: Number(value.nodeCount || 0),
  };
}

export async function getHistory() {
  const snapshot = await firestore().collection('cases').orderBy('timestamp', 'desc').limit(100).get();
  return snapshot.docs.map((document) => toCase(document.id, document.data()));
}
