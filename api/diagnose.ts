import { allowMethod, diagnose } from './_lib';
export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, ['POST'])) return;
  const result = await diagnose(req.body || {});
  const body = result.body as Record<string, any>;
  if (result.status === 200 && body.success && body.data) {
    try {
      const { firestore } = await import('./firebase');
      const caseId = typeof req.body?.caseId === 'string' && req.body.caseId !== 'NEW' ? req.body.caseId : `C${Date.now()}`;
      await firestore().collection('cases').doc(caseId).set({
        aiDiagnosis: body.data,
        checkerFindings: body.data.ruleChecks || [],
        humanDecision: null,
        finalDiagnosis: body.data.rootCause || '',
        reasonForChange: '',
        reviewer: '',
        verificationResult: null,
        targetDevice: req.body?.selectedNode?.name || '',
        problemDescription: req.body?.problemDescription || '',
        commandType: req.body?.commandType || '',
        commandOutput: req.body?.commandOutput || '',
        verificationTest: '',
        nodeCount: Array.isArray(req.body?.topology) ? req.body.topology.length : 0,
        timestamp: new Date().toISOString(),
      }, { merge: true });
      body.caseId = caseId;
      body.persistenceAvailable = true;
    } catch (error) {
      console.error('Diagnosis completed, but Firestore save failed:', error);
      body.persistenceAvailable = false;
      body.persistenceError = error instanceof Error ? error.message : 'Could not save diagnosis.';
    }
  }
  res.status(result.status).json(result.body);
}
