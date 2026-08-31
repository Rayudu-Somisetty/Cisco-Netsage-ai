import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Prefer this project's .env entry over an empty inherited environment value.
dotenv.config({ override: true });
const EMBEDDED_GEMINI_API_KEY = process.env.GEMINI_EMBEDDED_API_KEY || 'PASTE_YOUR_GEMINI_API_KEY_HERE';
const app = express();
const PORT = 3000;
const dataDir = path.join(process.cwd(), 'data');
const topologyPath = path.join(dataDir, 'topology.json');
const reviewPath = path.join(process.cwd(), 'review_log.csv');
const checkerPath = path.join(process.cwd(), 'checker', 'rule_checker.py');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '10mb' }));

function readTopology(): any[] {
  try { return JSON.parse(fs.readFileSync(topologyPath, 'utf8')); } catch { return []; }
}
function writeTopology(topology: any[]) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(topologyPath, JSON.stringify(topology, null, 2));
}
function csvEscape(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}
function readReviews(): Record<string, string>[] {
  if (!fs.existsSync(reviewPath)) return [];
  const content = fs.readFileSync(reviewPath, 'utf8');
  const lines: string[] = [];
  let current = ''; let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i]; const nextChar = content[i + 1];
    if (char === '"') {
      if (nextChar === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === '\n' && !inQuotes) { lines.push(current.trim()); current = ''; }
    else current += char;
  }
  if (current.trim()) lines.push(current.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values: string[] = []; let value = ''; let quoted = false;
    for (const character of line) {
      if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) { values.push(value.replace(/^"|"$/g, '')); value = ''; }
      else value += character;
    }
    values.push(value.replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])) as Record<string, string>;
  });
}
function parseJson(value: string): any { try { return JSON.parse(value); } catch { return value; } }
function nextCaseId() { return `C${String(readReviews().length + 1).padStart(4, '0')}`; }
function toCase(row: Record<string, string>) {
  const diagnosis = parseJson(row.ai_diagnosis) || {};
  return {
    caseId: row.case_id, timestamp: row.timestamp, title: diagnosis.rootCause || 'Network diagnosis', status: row.human_decision === 'Reject' ? 'REJECTED' : 'RESOLVED',
    targetDevice: row.target_device || '', problemDescription: row.problem_description || '', commandType: row.command_type || '', commandOutput: row.command_output || '', diagnosis,
    humanReview: { decision: row.human_decision || null, comments: row.reason_for_change || '', reviewer: row.reviewer || '', verificationTest: row.verification_test || '', verificationOutput: row.verification_result || null, isTesting: false, submitted: true },
    nodeCount: Number(row.node_count || 0),
  };
}
let geminiClient: GoogleGenAI | null = null;
function resolveGeminiKey(suppliedKey?: string): string | null {
  const candidate = suppliedKey || process.env.GEMINI_API_KEY || EMBEDDED_GEMINI_API_KEY;
  if (!candidate || candidate === 'PASTE_YOUR_GEMINI_API_KEY_HERE') return null;
  return candidate.trim();
}
function getGeminiClient(suppliedKey?: string): GoogleGenAI | null {
  const apiKey = resolveGeminiKey(suppliedKey);
  if (!apiKey) return null;
  if (!geminiClient || geminiClient !== null && process.env.GEMINI_API_KEY !== apiKey) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}
async function runRuleChecker(payload: Record<string, unknown>): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const checker = spawn('python', [checkerPath]); let stdout = ''; let stderr = '';
      checker.stdout.on('data', (chunk) => { stdout += chunk; }); checker.stderr.on('data', (chunk) => { stderr += chunk; });
      checker.on('error', (error) => { console.error('Python checker spawn failed:', error.message); reject(new Error(`Rule checker unavailable: ${error.message}`)); });
      checker.on('close', (code) => {
        if (code === 0) { try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error(`Invalid checker output: ${e}`)); } }
        else reject(new Error(`Rule checker failed: ${stderr || `exit code ${code}`}`));
      });
      checker.stdin.end(JSON.stringify(payload));
    } catch (error) { reject(new Error(`Failed to start rule checker: ${error}`)); }
  });
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', hasGeminiKey: Boolean(resolveGeminiKey()) }));
app.get('/api/state', (_req, res) => res.json({ topology: readTopology(), history: readReviews().map(toCase), nextCaseId: nextCaseId() }));
app.put('/api/topology', (req, res) => { const topology = Array.isArray(req.body?.topology) ? req.body.topology : []; writeTopology(topology); res.json({ success: true, topology }); });

app.post('/api/diagnose', async (req, res) => {
  const payload = req.body || {};
  let ruleChecks: any[] = [];
  try { ruleChecks = await runRuleChecker(payload); } catch (error) { console.error('Rule checker error:', error); }

  const suppliedKey = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : '';
  const activeKey = resolveGeminiKey(suppliedKey);
  if (suppliedKey) process.env.GEMINI_API_KEY = suppliedKey;

  const geminiClient = activeKey ? new GoogleGenAI({ apiKey: activeKey }) : null;
  if (!geminiClient) {
    const fallback = { rootCause: 'Diagnosis requires Gemini API key configuration', confidence: 0, confidenceLevel: 'LOW', osiLayer: 'Unknown', evidence: [`Set GEMINI_API_KEY environment variable, embed a fallback key in the code, or enter a Gemini API key in the prompt to enable AI diagnosis.`], nextCommand: '', suggestedFix: 'Configure your Gemini API key', explanation: 'The AI diagnosis engine requires a valid Gemini API key. Please add one in the prompt, set GEMINI_API_KEY, or update the embedded fallback key in the server code.', ruleChecks };
    return res.json({ success: false, data: fallback, source: 'fallback-rule-engine', error: 'Gemini API key not configured. Please add a valid key.' });
  }

  try {
    const prompt = `You are a network reliability engineer. Diagnose only from supplied evidence and return strict JSON.\nProblem: ${payload.problemDescription || '(not provided)'}\nCommand: ${payload.commandType || '(not provided)'}\nOutput:\n${payload.commandOutput || '(not provided)'}\nTopology:\n${JSON.stringify(payload.topology || [])}\nSelected node:\n${JSON.stringify(payload.selectedNode || {})}\nPython rule checks:\n${JSON.stringify(ruleChecks)}\nReturn rootCause, confidence, confidenceLevel, osiLayer, evidence, nextCommand, suggestedFix, explanation, and ruleChecks.`;
    const response = await geminiClient.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: {
      responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: {
        rootCause: { type: Type.STRING }, confidence: { type: Type.INTEGER }, confidenceLevel: { type: Type.STRING }, osiLayer: { type: Type.STRING }, evidence: { type: Type.ARRAY, items: { type: Type.STRING } }, nextCommand: { type: Type.STRING }, suggestedFix: { type: Type.STRING }, explanation: { type: Type.STRING }, ruleChecks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, status: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ['id', 'label', 'status', 'detail'] } },
      }, required: ['rootCause', 'confidence', 'confidenceLevel', 'osiLayer', 'evidence', 'nextCommand', 'suggestedFix', 'ruleChecks'] },
    }});
    const diagnosis = JSON.parse(response.text || '{}'); diagnosis.ruleChecks = ruleChecks;
    res.json({ success: true, data: diagnosis, source: 'gemini-3.6-flash' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isKeyFailure = /(401|403|429|quota|rate limit|invalid api key|api key|expired|forbidden)/i.test(message);
    console.error('Gemini diagnosis failed:', message);
    res.status(isKeyFailure ? 401 : 503).json({
      success: false,
      source: 'gemini-3.6-flash',
      error: isKeyFailure ? 'Your Gemini API key is invalid, expired, or rate-limited. Please enter a new key.' : `Diagnosis unavailable: ${message}`,
    });
  }
});

app.post('/api/test-connectivity', async (req, res) => {
  const { sourceNodeId, targetNodeId, testType } = req.body || {};
  const topology = readTopology(); const source = topology.find((node) => node.id === sourceNodeId); const target = topology.find((node) => node.id === targetNodeId);
  if (!source || !target) return res.status(400).json({ success: false, output: 'A source and target node are required.' });
  const pathNodes: any[] = []; let current = target;
  while (current) { pathNodes.unshift(current); if (current.id === source.id) break; current = topology.find((node) => node.id === current.parentId); }
  if (pathNodes[0]?.id !== source.id) return res.json({ success: false, output: `No parent path exists from ${source.name} to ${target.name}.`, failedHop: target.name });
  const checks = await runRuleChecker({ topology, sourceNodeId, targetNodeId, commandOutput: '' });
  const downNode = pathNodes.find((node) => (node.interfaces || []).some((intf: any) => intf.status === 'DOWN'));
  const pathNames = new Set(pathNodes.map((node) => node.name));
  const pathFailure = checks.find((check: any) => check.status === 'fail' && (check.id === 'wrong_subnet' || check.id === 'missing_vlan' || check.id === 'missing_route' || (check.id === 'dup_ip' && [...pathNames].some((name) => check.detail.includes(name))) || (check.id === 'gw_mismatch' && [...pathNames].some((name) => check.detail.includes(name)))));
  const failure = downNode ? `Interface DOWN on ${downNode.name}` : pathFailure?.detail;
  const hops = pathNodes.map((node, index) => ({ hop: index + 1, ip: node.ip, name: node.name }));
  const output = testType === 'Traceroute' ? `Tracing path from ${source.name} to ${target.name}\n${hops.map((hop) => `${hop.hop} ${hop.ip} ${hop.name}`).join('\n')}${failure ? `\nTrace stopped: ${failure}` : '\nTrace complete.'}` : failure ? `Ping ${target.ip} from ${source.name}\n.....\nFailed at ${failure}` : `Ping ${target.ip} from ${source.name}\n!!!!!\nSuccess rate is 100 percent (5/5)`;
  res.json({ success: !failure, output, failedHop: failure || null, hops });
});

app.post('/api/review/submit', (req, res) => {
  const body = req.body || {}; const headers = ['case_id', 'timestamp', 'ai_diagnosis', 'checker_findings', 'human_decision', 'final_diagnosis', 'reason_for_change', 'reviewer', 'verification_result', 'target_device', 'problem_description', 'command_type', 'command_output', 'verification_test', 'node_count'];
  if (!fs.existsSync(reviewPath)) fs.writeFileSync(reviewPath, `${headers.join(',')}\n`);
  const caseId = nextCaseId(); const row = [caseId, new Date().toISOString(), body.aiDiagnosis, body.checkerFindings, body.humanDecision, body.finalDiagnosis, body.reasonForChange, body.reviewer, body.verificationResult, body.targetDevice, body.problemDescription, body.commandType, body.commandOutput, body.verificationTest, body.nodeCount].map(csvEscape).join(',');
  fs.appendFileSync(reviewPath, `${row}\n`); res.json({ success: true, caseId, history: readReviews().map(toCase) });
});
app.get('/api/review/history', (_req, res) => res.json({ success: true, history: readReviews().map(toCase) }));
app.get('/api/review/stats', (_req, res) => {
  const rows = readReviews(); const diagnoses = rows.map((row) => parseJson(row.ai_diagnosis)); const count = (value: string) => rows.filter((row) => row.human_decision === value).length; const issueTypes: Record<string, number> = {}; const severity: Record<string, number> = {};
  diagnoses.forEach((diagnosis) => { const issue = diagnosis?.rootCause || 'Unknown'; issueTypes[issue] = (issueTypes[issue] || 0) + 1; const level = diagnosis?.confidenceLevel || 'UNKNOWN'; severity[level] = (severity[level] || 0) + 1; });
  res.json({ totalCases: rows.length, issueTypes, severity, decisions: { Accepted: count('Accept'), Edited: count('Edit'), Rejected: count('Reject') }, aiAgreementRate: rows.length ? Math.round((count('Accept') / rows.length) * 100) : 0 });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { app.use(express.static(path.join(process.cwd(), 'dist'))); app.get('*', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))); }
  app.listen(PORT, '0.0.0.0', () => console.log(`NetSage AI Server running on http://0.0.0.0:${PORT}`));
}
startServer();
