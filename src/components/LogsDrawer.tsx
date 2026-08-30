import React, { useState } from 'react';
import { NetworkNode } from '../types/network';

interface LogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: NetworkNode | null;
  nodes: NetworkNode[];
}

export const LogsDrawer: React.FC<LogsDrawerProps> = ({
  isOpen,
  onClose,
  selectedNode,
  nodes,
}) => {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const nodeName = selectedNode?.name || 'No node selected';
  const logs = selectedNode?.interfaces.filter((intf) => intf.status === 'DOWN').map((intf) => ({
    time: new Date().toLocaleTimeString(), level: 'ERR', msg: `%LINK-3-UPDOWN: Interface ${intf.name}, changed state to down`,
  })) || [];
  if (selectedNode?.ip && nodes.filter((node) => node.ip === selectedNode.ip).length > 1) logs.push({ time: new Date().toLocaleTimeString(), level: 'WARN', msg: `%IP-4-DUPADDR: Duplicate address ${selectedNode.ip} on ${selectedNode.name}` });
  const filteredLogs = logs.filter(
    (l) =>
      l.msg.toLowerCase().includes(filter.toLowerCase()) ||
      l.level.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDownloadLogs = () => {
    const fileName = `${(selectedNode?.name || 'node').replace(/\s+/g, '_')}-syslog-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const lines = filteredLogs.length
      ? filteredLogs.map((log) => `[${log.time}] ${log.level} ${log.msg}`)
      : ['No log entries available for this node.'];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#f3f4f5]">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#0058be] text-[20px]">
              terminal
            </span>
            <h2 className="text-sm font-semibold text-[#041627]">
              Real-time Syslog & Event Stream ({nodeName})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#44474c] hover:text-[#041627] text-sm font-bold w-6 h-6 rounded flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Filter */}
        <div className="p-3 border-b border-[#c4c6cd] bg-[#f8f9fa] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#74777d] text-[18px]">search</span>
          <input
            type="text"
            placeholder="Filter syslog buffer by keyword (e.g. UPDOWN, OSPF, DUPADDR)..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white border border-[#c4c6cd] px-2 py-1 text-xs outline-none rounded font-mono"
          />
        </div>

        {/* Logs Terminal Body */}
        <div className="p-4 bg-[#041627] text-white font-mono text-xs max-h-[380px] overflow-y-auto space-y-1.5 select-text">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-[#8192a7] shrink-0 text-[11px]">{log.time}</span>
              <span
                className={`font-bold px-1 rounded text-[10px] shrink-0 ${
                  log.level === 'ERR'
                    ? 'bg-[#ba1a1a] text-white'
                    : log.level === 'WARN'
                    ? 'bg-[#eab308] text-[#001a0f]'
                    : 'bg-[#1a2b3c] text-[#4edea3]'
                }`}
              >
                {log.level}
              </span>
              <span
                className={
                  log.level === 'ERR'
                    ? 'text-[#ffdad6]'
                    : log.level === 'WARN'
                    ? 'text-[#fefcff]'
                    : 'text-[#adc6ff]'
                }
              >
                {log.msg}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#c4c6cd] bg-[#f8f9fa] flex justify-between items-center text-xs gap-2">
          <span className="font-mono text-[11px] text-[#44474c]">
            Buffer: {filteredLogs.length} lines | Level: Debugging
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadLogs}
              className="px-3 py-1.5 bg-[#0058be] text-white text-xs font-semibold rounded hover:bg-[#004bb0]"
            >
              Download Logs
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#041627] text-white text-xs font-semibold rounded hover:bg-[#1a2b3c]"
            >
              Close Syslog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
