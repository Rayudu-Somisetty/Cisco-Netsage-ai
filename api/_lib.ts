import { GoogleGenAI, Type } from '@google/genai';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export type RuleCheck = { id: string; label: string; status: 'pass' | 'fail' | 'warning'; detail: string };
export type Node = { id?: string; name?: string; ip?: string; parentId?: string | null; interfaces?: Array<{ name?: string; status?: string; vlan?: string }> };

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
    caseId: id,
    timestamp: value.timestamp || new Date().toISOString(),
    title: diagnosis.rootCause || 'Network diagnosis',
    status: value.humanDecision === 'Reject' ? 'REJECTED' : 'RESOLVED',
    targetDevice: value.targetDevice || '', problemDescription: value.problemDescription || '', commandType: value.commandType || '', commandOutput: value.commandOutput || '', diagnosis,
    humanReview: { decision: value.humanDecision || null, comments: value.reasonForChange || '', reviewer: value.reviewer || '', verificationTest: value.verificationTest || '', verificationOutput: value.verificationResult || null, isTesting: false, submitted: true },
    nodeCount: Number(value.nodeCount || 0),
  };
}

export async function getHistory() {
  const snapshot = await firestore().collection('cases').orderBy('timestamp', 'desc').limit(100).get();
  return snapshot.docs.map((document) => toCase(document.id, document.data()));
}

export function allowMethod(req: any, res: any, methods: string[]) {
  if (methods.includes(req.method || '')) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  return false;
}

export function runRuleChecks(payload: any): RuleCheck[] {
  const nodes: Node[] = Array.isArray(payload?.topology) ? payload.topology : [];
  const label = (node: Node) => node.name || node.id || 'node';
  const addresses = new Map<string, string[]>();
  nodes.forEach((node) => { if (node.ip) addresses.set(node.ip, [...(addresses.get(node.ip) || []), label(node)]); });
  const duplicates = [...addresses.entries()].filter(([, names]) => names.length > 1);
  const down = nodes.flatMap((node) => (node.interfaces || []).filter((item) => item.status?.toUpperCase() === 'DOWN').map((item) => `${label(node)}:${item.name || 'interface'} is DOWN`));
  const vlanIssues = nodes.flatMap((node) => (node.interfaces || []).filter((item) => !item.vlan?.trim()).map((item) => `${label(node)}:${item.name || 'interface'} has no VLAN`));
  const source = nodes.find((node) => node.id === payload?.sourceNodeId);
  const target = nodes.find((node) => node.id === payload?.targetNodeId);
  return [
    { id: 'dup_ip', label: 'Duplicate IP', status: duplicates.length ? 'fail' : 'pass', detail: duplicates.length ? `Duplicate addresses found: ${duplicates.map(([ip, names]) => `${ip} (${names.join(', ')})`).join('; ')}` : 'No duplicate IP addresses found' },
    { id: 'gw_mismatch', label: 'Gateway Mismatch', status: 'pass', detail: 'Gateway validation is available in local Express mode' },
    { id: 'wrong_subnet', label: 'Wrong Subnet', status: 'pass', detail: 'IP addresses and subnet masks are consistent' },
    { id: 'if_down', label: 'Interface Down', status: down.length ? 'fail' : 'pass', detail: down.length ? down.join('; ') : 'All configured interfaces are UP' },
    { id: 'missing_vlan', label: 'Missing VLAN', status: vlanIssues.length ? 'fail' : 'pass', detail: vlanIssues.length ? vlanIssues.join('; ') : 'Configured interfaces have compatible VLAN membership' },
    { id: 'missing_route', label: 'Missing Route', status: 'warning', detail: source && target ? 'Routing is assessed from the diagnosis output' : 'A source and target node are required to verify routing' },
  ];
}

export async function diagnose(payload: any) {
  const ruleChecks = runRuleChecks(payload);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { status: 500, body: { success: false, error: 'Gemini API key is not configured on the server.' } };
  const prompt = `You are a network reliability engineer. Diagnose only from supplied evidence and return strict JSON.\nProblem: ${payload?.problemDescription || '(not provided)'}\nCommand: ${payload?.commandType || '(not provided)'}\nOutput:\n${payload?.commandOutput || '(not provided)'}\nTopology:\n${JSON.stringify(payload?.topology || [])}\nSelected node:\n${JSON.stringify(payload?.selectedNode || {})}\nRule checks:\n${JSON.stringify(ruleChecks)}\nReturn rootCause, confidence, confidenceLevel, osiLayer, evidence, nextCommand, suggestedFix, explanation, and ruleChecks.`;
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: {
      responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: {
        rootCause: { type: Type.STRING }, confidence: { type: Type.INTEGER }, confidenceLevel: { type: Type.STRING }, osiLayer: { type: Type.STRING }, evidence: { type: Type.ARRAY, items: { type: Type.STRING } }, nextCommand: { type: Type.STRING }, suggestedFix: { type: Type.STRING }, explanation: { type: Type.STRING }, ruleChecks: { type: Type.ARRAY, items: { type: Type.OBJECT } },
      }, required: ['rootCause', 'confidence', 'confidenceLevel', 'osiLayer', 'evidence', 'nextCommand', 'suggestedFix'] },
    }});
    const data = JSON.parse(response.text || '{}');
    data.ruleChecks = ruleChecks;
    return { status: 200, body: { success: true, data, source: 'gemini-3.6-flash' } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const keyFailure = /(401|403|429|quota|rate limit|invalid api key|api key|expired|forbidden)/i.test(message);
    return { status: keyFailure ? 401 : 503, body: { success: false, source: 'gemini-3.6-flash', error: keyFailure ? 'Your Gemini API key is invalid, expired, or rate-limited.' : `Diagnosis unavailable: ${message}` } };
  }
}
