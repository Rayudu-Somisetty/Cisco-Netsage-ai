import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: { id: string; name: string; interfaces: { name: string; status: string }[] }[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  nodes,
}) => {
  if (!isOpen) return null;

  const alerts = nodes.flatMap((node) => node.interfaces.filter((intf) => intf.status === 'DOWN').map((intf) => ({ id: `${node.id}-${intf.name}`, title: `${node.name}: ${intf.name} is DOWN`, desc: 'Current topology state reports this interface is down.', time: 'Current state', severity: 'high' })));

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded max-w-md w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#f3f4f5]">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#0058be] text-[20px]">
              notifications
            </span>
            <h2 className="text-sm font-semibold text-[#041627]">System Alerts & Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#44474c] hover:text-[#041627] text-sm font-bold w-6 h-6 rounded flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded border text-xs ${
                a.severity === 'high'
                  ? 'bg-[#ffdad6]/20 border-[#ba1a1a]/40 text-[#191c1d]'
                  : 'bg-[#f8f9fa] border-[#c4c6cd] text-[#191c1d]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-[#041627] flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      a.severity === 'high' ? 'bg-[#ba1a1a]' : 'bg-[#0058be]'
                    }`}
                  />
                  {a.title}
                </span>
                <span className="font-mono text-[10px] text-[#74777d]">{a.time}</span>
              </div>
              <p className="text-[11px] text-[#44474c] leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#c4c6cd] bg-[#f8f9fa] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#041627] text-white text-xs font-semibold rounded hover:bg-[#1a2b3c]"
          >
            Acknowledge All
          </button>
        </div>
      </div>
    </div>
  );
};
