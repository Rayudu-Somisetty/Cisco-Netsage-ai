import React from 'react';
import { NetworkNode } from '../types/network';

interface SidebarProps {
  selectedNode: NetworkNode | null;
  activeSidebarView: 'device-config' | 'ai-diagnosis' | 'interface-stats' | 'logs';
  onSelectSidebarView: (view: 'device-config' | 'ai-diagnosis' | 'interface-stats' | 'logs') => void;
  onRunDiagnostic: () => void;
  isAnalyzing: boolean;
  onOpenDoc: () => void;
  onOpenSupport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  activeSidebarView,
  onSelectSidebarView,
  onRunDiagnostic,
  isAnalyzing,
  onOpenDoc,
  onOpenSupport,
}) => {
  return (
    <aside
      id="side-navbar"
      className="w-sidebar-width bg-white border-r border-[#c4c6cd] flex flex-col z-40 shrink-0 hidden md:flex h-full select-none"
    >
      {/* Node Info Top Card */}
      <div
        id="device-configuration-summary"
        className="p-4 border-b border-[#c4c6cd] flex items-center space-x-3 bg-white cursor-pointer hover:bg-[#f8f9fa] transition-colors"
        onClick={() => onSelectSidebarView('device-config')}
      >
        <div className="w-10 h-10 bg-[#e1e3e4] rounded border border-[#74777d]/40 flex-shrink-0 overflow-hidden shadow-2xs">
          <img
            alt="System Status"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgWsQGK4bacsG2wIOyiRxOENeW-23zKkFuSfs3tFPUNjQmXStTCzG1at1huNZziyQf9HbBQ6a05JjYbWw3KIBrsjS3uYPUbCrQpejyeTAtdaSvlh_udqK3O9QxtyHkR-H9nsUTfbvs3bAWi4-891yE0gbsdxcPbT_gSnaccbu2xedtQGOMS8Kj7m5y0uC689DwlySSA8R7s9gdf5truK260vSs3ZKTpvK2VECngp-EnbokcehlfZsd"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-semibold text-[#191c1d] leading-tight">Configuration</div>
          <div
            id="global-device-ip"
            className="font-mono text-[11px] text-[#191c1d] opacity-60 tracking-wider truncate"
          >
            {selectedNode ? `Device Node: ${selectedNode.ip || selectedNode.name}` : 'Device Node: 10.0.0.1'}
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 py-4 flex flex-col space-y-1 overflow-y-auto">
        <button
          id="nav-device-config"
          onClick={() => onSelectSidebarView('device-config')}
          className={`flex items-center px-6 py-3 text-sm font-medium transition-all text-left w-full ${
            activeSidebarView === 'device-config'
              ? 'text-[#0058be] border-l-4 border-[#0058be] bg-[#f3f4f5] font-semibold'
              : 'text-[#44474c] hover:bg-[#edeeef] border-l-4 border-transparent'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">settings_ethernet</span>
          Device Config
        </button>

        <button
          id="nav-ai-diagnosis"
          onClick={() => onSelectSidebarView('ai-diagnosis')}
          className={`flex items-center px-6 py-3 text-sm font-medium transition-all text-left w-full ${
            activeSidebarView === 'ai-diagnosis'
              ? 'text-[#0058be] border-l-4 border-[#0058be] bg-[#f3f4f5] font-semibold'
              : 'text-[#44474c] hover:bg-[#edeeef] border-l-4 border-transparent'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">psychology</span>
          AI Diagnosis
        </button>

        <button
          id="nav-interface-stats"
          onClick={() => onSelectSidebarView('interface-stats')}
          className={`flex items-center px-6 py-3 text-sm font-medium transition-all text-left w-full ${
            activeSidebarView === 'interface-stats'
              ? 'text-[#0058be] border-l-4 border-[#0058be] bg-[#f3f4f5] font-semibold'
              : 'text-[#44474c] hover:bg-[#edeeef] border-l-4 border-transparent'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">insights</span>
          Interface Stats
        </button>

        <button
          id="nav-logs"
          onClick={() => onSelectSidebarView('logs')}
          className={`flex items-center px-6 py-3 text-sm font-medium transition-all text-left w-full ${
            activeSidebarView === 'logs'
              ? 'text-[#0058be] border-l-4 border-[#0058be] bg-[#f3f4f5] font-semibold'
              : 'text-[#44474c] hover:bg-[#edeeef] border-l-4 border-transparent'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">terminal</span>
          Logs
        </button>
      </nav>

      {/* Primary Action Button */}
      <div className="p-4 border-t border-[#c4c6cd]">
        <button
          id="btn-run-diagnostic-side"
          onClick={onRunDiagnostic}
          disabled={isAnalyzing}
          className="w-full bg-[#0058be] text-white font-sans text-sm py-2 px-3 rounded hover:bg-[#004bb0] active:scale-[0.99] transition-all flex justify-center items-center gap-2 shadow-xs disabled:opacity-70 font-semibold"
        >
          {isAnalyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Analyzing...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              Run Diagnostic
            </>
          )}
        </button>
      </div>

      {/* Bottom Documentation & Support */}
      <div className="py-2 border-t border-[#c4c6cd] flex flex-col space-y-1 mt-auto">
        <button
          id="btn-documentation"
          onClick={onOpenDoc}
          className="flex items-center px-6 py-2 text-[#44474c] hover:bg-[#edeeef] transition-all text-xs font-medium w-full text-left"
        >
          <span className="material-symbols-outlined mr-3 text-[18px]">help</span>
          Documentation
        </button>
        <button
          id="btn-support"
          onClick={onOpenSupport}
          className="flex items-center px-6 py-2 text-[#44474c] hover:bg-[#edeeef] transition-all text-xs font-medium w-full text-left"
        >
          <span className="material-symbols-outlined mr-3 text-[18px]">contact_support</span>
          Support
        </button>
      </div>
    </aside>
  );
};
