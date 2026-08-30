import React from 'react';

interface HeaderProps {
  currentTab: 'Dashboard' | 'Topology' | 'Sessions';
  onSelectTab: (tab: 'Dashboard' | 'Topology' | 'Sessions') => void;
  caseId: string;
  onNewCase: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  caseId,
  onNewCase,
  onOpenNotifications,
  onOpenSettings,
}) => {
  return (
    <header
      id="top-navbar"
      className="flex justify-between items-center w-full px-6 h-16 bg-[#041627] text-white font-sans text-sm border-b border-[#c4c6cd]/30 z-50 shrink-0 select-none shadow-sm"
    >
      {/* Brand & Case ID */}
      <div className="flex items-center space-x-6">
        <div
          onClick={() => onSelectTab('Topology')}
          className="text-xl font-bold tracking-tight text-white cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="w-3 h-3 rounded-full bg-[#4edea3] inline-block shadow-[0_0_8px_rgba(78,222,163,0.6)]"></span>
          NetSage AI
        </div>
        <div
          id="case-id-container"
          className="bg-[#1a2b3c] text-[#8192a7] px-3 py-1 rounded text-xs font-mono border border-[#c4c6cd]/30 flex items-center space-x-2"
        >
          <span className="opacity-70">CASE ID:</span>
          <span className="font-bold text-[#4edea3]" id="case-id">
            {caseId}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden md:flex space-x-2 h-full items-center">
        <button
          id="nav-dashboard"
          onClick={() => onSelectTab('Dashboard')}
          className={`px-4 py-2 h-full flex items-center transition-colors text-sm font-medium ${
            currentTab === 'Dashboard'
              ? 'text-white border-b-2 border-[#adc6ff] bg-[#1a2b3c]/50'
              : 'text-[#8192a7] hover:text-white hover:bg-[#1a2b3c]/30'
          }`}
        >
          Dashboard
        </button>
        <button
          id="nav-topology"
          onClick={() => onSelectTab('Topology')}
          className={`px-4 py-2 h-full flex items-center transition-colors text-sm font-medium ${
            currentTab === 'Topology'
              ? 'text-white font-bold border-b-2 border-[#adc6ff] bg-[#1a2b3c]/50'
              : 'text-[#8192a7] hover:text-white hover:bg-[#1a2b3c]/30'
          }`}
        >
          Topology
        </button>
        <button
          id="nav-sessions"
          onClick={() => onSelectTab('Sessions')}
          className={`px-4 py-2 h-full flex items-center transition-colors text-sm font-medium ${
            currentTab === 'Sessions'
              ? 'text-white border-b-2 border-[#adc6ff] bg-[#1a2b3c]/50'
              : 'text-[#8192a7] hover:text-white hover:bg-[#1a2b3c]/30'
          }`}
        >
          Sessions
        </button>
      </nav>

      {/* Action Buttons & Profile */}
      <div className="flex items-center space-x-3">
        <button
          id="btn-new-case"
          onClick={onNewCase}
          className="px-4 py-1.5 bg-white text-[#041627] rounded text-xs font-semibold hover:bg-[#edeeef] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Case
        </button>
        <button
          id="btn-notifications"
          onClick={onOpenNotifications}
          className="w-8 h-8 flex items-center justify-center text-[#8192a7] hover:text-white hover:bg-[#1a2b3c] transition-colors rounded relative"
          title="Alerts and Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-[#041627]"></span>
        </button>
        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="w-8 h-8 flex items-center justify-center text-[#8192a7] hover:text-white hover:bg-[#1a2b3c] transition-colors rounded"
          title="Network TAC Engine Settings"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        <div
          id="user-profile-avatar"
          className="w-8 h-8 rounded-full bg-[#e1e3e4] overflow-hidden border border-[#74777d] ring-2 ring-[#4edea3]/40 cursor-pointer"
          title="Lead Network Engineer (Admin)"
        >
          <img
            alt="User profile settings"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Q1ljsPupcbYQNwmOOZxH5RbKsBbliv4_Q6m_IKjIyrJ1wV1m54Swdd_6jHM56Io0NHqghzNt9bxMEZZteWTm6CKeN3hLRCN6iw1VCvgxCwQNKO8wQnZ3FLc7PMzEzEydUmSzRnbr9ePPh8X0ENrruDiMnKE9H4UlIQz3Bv3TP5ERMi9oketmX2K0_-mNBCF7-Jp7WM4RJdDZrTdjo3UGi_nx1tTFkaYhjvvbfKj0hQz9HUPc_raL"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};
