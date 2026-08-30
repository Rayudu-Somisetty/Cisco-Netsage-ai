import React, { useEffect, useState } from 'react';
import { TroubleshootingCase } from '../types/network';

interface SessionsViewProps {
  cases: TroubleshootingCase[];
  onLoadCaseToTopology: (c: TroubleshootingCase) => void;
  onOpenTopology: () => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  cases,
  onLoadCaseToTopology,
  onOpenTopology,
}) => {
  const [selectedCase, setSelectedCase] = useState<TroubleshootingCase | null>(
    cases.length > 0 ? cases[0] : null
  );
  const [filter, setFilter] = useState<'ALL' | 'RESOLVED' | 'OPEN'>('ALL');
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    setSelectedCase(cases[0] || null);
  }, [cases]);

  const filteredCases = cases.filter((c) => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  const handleExportJson = () => {
    const dataStr = JSON.stringify(cases, null, 2);
    navigator.clipboard.writeText(dataStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-hidden bg-[#f8f9fa] flex flex-col space-y-4 select-none">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded border border-[#c4c6cd] shadow-2xs gap-3 shrink-0">
        <div>
          <h1 className="text-base font-bold text-[#041627] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0058be] text-[20px]">
              history_edu
            </span>
            Troubleshooting Sessions & Audit History
          </h1>
          <p className="text-xs text-[#44474c] mt-0.5">
            Immutable log of all AI diagnoses, human TAC reviews, and verification tests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-[#c4c6cd] rounded overflow-hidden text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 font-medium transition-colors ${
                filter === 'ALL' ? 'bg-[#0058be] text-white' : 'bg-white text-[#44474c] hover:bg-[#f3f4f5]'
              }`}
            >
              All ({cases.length})
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-3 py-1 font-medium transition-colors ${
                filter === 'RESOLVED' ? 'bg-[#0058be] text-white' : 'bg-white text-[#44474c] hover:bg-[#f3f4f5]'
              }`}
            >
              Resolved
            </button>
          </div>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-[#f3f4f5] border border-[#c4c6cd] text-xs font-semibold text-[#041627] hover:bg-[#edeeef] rounded flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            {copiedExport ? 'Copied Audit JSON!' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Main Grid: Master List on Left, Detail Card on Right */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Cases List (5/12) */}
        <div className="md:col-span-5 bg-white rounded border border-[#c4c6cd] shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3 bg-[#f8f9fa] border-b border-[#c4c6cd] font-mono text-[11px] font-semibold text-[#44474c] uppercase tracking-wider">
            Case Archive ({filteredCases.length})
          </div>
          <div className="divide-y divide-[#c4c6cd]/50 overflow-y-auto flex-1">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.caseId === c.caseId;
              return (
                <div
                  key={c.caseId}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#f3f4f5] border-l-4 border-[#0058be]' : 'hover:bg-[#f8f9fa]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-[#0058be]">{c.caseId}</span>
                    <span className="font-mono text-[10px] text-[#74777d]">{c.timestamp}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#041627] truncate">{c.title}</div>
                  <div className="text-[11px] text-[#44474c] mt-1 truncate">{c.diagnosis.rootCause}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#00a572] font-semibold bg-[#4edea3]/20 px-1.5 py-0.5 rounded">
                      {c.status}
                    </span>
                    <span className="text-[#74777d]">Decision: {c.humanReview.decision || 'Pending'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Case Detail (7/12) */}
        <div className="md:col-span-7 bg-white rounded border border-[#c4c6cd] shadow-2xs flex flex-col overflow-hidden">
          {selectedCase ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 text-xs font-sans">
              {/* Case Header */}
              <div className="flex justify-between items-start border-b border-[#c4c6cd] pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-[#0058be]">
                      {selectedCase.caseId}
                    </span>
                    <span className="text-xs text-[#74777d] font-mono">
                      • {selectedCase.timestamp}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#041627] mt-1">
                    {selectedCase.title}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    onLoadCaseToTopology(selectedCase);
                    onOpenTopology();
                  }}
                  className="px-3 py-1 bg-[#0058be] text-white font-semibold text-xs rounded hover:bg-[#004bb0] flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  Load in Topology
                </button>
              </div>

              {/* Diagnosis Summary Card */}
              <div className="bg-[#041627] text-white p-3.5 rounded border border-[#c4c6cd]/30 shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px] text-[#4edea3] font-semibold">
                    AI TAC DIAGNOSIS
                  </span>
                  <span className="font-mono text-[10px] bg-[#1a2b3c] px-2 py-0.5 rounded text-[#adc6ff]">
                    Confidence: {selectedCase.diagnosis.confidence}%
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {selectedCase.diagnosis.rootCause}
                </div>
                <div className="font-mono text-[11px] text-[#adc6ff]">
                  Layer: {selectedCase.diagnosis.osiLayer}
                </div>
              </div>

              {/* Evidence & Fix */}
              <div className="space-y-2">
                <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-70 uppercase tracking-wider block">
                  Identified Evidence
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#191c1d]">
                  {selectedCase.diagnosis.evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Suggested Fix */}
              <div>
                <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-70 uppercase tracking-wider block mb-1">
                  Applied Remediation CLI
                </span>
                <pre className="p-2.5 bg-[#f8f9fa] border border-[#c4c6cd] rounded font-mono text-[11px] text-[#0058be] whitespace-pre-wrap">
                  {selectedCase.diagnosis.suggestedFix}
                </pre>
              </div>

              {/* Human Review Section */}
              <div className="bg-[#f3f4f5] p-3 rounded border border-[#c4c6cd] space-y-2">
                <span className="font-mono text-[11px] font-semibold text-[#191c1d] opacity-70 uppercase tracking-wider block">
                  Human TAC Review & Sign-Off
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#74777d] block text-[10px] font-mono">REVIEWER</span>
                    <span className="font-semibold text-[#041627]">
                      {selectedCase.humanReview.reviewer}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#74777d] block text-[10px] font-mono">DECISION</span>
                    <span className="font-semibold text-[#00a572]">
                      {selectedCase.humanReview.decision}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[#74777d] block text-[10px] font-mono">COMMENTS</span>
                  <p className="text-[#191c1d] text-xs mt-0.5">
                    {selectedCase.humanReview.comments || 'No additional comments provided.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#74777d]">
              Select a case from the archive to view full diagnostic report
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
