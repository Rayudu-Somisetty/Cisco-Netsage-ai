import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [strictOsiMode, setStrictOsiMode] = useState(true);
  const [autoRuleCheck, setAutoRuleCheck] = useState(true);
  const [tacVendor, setTacVendor] = useState('Cisco IOS / XE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded max-w-md w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#f3f4f5]">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#0058be] text-[20px]">
              settings
            </span>
            <h2 className="text-sm font-semibold text-[#041627]">NetSage AI Diagnostic Engine Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#44474c] hover:text-[#041627] text-sm font-bold w-6 h-6 rounded flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-sans">
          {/* AI Model Selection */}
          <div>
            <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-70 mb-1 tracking-wider">
              REASONING MODEL BACKEND
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none rounded font-sans"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default - Fast TAC Engine)</option>
            </select>
          </div>

          {/* Network Vendor Syntax */}
          <div>
            <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-70 mb-1 tracking-wider">
              PRIMARY CLI VENDOR SYNTAX
            </label>
            <select
              value={tacVendor}
              onChange={(e) => setTacVendor(e.target.value)}
              className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none rounded font-sans"
            >
              <option value="Cisco IOS / XE">Cisco IOS / XE / NX-OS</option>
              <option value="Juniper JunOS">Juniper JunOS</option>
              <option value="Arista EOS">Arista EOS</option>
              <option value="Linux iproute2">Linux iproute2 / iptables</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-[#c4c6cd]/50">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-[#041627] block">Strict OSI Layer Classification</span>
                <span className="text-[11px] text-[#74777d]">Enforce Layer 1-7 root cause tagging</span>
              </div>
              <input
                type="checkbox"
                checked={strictOsiMode}
                onChange={(e) => setStrictOsiMode(e.target.checked)}
                className="w-4 h-4 text-[#0058be] rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-[#041627] block">Automated Python Rule Checker</span>
                <span className="text-[11px] text-[#74777d]">Audit duplicate IPs, VLANs & gateways</span>
              </div>
              <input
                type="checkbox"
                checked={autoRuleCheck}
                onChange={(e) => setAutoRuleCheck(e.target.checked)}
                className="w-4 h-4 text-[#0058be] rounded"
              />
            </label>
          </div>
        </div>

        <div className="p-3 border-t border-[#c4c6cd] bg-[#f8f9fa] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#041627] text-white text-xs font-semibold rounded hover:bg-[#1a2b3c]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
