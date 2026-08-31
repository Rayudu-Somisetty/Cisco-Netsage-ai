import { GoogleGenAI, Type } from '@google/genai';

export type RuleCheck = { id: string; label: string; status: 'pass' | 'fail' | 'warning'; detail: string };
export type Node = {
  id?: string;
  name?: string;
  ip?: string;
  subnet?: string;
  gateway?: string;
  parentId?: string | null;
  interfaces?: Array<{ name?: string; status?: string; vlan?: string }>;
};

export function allowMethod(req: any, res: any, methods: string[]) {
  if (methods.includes(req.method || '')) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  return false;
}

// --- IPv4 helpers -----------------------------------------------------
// Vercel functions cannot spawn the Python checker (checker/rule_checker.py),
// so this is a faithful TypeScript port of its deterministic logic. Keep the
// two in sync if the check rules change.

function ipToLong(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    value = (value << 8) + n;
  }
  return value >>> 0;
}

// Accepts either a CIDR prefix length ("24") or a dotted-decimal mask
// ("255.255.255.0"), same as the Python checker's ipaddress-based parsing.
function subnetToPrefixLength(subnet: string): number | null {
  const trimmed = subnet.trim();
  if (!trimmed) return null;
  if (/^\d{1,2}$/.test(trimmed)) {
    const n = Number(trimmed);
    return n >= 0 && n <= 32 ? n : null;
  }
  const maskLong = ipToLong(trimmed);
  if (maskLong === null) return null;
  let prefix = 0;
  while (prefix < 32 && (maskLong & (1 << (31 - prefix))) !== 0) prefix++;
  const expected = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return expected === maskLong ? prefix : null;
}

function networkRange(ipLong: number, prefix: number): { network: number; broadcast: number } {
  const maskBits = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ipLong & maskBits) >>> 0;
  const broadcast = (network | (~maskBits >>> 0)) >>> 0;
  return { network, broadcast };
}

function rangesOverlap(a: { network: number; broadcast: number }, b: { network: number; broadcast: number }) {
  return Math.max(a.network, b.network) <= Math.min(a.broadcast, b.broadcast);
}

export function runRuleChecks(payload: any): RuleCheck[] {
  const nodes: Node[] = Array.isArray(payload?.topology) ? payload.topology : [];
  const label = (node: Node) => node.name || node.id || 'node';

  // 1. Duplicate IP
  const addresses = new Map<string, string[]>();
  nodes.forEach((node) => { if (node.ip) addresses.set(node.ip, [...(addresses.get(node.ip) || []), label(node)]); });
  const duplicates = [...addresses.entries()].filter(([, names]) => names.length > 1);

  // 2. Gateway mismatch - gateway must fall inside the node's own subnet
  const gatewayFailures: string[] = [];
  nodes.forEach((node) => {
    const gateway = node.gateway?.trim();
    if (!gateway) return;
    const gatewayLong = ipToLong(gateway);
    const nodeIpLong = node.ip ? ipToLong(node.ip) : null;
    const prefix = node.subnet ? subnetToPrefixLength(node.subnet) : null;
    if (gatewayLong === null || nodeIpLong === null || prefix === null) {
      gatewayFailures.push(`${label(node)}: gateway ${gateway} could not be validated (missing/invalid IP or subnet)`);
      return;
    }
    const { network, broadcast } = networkRange(nodeIpLong, prefix);
    if (gatewayLong < network || gatewayLong > broadcast) {
      gatewayFailures.push(`${label(node)}: gateway ${gateway} is outside its subnet`);
    }
  });

  // 3. Wrong subnet - invalid masks, plus overlapping parent/child subnets
  //    with mismatched prefix lengths
  const subnetFailures: string[] = [];
  const parsedNetworks = new Map<string, { prefix: number; range: { network: number; broadcast: number } }>();
  nodes.forEach((node) => {
    if (!node.ip) return; // unconfigured nodes aren't evaluated
    const ipLong = ipToLong(node.ip);
    if (ipLong === null) { subnetFailures.push(`${label(node)}: invalid IP address ${node.ip}`); return; }
    if (!node.subnet) return; // no mask entered yet; nothing to validate
    const prefix = subnetToPrefixLength(node.subnet);
    if (prefix === null) { subnetFailures.push(`${label(node)}: invalid or non-contiguous subnet mask ${node.subnet}`); return; }
    if (node.id) parsedNetworks.set(node.id, { prefix, range: networkRange(ipLong, prefix) });
  });
  nodes.forEach((node) => {
    if (!node.id || !node.parentId) return;
    const child = parsedNetworks.get(node.id);
    const parent = parsedNetworks.get(node.parentId);
    if (!child || !parent) return;
    if (child.prefix !== parent.prefix && rangesOverlap(child.range, parent.range)) {
      const parentNode = nodes.find((n) => n.id === node.parentId);
      subnetFailures.push(`Parent/child subnet overlap: ${label(node)} and ${parentNode ? label(parentNode) : node.parentId}`);
    }
  });

  // 4. Interface down
  const down = nodes.flatMap((node) => (node.interfaces || []).filter((item) => item.status?.toUpperCase() === 'DOWN').map((item) => `${label(node)}:${item.name || 'interface'} is DOWN`));

  // 5. Missing VLAN
  const vlanIssues = nodes.flatMap((node) => (node.interfaces || []).filter((item) => !item.vlan?.trim()).map((item) => `${label(node)}:${item.name || 'interface'} has no VLAN`));

  // 6. Missing route - is the target directly reachable, or does the
  //    supplied command output show a default route?
  const source = nodes.find((node) => node.id === payload?.sourceNodeId);
  const target = nodes.find((node) => node.id === payload?.targetNodeId);
  let routeCheck: RuleCheck;
  if (!source || !target || !source.ip || !target.ip) {
    routeCheck = { id: 'missing_route', label: 'Missing Route', status: 'warning', detail: 'A source and target node are required to verify routing' };
  } else {
    const sourceIpLong = ipToLong(source.ip);
    const targetIpLong = ipToLong(target.ip);
    const sourcePrefix = source.subnet ? subnetToPrefixLength(source.subnet) : null;
    const directlyReachable = sourceIpLong !== null && targetIpLong !== null && sourcePrefix !== null
      && (() => { const { network, broadcast } = networkRange(sourceIpLong, sourcePrefix); return targetIpLong >= network && targetIpLong <= broadcast; })();
    if (directlyReachable) {
      routeCheck = { id: 'missing_route', label: 'Missing Route', status: 'pass', detail: 'Target is directly reachable on the source subnet' };
    } else {
      const output = String(payload?.commandOutput || '').toLowerCase();
      const hasDefaultRoute = output.includes('0.0.0.0/0') || (output.includes('gateway of last resort') && !output.includes('not set'));
      routeCheck = hasDefaultRoute
        ? { id: 'missing_route', label: 'Missing Route', status: 'pass', detail: 'Command output includes a default route' }
        : { id: 'missing_route', label: 'Missing Route', status: 'fail', detail: 'No route to the target subnet or default route was found' };
    }
  }

  return [
    { id: 'dup_ip', label: 'Duplicate IP', status: duplicates.length ? 'fail' : 'pass', detail: duplicates.length ? `Duplicate addresses found: ${duplicates.map(([ip, names]) => `${ip} (${names.join(', ')})`).join('; ')}` : 'No duplicate IP addresses found' },
    { id: 'gw_mismatch', label: 'Gateway Mismatch', status: gatewayFailures.length ? 'fail' : 'pass', detail: gatewayFailures.length ? gatewayFailures.join('; ') : 'Configured gateways are valid for their subnets' },
    { id: 'wrong_subnet', label: 'Wrong Subnet', status: subnetFailures.length ? 'fail' : 'pass', detail: subnetFailures.length ? subnetFailures.join('; ') : 'IP addresses and subnet masks are consistent' },
    { id: 'if_down', label: 'Interface Down', status: down.length ? 'fail' : 'pass', detail: down.length ? down.join('; ') : 'All configured interfaces are UP' },
    { id: 'missing_vlan', label: 'Missing VLAN', status: vlanIssues.length ? 'fail' : 'pass', detail: vlanIssues.length ? vlanIssues.join('; ') : 'Configured interfaces have compatible VLAN membership' },
    routeCheck,
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
