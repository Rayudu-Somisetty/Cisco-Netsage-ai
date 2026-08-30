import React from 'react';

interface TestTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  testType: string;
  targetHost: string;
  sourceNodeName: string;
  output: string;
  isLoading: boolean;
  onReRun: () => void;
}

export const TestTerminalModal: React.FC<TestTerminalModalProps> = ({
  isOpen,
  onClose,
  testType,
  targetHost,
  sourceNodeName,
  output,
  isLoading,
  onReRun,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-[#041627] text-white border border-[#c4c6cd]/30 shadow-2xl rounded max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Terminal Header */}
        <div className="bg-[#1a2b3c] px-4 py-2.5 flex justify-between items-center border-b border-[#c4c6cd]/20">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
              <span className="w-3 h-3 rounded-full bg-[#eab308]"></span>
              <span className="w-3 h-3 rounded-full bg-[#4edea3]"></span>
            </div>
            <span className="font-mono text-xs text-[#8192a7] ml-2">
              {sourceNodeName} # {testType.toLowerCase()} {targetHost}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8192a7] hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-4 bg-[#041627] text-[#4edea3] font-mono text-xs min-h-[220px] max-h-[360px] overflow-y-auto leading-relaxed select-text">
          {isLoading ? (
            <div className="flex items-center space-x-2 text-white">
              <span className="w-3 h-3 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin"></span>
              <span>Sending ICMP probe packets through virtual fabric...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">{output}</pre>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-[#1a2b3c] px-4 py-2.5 flex justify-between items-center border-t border-[#c4c6cd]/20">
          <div className="text-[11px] font-mono text-[#8192a7]">
            Source: <span className="text-white font-semibold">{sourceNodeName}</span> | Protocol: <span className="text-[#adc6ff]">ICMP/IP</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onReRun}
              disabled={isLoading}
              className="px-3 py-1 bg-[#0058be] hover:bg-[#004bb0] text-white text-xs font-semibold rounded disabled:opacity-50"
            >
              Re-test
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
