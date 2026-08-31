import React, { useState } from 'react';
import {
  AIInsightResult,
  HumanReviewState,
  RuleCheckResult,
  NetworkNode,
} from '../types/network';

interface DiagnosticSectionProps {
  problemDescription: string;
  onChangeProblemDescription: (desc: string) => void;
  commandType: string;
  onChangeCommandType: (cmd: string) => void;
  commandOutput: string;
  onChangeCommandOutput: (output: string) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  aiInsight: AIInsightResult | null;
  humanReview: HumanReviewState;
  onChangeHumanReview: (review: Partial<HumanReviewState>) => void;
  onExecuteVerificationTest: () => void;
  onSubmitReport: () => void;
  onApplySuggestedFix: (fix: string) => void;
  verificationTargets: NetworkNode[];
}

const COMMAND_OPTIONS = [
  'show ip route', 'show vlan brief', 'show interfaces trunk',
  'show interfaces <if> switchport', 'show ip interface brief',
  'show running-config', 'show access-lists', 'show ip nat translations',
  'show ip dhcp binding / pool', 'show cdp neighbors',
  'show wlan summary / dot11', 'show ip ospf neighbor', 'Other / Custom',
];

export const DiagnosticSection: React.FC<DiagnosticSectionProps> = ({
  problemDescription,
  onChangeProblemDescription,
  commandType,
  onChangeCommandType,
  commandOutput,
  onChangeCommandOutput,
  onRunAnalysis,
  isAnalyzing,
  aiInsight,
  humanReview,
  onChangeHumanReview,
  onExecuteVerificationTest,
  onSubmitReport,
  onApplySuggestedFix,
  verificationTargets,
}) => {
  const [copiedFix, setCopiedFix] = useState(false);
  const [activeRuleDetail, setActiveRuleDetail] = useState<RuleCheckResult | null>(null);
  const hasResults = Boolean(aiInsight);

  const handleCopyFix = () => {
    if (!aiInsight) return;
    navigator.clipboard.writeText(aiInsight.suggestedFix);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  return (
    <div
      id="bottom-diagnostic-panel"
      className="h-[380px] min-h-[340px] border-t border-[#c4c6cd] bg-white flex flex-col z-20 shrink-0 select-none overflow-hidden"
    >
      <div className="flex h-full overflow-hidden">
        {/* LEFT COLUMN: Diagnosis Parameters (5/12) */}
        <div
          id="diagnosis-parameters-form"
          className="w-5/12 p-5 border-r border-[#c4c6cd] flex flex-col h-full overflow-y-auto bg-white"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-sans text-base font-semibold text-[#041627] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be] text-[18px]">
                tune
              </span>
              Diagnosis Parameters
            </h3>
            <span className="font-mono text-[10px] text-[#44474c] opacity-70">
              CLI / TAC Input
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col">
            {/* Describe Problem */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 tracking-wider">
                  DESCRIBE THE PROBLEM
                </label>
                <div className="flex space-x-1">
                </div>
              </div>
              <textarea
                className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none resize-none h-16 rounded font-sans leading-relaxed text-[#191c1d]"
                placeholder="e.g. PC1 cannot reach the internet..."
                value={problemDescription}
                onChange={(e) => onChangeProblemDescription(e.target.value)}
              />
            </div>

            {/* Command Type & Output */}
            <div className="flex flex-col space-y-2 flex-1 min-h-0">
              <div>
                <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
                  COMMAND TYPE
                </label>
                <select
                  className="w-full bg-white border border-[#74777d]/60 text-xs p-1.5 focus:border-[#0058be] outline-none rounded font-sans cursor-pointer text-[#191c1d]"
                  value={commandType}
                  onChange={(e) => onChangeCommandType(e.target.value)}
                >
                  <option value="">Select command</option>
                  {COMMAND_OPTIONS.map((cmd) => <option key={cmd} value={cmd}>{cmd}</option>)}
                </select>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 tracking-wider">
                    COMMAND OUTPUT
                  </label>
                  <span className="font-mono text-[10px] text-[#44474c] opacity-60">
                    IOS / Terminal format
                  </span>
                </div>
                <textarea
                  className="w-full flex-1 min-h-[120px] h-[120px] bg-[#f8f9fa] border border-[#74777d]/60 text-[11px] font-mono p-2 focus:border-[#0058be] focus:bg-white outline-none resize-none rounded leading-snug overflow-y-auto text-[#041627]"
                  placeholder="Paste terminal output here..."
                  value={commandOutput}
                  onChange={(e) => onChangeCommandOutput(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            id="btn-analyze-netsage"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="mt-3 w-full bg-[#0058be] text-white py-2 border border-transparent hover:bg-[#004bb0] active:scale-[0.99] transition-all font-semibold rounded text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-70 shrink-0"
          >
            {isAnalyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Synthesizing Network TAC Analysis...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>Analyze with NetSage AI</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: AI Diagnosis Results & Human Review (7/12) */}
        <div
          id="ai-results-panel"
          className="w-7/12 p-5 flex flex-col h-full overflow-y-auto bg-[#f3f4f5]"
        >
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* SUB-COL 1: AI Insights */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-end mb-2 shrink-0">
                <h3 className="font-sans text-sm font-bold text-[#041627] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0058be]"></span>
                  AI Insights
                </h3>
                {hasResults && aiInsight && (
                  <span
                    id="ai-confidence-badge"
                    className="font-mono text-[11px] font-semibold bg-[#1a2b3c] text-[#4edea3] px-2 py-0.5 rounded tracking-wide border border-[#c4c6cd]/30"
                  >
                    CONFIDENCE: {aiInsight.confidenceLevel} ({aiInsight.confidence}%)
                  </span>
                )}
              </div>

              {!hasResults ? (
                <div className="bg-white border border-[#74777d]/40 flex-1 flex items-center justify-center rounded shadow-2xs">
                  <div className="text-center text-xs text-[#44474c] px-4">
                    <div className="font-semibold text-[#191c1d] mb-1">No diagnosis yet</div>
                    <div>Run the diagnosis to populate AI insights.</div>
                  </div>
                </div>
              ) : aiInsight ? (
                <div className="bg-white border border-[#74777d]/40 flex-1 overflow-y-auto flex flex-col rounded shadow-2xs">
                  {/* Root Cause Banner */}
                  <div className="bg-[#041627] px-3 py-2 text-white font-sans font-semibold text-xs shrink-0 rounded-t flex items-start justify-between gap-2">
                    <span className="leading-relaxed">{aiInsight.rootCause}</span>
                    <span className="w-2 h-2 rounded-full bg-[#4edea3] shrink-0"></span>
                  </div>

                  {/* Insight Body Details */}
                  <div className="p-3 space-y-2.5 flex-1 overflow-y-auto text-xs">
                    {/* OSI Layer */}
                    <div className="flex justify-between items-center border-b border-[#c4c6cd]/50 pb-1.5">
                      <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 tracking-wider">
                        OSI LAYER
                      </span>
                      <span className="font-mono text-[12px] font-semibold text-[#0058be]">
                        {aiInsight.osiLayer}
                      </span>
                    </div>

                    {/* Evidence */}
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 block mb-1 tracking-wider">
                        EVIDENCE
                      </span>
                      <ul className="list-disc pl-4 text-[11px] space-y-1 text-[#191c1d] leading-tight">
                        {aiInsight.evidence.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {aiInsight.explanation && (
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 block mb-1 tracking-wider">
                          WHAT THIS MEANS
                        </span>
                        <p className="text-[11px] leading-relaxed text-[#191c1d]">
                          {aiInsight.explanation}
                        </p>
                      </div>
                    )}

                    {/* Next Command Suggestion */}
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 block mb-1 tracking-wider">
                        NEXT COMMAND SUGGESTION
                      </span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-[11px] bg-[#e1e3e4] px-2 py-0.5 rounded block flex-1 truncate text-[#041627]">
                          {aiInsight.nextCommand}
                        </code>
                        <button
                          onClick={() => onChangeCommandType(aiInsight.nextCommand)}
                          className="px-1.5 py-0.5 bg-white border border-[#c4c6cd] hover:bg-[#edeeef] rounded text-[10px] text-[#0058be]"
                          title="Load into command box"
                        >
                          Use
                        </button>
                      </div>
                    </div>

                    {/* Suggested Fix */}
                    <div className="bg-[#edeeef] p-2 border border-[#c4c6cd] rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[10px] font-semibold text-[#191c1d] opacity-70 tracking-wider">
                          SUGGESTED FIX
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={handleCopyFix}
                            className="text-[10px] font-medium text-[#0058be] hover:underline flex items-center gap-0.5"
                          >
                            {copiedFix ? 'Copied!' : 'Copy'}
                          </button>
                          <span className="text-[#74777d]">|</span>
                          <button
                            onClick={() => onApplySuggestedFix(aiInsight.suggestedFix)}
                            className="text-[10px] font-medium text-[#0058be] hover:underline"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                      <code className="font-mono text-[11px] text-[#0058be] break-all block whitespace-pre-wrap leading-tight">
                        {aiInsight.suggestedFix}
                      </code>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* SUB-COL 2: Review & Python Rules */}
            <div className="flex flex-col h-full space-y-2.5">
              {!hasResults ? (
                <div className="bg-white border border-[#74777d]/40 p-2.5 flex-1 flex items-center justify-center rounded shadow-2xs text-xs text-[#44474c] text-center">
                  Run the diagnosis first to unlock the rule checker and review workflow.
                </div>
              ) : aiInsight ? (
                <>
                  {/* Python Rule Checker */}
                  <div className="bg-white border border-[#74777d]/40 p-2.5 shrink-0 rounded shadow-2xs">
                    <div className="flex justify-between items-center border-b border-[#c4c6cd]/50 pb-1 mb-1.5">
                      <h4 className="font-sans text-xs font-bold text-[#041627]">
                        Network Rule Checks
                      </h4>
                      <span className="font-mono text-[10px] text-[#4edea3] bg-[#00311f] px-1.5 rounded">
                        {aiInsight.ruleChecks.length} Rules Evaluated
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      {aiInsight.ruleChecks.map((rule) => {
                        const isPass = rule.status === 'pass';
                        const isFail = rule.status === 'fail';

                        return (
                          <div
                            key={rule.id}
                            onClick={() => setActiveRuleDetail(rule)}
                            className="flex items-center space-x-1.5 cursor-pointer hover:bg-[#f3f4f5] px-1 py-0.5 rounded transition-colors"
                            title={rule.detail}
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isPass
                                  ? 'bg-[#4edea3]'
                                  : isFail
                                  ? 'bg-[#ba1a1a]'
                                  : 'bg-[#eab308]'
                              }`}
                            />
                            <span
                              className={`truncate ${
                                isFail ? 'font-bold text-[#ba1a1a]' : 'text-[#191c1d]'
                              }`}
                            >
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {aiInsight.ruleChecks.some((rule) => rule.status !== 'pass') && (
                      <div className="mt-2 space-y-1 border-t border-[#c4c6cd]/50 pt-1.5">
                        {aiInsight.ruleChecks.filter((rule) => rule.status !== 'pass').map((rule) => (
                          <div key={`${rule.id}-detail`} className="text-[10px] leading-snug text-[#44474c]">
                            <span className={rule.status === 'fail' ? 'font-bold text-[#ba1a1a]' : 'font-bold text-[#9a6700]'}>{rule.label}: </span>
                            {rule.detail}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Human Review */}
                  <div className="bg-white border border-[#74777d]/40 p-2.5 flex-1 overflow-y-auto flex flex-col text-xs rounded shadow-2xs">
                    <div className="flex justify-between items-center border-b border-[#c4c6cd]/50 pb-1 mb-1.5">
                      <h4 className="font-sans text-xs font-bold text-[#041627]">
                        Human Review
                      </h4>
                      <span className="font-mono text-[10px] text-[#8192a7]">
                        Status: {humanReview.decision || 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {/* Decision Toggle Buttons */}
                      <div className="flex space-x-1.5">
                        <button
                          id="btn-review-accept"
                          onClick={() => onChangeHumanReview({ decision: 'Accept' })}
                          className={`flex-1 py-1 font-semibold text-[11px] border rounded transition-all ${
                            humanReview.decision === 'Accept'
                              ? 'bg-[#4edea3] text-[#002113] border-[#4edea3] shadow-xs'
                              : 'bg-[#f3f4f5] text-[#191c1d] border-[#c4c6cd] hover:bg-[#e1e3e4]'
                          }`}
                        >
                          Accept
                        </button>
                        <button
                          id="btn-review-edit"
                          onClick={() => onChangeHumanReview({ decision: 'Edit' })}
                          className={`flex-1 py-1 font-semibold text-[11px] border rounded transition-all ${
                            humanReview.decision === 'Edit'
                              ? 'bg-[#0058be] text-white border-[#0058be] shadow-xs'
                              : 'bg-[#f3f4f5] text-[#191c1d] border-[#c4c6cd] hover:bg-[#e1e3e4]'
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          id="btn-review-reject"
                          onClick={() => onChangeHumanReview({ decision: 'Reject' })}
                          className={`flex-1 py-1 font-semibold text-[11px] border rounded transition-all ${
                            humanReview.decision === 'Reject'
                              ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] shadow-xs'
                              : 'bg-[#f3f4f5] text-[#ba1a1a] border-[#ba1a1a]/60 hover:bg-[#ffdad6]'
                          }`}
                        >
                          Reject
                        </button>
                      </div>

                      {/* Comments */}
                      <div>
                        <label className="block font-mono text-[10px] font-semibold text-[#191c1d] opacity-60 mb-0.5 tracking-wider">
                          FINAL DIAGNOSIS / COMMENTS
                        </label>
                        <textarea
                          className="w-full bg-white border border-[#74777d]/60 p-1.5 text-[11px] h-10 focus:border-[#0058be] outline-none resize-none rounded text-[#191c1d]"
                          placeholder="Reason for change, verification comments..."
                          value={humanReview.comments}
                          onChange={(e) => onChangeHumanReview({ comments: e.target.value })}
                        />
                      </div>

                      {/* Reviewer & Verification Test */}
                      <div className="flex space-x-2">
                        <div className="w-1/2">
                          <label className="block font-mono text-[10px] font-semibold text-[#191c1d] opacity-60 mb-0.5 tracking-wider">
                            REVIEWER
                          </label>
                          <input
                            className="w-full bg-white border border-[#74777d]/60 p-1 text-[11px] focus:border-[#0058be] outline-none rounded font-sans"
                            type="text"
                            value={humanReview.reviewer}
                            onChange={(e) => onChangeHumanReview({ reviewer: e.target.value })}
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block font-mono text-[10px] font-semibold text-[#191c1d] opacity-60 mb-0.5 tracking-wider">
                            VERIFICATION
                          </label>
                          <div className="flex space-x-1">
                            <select
                              className="flex-1 bg-white border border-[#74777d]/60 p-1 text-[11px] focus:border-[#0058be] outline-none rounded truncate disabled:bg-[#f3f4f5]"
                              value={humanReview.verificationTest}
                              onChange={(e) =>
                                onChangeHumanReview({ verificationTest: e.target.value })
                              }
                              disabled={verificationTargets.length === 0}
                            >
                              <option value="">{verificationTargets.length === 0 ? 'No other nodes' : 'Select target'}</option>
                              {verificationTargets.map((node) => <option key={node.id} value={`Ping ${node.id}`}>Ping {node.name}</option>)}
                              {verificationTargets.map((node) => <option key={`trace-${node.id}`} value={`Traceroute ${node.id}`}>Traceroute {node.name}</option>)}
                            </select>
                            <button
                              id="btn-verification-test"
                              onClick={onExecuteVerificationTest}
                              disabled={humanReview.isTesting || verificationTargets.length === 0 || !humanReview.verificationTest}
                              className="bg-[#f3f4f5] border border-[#74777d]/60 px-2 text-[11px] hover:bg-[#e1e3e4] rounded font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                              title={verificationTargets.length === 0 ? 'Add another node to test connectivity' : ''}
                            >
                              {humanReview.isTesting ? '...' : 'Test'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Final Report */}
                    <button
                      id="btn-submit-report"
                      onClick={onSubmitReport}
                      className="mt-2 w-full py-1.5 bg-[#041627] text-white border border-transparent hover:bg-[#1a2b3c] text-xs font-semibold rounded shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      Submit Final Report
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Rule Detail Modal / Popover */}
      {activeRuleDetail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded p-4 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#c4c6cd] pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeRuleDetail.status === 'pass'
                      ? 'bg-[#4edea3]'
                      : activeRuleDetail.status === 'fail'
                      ? 'bg-[#ba1a1a]'
                      : 'bg-[#eab308]'
                  }`}
                />
                <h3 className="font-semibold text-sm text-[#041627]">
                  {activeRuleDetail.label}
                </h3>
              </div>
              <button
                onClick={() => setActiveRuleDetail(null)}
                className="text-[#74777d] hover:text-[#041627] font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#44474c] block">
                  Rule Status
                </span>
                <span
                  className={`font-semibold uppercase ${
                    activeRuleDetail.status === 'pass'
                      ? 'text-[#00a572]'
                      : activeRuleDetail.status === 'fail'
                      ? 'text-[#ba1a1a]'
                      : 'text-[#eab308]'
                  }`}
                >
                  {activeRuleDetail.status}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-[#44474c] block">
                  Diagnostic Detail
                </span>
                <p className="text-[#191c1d] bg-[#f8f9fa] p-2 rounded border border-[#c4c6cd]">
                  {activeRuleDetail.detail}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveRuleDetail(null)}
              className="mt-4 w-full py-1 bg-[#041627] text-white text-xs font-semibold rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
