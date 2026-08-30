import React from 'react';
import { NetworkNode, TroubleshootingCase } from '../types/network';

interface DashboardViewProps {
  nodes: NetworkNode[];
  cases: TroubleshootingCase[];
  reviewStats: { totalCases: number; aiAgreementRate: number };
  onOpenTopology: () => void;
  onOpenNewCase: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  nodes,
  cases,
  reviewStats,
  onOpenTopology,
  onOpenNewCase,
}) => {
  const healthyCount = nodes.filter((n) => n.status === 'healthy').length;
  const warningCount = nodes.filter((n) => n.status === 'warning').length;
  const errorCount = nodes.filter((n) => n.status === 'error' || n.status === 'down').length;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f8f9fa] space-y-6 select-none">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded border border-[#c4c6cd] shadow-2xs gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            <h1 className="text-xl font-bold text-[#041627]">NetSage AI Network Health Center</h1>
          </div>
          <p className="text-xs text-[#44474c] mt-1 font-sans">
            Real-time topology diagnostics, heuristic rule evaluation, and Cisco TAC root-cause analysis.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onOpenNewCase}
            className="px-3.5 py-1.5 bg-[#0058be] text-white text-xs font-semibold rounded hover:bg-[#004bb0] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            New Diagnosis Case
          </button>
          <button
            onClick={onOpenTopology}
            className="px-3.5 py-1.5 bg-[#041627] text-white text-xs font-semibold rounded hover:bg-[#1a2b3c] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            Open Topology Canvas
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded border border-[#c4c6cd] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[11px] font-semibold text-[#44474c] opacity-70">
              ACTIVE TOPOLOGY NODES
            </span>
            <span className="material-symbols-outlined text-[#0058be] text-[20px]">devices</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#041627]">{nodes.length}</span>
            <span className="font-mono text-xs text-[#00a572] font-semibold">
              {healthyCount} Healthy
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded border border-[#c4c6cd] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[11px] font-semibold text-[#44474c] opacity-70">
              ANOMALIES & FAULTS
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">warning</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#ba1a1a]">{errorCount + warningCount}</span>
            <span className="font-mono text-xs text-[#ba1a1a] font-semibold">
              {errorCount} Critical | {warningCount} Warn
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded border border-[#c4c6cd] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[11px] font-semibold text-[#44474c] opacity-70">
              AI DIAGNOSIS ACCURACY
            </span>
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">psychology</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#041627]">{reviewStats.aiAgreementRate}%</span>
            <span className="font-mono text-xs text-[#0058be] font-semibold">Accepted AI reviews</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded border border-[#c4c6cd] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[11px] font-semibold text-[#44474c] opacity-70">
              TOTAL CASES RESOLVED
            </span>
            <span className="material-symbols-outlined text-[#8192a7] text-[20px]">task_alt</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#041627]">{reviewStats.totalCases}</span>
            <span className="font-mono text-xs text-[#00a572] font-semibold">Persisted reviews</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Device Breakdown & Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Matrix */}
        <div className="lg:col-span-2 bg-white p-5 rounded border border-[#c4c6cd] shadow-2xs flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-[#c4c6cd]/50 pb-2">
            <h2 className="font-bold text-sm text-[#041627] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be] text-[18px]">
                lan
              </span>
              Current Fabric Inventory & Interface Map
            </h2>
            <button
              onClick={onOpenTopology}
              className="text-xs text-[#0058be] hover:underline font-semibold"
            >
              Interactive Canvas →
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#c4c6cd] text-[#44474c] font-mono text-[11px]">
                  <th className="py-2 px-3">Device Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">IP Address</th>
                  <th className="py-2 px-3">Subnet / Gateway</th>
                  <th className="py-2 px-3">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6cd]/40 font-sans">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#041627]">{node.name}</td>
                    <td className="py-2 px-3 font-mono text-[#44474c] text-[11px]">{node.type}</td>
                    <td className="py-2 px-3 font-mono text-[#0058be] font-semibold">{node.ip}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#44474c]">
                      {node.subnet} / {node.gateway}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          node.status === 'healthy'
                            ? 'bg-[#4edea3]/20 text-[#002113] border border-[#4edea3]'
                            : node.status === 'warning'
                            ? 'bg-[#eab308]/20 text-[#713f12] border border-[#eab308]'
                            : 'bg-[#ba1a1a]/20 text-[#ba1a1a] border border-[#ba1a1a]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            node.status === 'healthy'
                              ? 'bg-[#00a572]'
                              : node.status === 'warning'
                              ? 'bg-[#eab308]'
                              : 'bg-[#ba1a1a]'
                          }`}
                        />
                        {node.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Diagnoses Feed */}
        <div className="bg-white p-5 rounded border border-[#c4c6cd] shadow-2xs flex flex-col">
          <div className="flex justify-between items-center mb-3 border-b border-[#c4c6cd]/50 pb-2">
            <h2 className="font-bold text-sm text-[#041627] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be] text-[18px]">
                history
              </span>
              Recent Diagnostic Cases
            </h2>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {cases.map((c) => (
              <div
                key={c.caseId}
                className="p-3 bg-[#f8f9fa] border border-[#c4c6cd]/60 rounded hover:border-[#0058be] transition-colors cursor-pointer"
                onClick={onOpenTopology}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[11px] font-bold text-[#0058be]">
                    {c.caseId}
                  </span>
                  <span className="font-mono text-[10px] text-[#44474c]">{c.timestamp}</span>
                </div>
                <div className="text-xs font-semibold text-[#041627] line-clamp-1">{c.title}</div>
                <div className="text-[11px] text-[#44474c] mt-1 line-clamp-1 opacity-80">
                  {c.diagnosis.rootCause}
                </div>
                <div className="mt-2 flex justify-between items-center pt-2 border-t border-[#c4c6cd]/30 text-[10px] font-mono">
                  <span className="text-[#00a572] font-semibold">{c.status}</span>
                  <span className="text-[#8192a7]">Verified by {c.humanReview.reviewer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
