import React, { useState, useEffect } from 'react';
import { NetworkNode, DeviceType, DeviceStatus } from '../types/network';

interface DeviceConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: NetworkNode | null;
  onSaveNode: (updatedNode: NetworkNode) => void;
  onTestPing: (targetIp: string) => void;
}

export const DeviceConfigDrawer: React.FC<DeviceConfigDrawerProps> = ({
  isOpen,
  onClose,
  selectedNode,
  onSaveNode,
  onTestPing,
}) => {
  const [formData, setFormData] = useState<NetworkNode | null>(null);
  const [isSavedBanner, setIsSavedBanner] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setFormData(JSON.parse(JSON.stringify(selectedNode)));
    }
  }, [selectedNode]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof NetworkNode, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleInterfaceChange = (index: number, field: string, value: any) => {
    if (!formData) return;
    const newIfs = [...formData.interfaces];
    newIfs[index] = { ...newIfs[index], [field]: value };
    setFormData({ ...formData, interfaces: newIfs });
  };

  const handleAddInterface = () => {
    if (!formData) return;
    const newIfs = [
      ...formData.interfaces,
      {
        name: `Gi0/${formData.interfaces.length + 1}`,
        status: 'UP' as const,
        vlan: '1',
        mode: 'Access' as const,
      },
    ];
    setFormData({ ...formData, interfaces: newIfs });
  };

  const handleSave = () => {
    if (formData) {
      onSaveNode(formData);
      setIsSavedBanner(true);
      setTimeout(() => setIsSavedBanner(false), 2000);
    }
  };

  const isSwitchOrRouter =
    formData.type.includes('Switch') || formData.type.includes('Router');
  const isSwitch = formData.type.includes('Switch');
  const isDhcp = formData.type === 'DHCP Server';
  const isAp = formData.type === 'Access Point (Wireless)';

  return (
    <aside
      id="config-panel"
      className="absolute top-0 right-0 w-84 h-full bg-white border-l border-[#c4c6cd] shadow-2xl z-40 flex flex-col transition-all animate-in slide-in-from-right duration-200 select-none"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#f3f4f5] shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0058be]"></span>
          <h2 className="text-sm font-semibold text-[#041627]">Device Properties</h2>
        </div>
        <button
          id="close-panel-btn"
          onClick={onClose}
          className="text-[#44474c] hover:text-[#041627] hover:bg-[#e1e3e4] w-6 h-6 rounded flex items-center justify-center transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {isSavedBanner && (
        <div className="bg-[#4edea3]/20 border-b border-[#4edea3] text-[#002113] text-xs px-4 py-1.5 font-medium flex items-center justify-between animate-fade-in">
          <span>Configuration saved successfully</span>
          <span className="material-symbols-outlined text-xs">check_circle</span>
        </div>
      )}

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs" id="config-form-fields">
        {/* Device Name */}
        <div>
          <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
            DEVICE NAME
          </label>
          <input
            type="text"
            className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none rounded font-sans"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        {/* Device Type & Status */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
              TYPE
            </label>
            <input
              type="text"
              disabled
              className="w-full bg-[#f3f4f5] border border-[#c4c6cd] text-xs p-2 text-[#44474c] rounded font-mono"
              value={formData.type}
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
              NODE STATUS
            </label>
            <select
              className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none rounded font-sans"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as DeviceStatus)}
            >
              <option value="healthy">Healthy (Green)</option>
              <option value="warning">Warning (Yellow)</option>
              <option value="error">Error / Down (Red)</option>
            </select>
          </div>
        </div>

        {/* IP Address */}
        <div>
          <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
            IP ADDRESS
          </label>
          <input
            type="text"
            className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none font-mono rounded"
            placeholder="e.g. 192.168.1.1"
            value={formData.ip}
            onChange={(e) => handleChange('ip', e.target.value)}
          />
        </div>

        {/* Subnet Mask */}
        <div>
          <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
            SUBNET MASK
          </label>
          <input
            type="text"
            className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none font-mono rounded"
            placeholder="255.255.255.0"
            value={formData.subnet}
            onChange={(e) => handleChange('subnet', e.target.value)}
          />
        </div>

        {/* Default Gateway */}
        <div>
          <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
            DEFAULT GATEWAY
          </label>
          <input
            type="text"
            className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none font-mono rounded"
            placeholder="192.168.1.254"
            value={formData.gateway}
            onChange={(e) => handleChange('gateway', e.target.value)}
          />
        </div>

        {/* DNS Server */}
        <div>
          <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
            DNS SERVER
          </label>
          <input
            type="text"
            className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none font-mono rounded"
            placeholder="8.8.8.8"
            value={formData.dns}
            onChange={(e) => handleChange('dns', e.target.value)}
          />
        </div>

        {/* Switch / Router Interface Config */}
        {isSwitchOrRouter && (
          <div className="pt-3 border-t border-[#c4c6cd]">
            <div className="flex justify-between items-center mb-2">
              <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 tracking-wider">
                INTERFACE CONFIG
              </label>
              <button
                type="button"
                onClick={handleAddInterface}
                className="text-[11px] text-[#0058be] hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-xs">add</span> Add Port
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {formData.interfaces?.map((intf, idx) => (
                <div key={idx} className="flex space-x-1.5 items-center">
                  <input
                    type="text"
                    placeholder="Port/If"
                    className="w-1/3 bg-white border border-[#74777d]/60 p-1 text-[11px] font-mono rounded"
                    value={intf.name}
                    onChange={(e) => handleInterfaceChange(idx, 'name', e.target.value)}
                  />
                  <select
                    className={`w-1/3 border p-1 text-[11px] font-medium rounded ${
                      intf.status === 'UP'
                        ? 'border-[#4edea3] text-[#00a572] bg-[#f8f9fa]'
                        : 'border-[#ba1a1a] text-[#ba1a1a] bg-[#ffdad6]/20'
                    }`}
                    value={intf.status}
                    onChange={(e) => handleInterfaceChange(idx, 'status', e.target.value)}
                  >
                    <option value="UP">UP</option>
                    <option value="DOWN">DOWN</option>
                  </select>
                  <input
                    type="text"
                    placeholder="VLAN"
                    className="w-1/3 bg-white border border-[#74777d]/60 p-1 text-[11px] font-mono rounded"
                    value={intf.vlan}
                    onChange={(e) => handleInterfaceChange(idx, 'vlan', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Port Mode for Switch */}
        {isSwitch && (
          <div>
            <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
              DEFAULT PORT MODE
            </label>
            <select className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none rounded">
              <option>Access</option>
              <option>Trunk (802.1Q)</option>
              <option>Dynamic Auto</option>
            </select>
          </div>
        )}

        {/* DHCP Server Specific */}
        {isDhcp && (
          <div className="pt-3 border-t border-[#c4c6cd] space-y-3">
            <div>
              <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
                POOL NETWORK
              </label>
              <input
                type="text"
                className="w-full bg-white border border-[#74777d]/60 p-2 text-xs font-mono rounded"
                defaultValue={formData.dhcpConfig?.poolNetwork || '192.168.1.0 255.255.255.0'}
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
                EXCLUDED ADDRESSES
              </label>
              <input
                type="text"
                className="w-full bg-white border border-[#74777d]/60 p-2 text-xs font-mono rounded"
                defaultValue={formData.dhcpConfig?.excluded || '192.168.1.1 192.168.1.10'}
              />
            </div>
          </div>
        )}

        {/* Wireless AP Specific */}
        {isAp && (
          <div className="pt-3 border-t border-[#c4c6cd] space-y-3">
            <div>
              <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
                SSID
              </label>
              <input
                type="text"
                className="w-full bg-white border border-[#74777d]/60 p-2 text-xs rounded"
                defaultValue={formData.apConfig?.ssid || 'Corporate_WiFi'}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
                  SECURITY
                </label>
                <select className="w-full bg-white border border-[#74777d]/60 p-2 text-xs rounded">
                  <option>WPA2-PSK</option>
                  <option>WPA3-Enterprise</option>
                  <option>Open</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
                  VLAN MAPPING
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-[#74777d]/60 p-2 text-xs rounded font-mono"
                  defaultValue={formData.apConfig?.vlan || 'VLAN 20'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="pt-3 border-t border-[#c4c6cd]">
          <label className="block font-mono text-[11px] font-semibold text-[#191c1d] opacity-60 mb-1 tracking-wider">
            NOTES
          </label>
          <textarea
            className="w-full bg-white border border-[#74777d]/60 text-xs p-2 focus:border-[#0058be] outline-none resize-none h-16 rounded font-sans"
            placeholder="Configuration notes or VLAN membership details..."
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-[#c4c6cd] bg-white mt-auto shrink-0 space-y-2">
        <button
          onClick={() => onTestPing(formData.ip || formData.gateway)}
          className="w-full bg-[#f3f4f5] text-[#191c1d] border border-[#c4c6cd] hover:bg-[#edeeef] py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">network_check</span>
          Test Node Connectivity
        </button>
        <button
          id="btn-save-config"
          onClick={handleSave}
          className="w-full bg-[#0058be] text-white hover:bg-[#004bb0] py-2 text-xs font-semibold rounded transition-colors shadow-xs"
        >
          Save Configuration
        </button>
      </div>
    </aside>
  );
};
