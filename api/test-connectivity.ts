import { allowMethod, Node, runRuleChecks } from './_lib';
export default function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['POST'])) return;
  const topology: Node[] = Array.isArray(req.body?.topology) ? req.body.topology : [];
  const source = topology.find((node) => node.id === req.body?.sourceNodeId);
  const target = topology.find((node) => node.id === req.body?.targetNodeId);
  if (!source || !target) return res.status(400).json({ success: false, output: 'A source and target node are required.' });
  const failed = runRuleChecks({ ...req.body, topology }).find((check) => check.status === 'fail');
  const output = failed ? `Ping ${target.ip || target.name} from ${source.name}\n.....\nFailed: ${failed.detail}` : `Ping ${target.ip || target.name} from ${source.name}\n!!!!!\nSuccess rate is 100 percent (5/5)`;
  res.status(200).json({ success: !failed, output, failedHop: failed?.detail || null, hops: [{ hop: 1, ip: source.ip, name: source.name }, { hop: 2, ip: target.ip, name: target.name }] });
}
