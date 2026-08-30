import React from 'react';
import { NetworkNode } from '../types/network';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: NetworkNode | null;
  reviewStats: { totalCases: number; aiAgreementRate: number; decisions: { Accepted: number; Edited: number; Rejected: number }; issueTypes: Record<string, number>; severity: Record<string, number> };
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  selectedNode,
  reviewStats,
}) => {
  if (!isOpen) return null;

  const nodeName = selectedNode?.name || 'No node selected';
  const nodeIp = selectedNode?.ip || 'Unassigned';
  const interfaces = selectedNode?.interfaces || [];
  const downCount = interfaces.filter((intf) => intf.status === 'DOWN').length;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#f3f4f5]">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#0058be] text-[20px]">
              insights
            </span>
            <h2 className="text-sm font-semibold text-[#041627]">
              Interface Telemetry & Performance Stats ({nodeName})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#44474c] hover:text-[#041627] text-sm font-bold w-6 h-6 rounded flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-sans max-h-[480px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]"><span className="font-mono text-[10px] text-[#74777d] block">REVIEW CASES</span><span className="text-base font-bold text-[#041627]">{reviewStats.totalCases}</span></div>
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]"><span className="font-mono text-[10px] text-[#74777d] block">AI AGREEMENT</span><span className="text-base font-bold text-[#041627]">{reviewStats.aiAgreementRate}%</span></div>
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]"><span className="font-mono text-[10px] text-[#74777d] block">ACCEPTED / EDITED</span><span className="text-base font-bold text-[#041627]">{reviewStats.decisions.Accepted} / {reviewStats.decisions.Edited}</span></div>
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]"><span className="font-mono text-[10px] text-[#74777d] block">REJECTED</span><span className="text-base font-bold text-[#ba1a1a]">{reviewStats.decisions.Rejected}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]"><span className="font-mono text-[10px] text-[#74777d] block">ISSUE TYPES</span>{Object.entries(reviewStats.issueTypes).map(([name, count]) => <div key={name} className="flex justify-between text-[11px]"><span className="truncate">{name}</span><strong>{count}</strong></div>)}</div>
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]"><span className="font-mono text-[10px] text-[#74777d] block">SEVERITY</span>{Object.entries(reviewStats.severity).map(([name, count]) => <div key={name} className="flex justify-between text-[11px]"><span>{name}</span><strong>{count}</strong></div>)}</div>
          </div>
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]">
              <span className="font-mono text-[10px] text-[#74777d] block">THROUGHPUT</span>
              <span className="text-base font-bold text-[#041627] mt-0.5 block">{interfaces.length} interfaces</span>
              <span className="font-mono text-[10px] text-[#00a572]">{interfaces.length - downCount} UP</span>
            </div>
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]">
              <span className="font-mono text-[10px] text-[#74777d] block">PACKET DROPS</span>
              <span className="text-base font-bold text-[#ba1a1a] mt-0.5 block">{downCount}</span>
              <span className="font-mono text-[10px] text-[#ba1a1a]">interfaces DOWN</span>
            </div>
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#c4c6cd]">
              <span className="font-mono text-[10px] text-[#74777d] block">ERROR RATE</span>
              <span className="text-base font-bold text-[#eab308] mt-0.5 block">{interfaces.length ? Math.round((downCount / interfaces.length) * 100) : 0}%</span>
              <span className="font-mono text-[10px] text-[#44474c]">down interface ratio</span>
            </div>
          </div>

          {/* Interface Breakdown Table */}
          <div className="border border-[#c4c6cd] rounded overflow-hidden">
            <div className="bg-[#f3f4f5] px-3 py-2 font-mono text-[11px] font-semibold text-[#44474c] border-b border-[#c4c6cd]">
              Interface Counters (Node: {nodeIp})
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] font-mono text-[10px] text-[#74777d] border-b border-[#c4c6cd]">
                <tr>
                  <th className="py-2 px-3">Port</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Tx (MB)</th>
                  <th className="py-2 px-3">Rx (MB)</th>
                  <th className="py-2 px-3">Drops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6cd]/50 font-mono text-[11px]">
                {interfaces.map((intf) => <tr key={intf.name} className={intf.status === 'DOWN' ? 'bg-[#ffdad6]/20' : ''}>
                  <td className="py-2 px-3 font-semibold text-[#041627]">{intf.name}</td>
                  <td className={`py-2 px-3 font-semibold ${intf.status === 'UP' ? 'text-[#00a572]' : 'text-[#ba1a1a]'}`}>{intf.status}</td>
                  <td className="py-2 px-3 text-[#44474c]">n/a</td><td className="py-2 px-3 text-[#44474c]">n/a</td>
                  <td className={`py-2 px-3 ${intf.status === 'DOWN' ? 'text-[#ba1a1a]' : 'text-[#00a572]'}`}>{intf.status === 'DOWN' ? 1 : 0}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#c4c6cd] bg-[#f8f9fa] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#041627] text-white text-xs font-semibold rounded hover:bg-[#1a2b3c]"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
