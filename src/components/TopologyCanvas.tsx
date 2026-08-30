import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NetworkNode, DeviceType } from '../types/network';

interface TopologyCanvasProps {
  nodes: NetworkNode[];
  selectedNode: NetworkNode | null;
  onSelectNode: (node: NetworkNode) => void;
  onAddNode: (type: DeviceType, parentNodeId: string | null) => void;
  onDeleteNode: (nodeId: string) => void;
  onClearTopology: () => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onAutoLayout: () => void;
}

const DEVICE_TYPES: DeviceType[] = [
  'PC',
  'Server',
  'Switch (L2)',
  'Multilayer Switch (L3)',
  'Router',
  'DHCP Server',
  'DNS Server',
  'Access Point (Wireless)',
];

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onClearTopology,
  onUpdateNodePosition,
  onAutoLayout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number; parentId: string | null } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const [workspaceSize, setWorkspaceSize] = useState({ width: 1400, height: 820 });
  const shouldFitAfterLayout = useRef(false);
  const lastNodeCountRef = useRef(nodes.length);
  // Keep the drawing surface large enough for the actual graph. Presets set a
  // comfortable minimum, but must never crop a deep or wide topology.
  const canvasWidth = Math.max(workspaceSize.width, ...nodes.map((node) => node.x + 120));
  const canvasHeight = Math.max(workspaceSize.height, ...nodes.map((node) => node.y + 90));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#device-dropdown') && !(e.target as HTMLElement).closest('.add-btn')) {
        setDropdownPos(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const convertClientToWorld = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Handle Dragging
  const handleMouseDown = (node: NetworkNode, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const worldPos = convertClientToWorld(e.clientX, e.clientY);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: worldPos.x - node.x,
      y: worldPos.y - node.y,
    });
    onSelectNode(node);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.device-node, button, .dropdown-menu')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
      return;
    }

    if (!draggingNodeId || !containerRef.current) return;
    const worldPos = convertClientToWorld(e.clientX, e.clientY);
    const newX = clamp(worldPos.x - dragOffset.x, 80, workspaceSize.width - 80);
    const newY = clamp(worldPos.y - dragOffset.y, 60, workspaceSize.height - 60);
    onUpdateNodePosition(draggingNodeId, newX, newY);
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => clamp(Number((prev + direction).toFixed(2)), 0.5, 1.8));
  };

  const zoomIn = () => setZoom((prev) => clamp(Number((prev + 0.1).toFixed(2)), 0.5, 1.8));
  const zoomOut = () => setZoom((prev) => clamp(Number((prev - 0.1).toFixed(2)), 0.5, 1.8));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const fitTopology = useCallback(() => {
    const container = containerRef.current;
    if (!container || nodes.length === 0) return;

    const rect = container.getBoundingClientRect();
    const cardHalfWidth = 92;
    const cardHalfHeight = 58;
    const padding = 56;
    const minX = Math.min(...nodes.map((node) => node.x - cardHalfWidth));
    const maxX = Math.max(...nodes.map((node) => node.x + cardHalfWidth));
    const minY = Math.min(...nodes.map((node) => node.y - cardHalfHeight));
    const maxY = Math.max(...nodes.map((node) => node.y + cardHalfHeight));
    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);
    const nextZoom = clamp(Math.min((rect.width - padding * 2) / contentWidth, (rect.height - padding * 2) / contentHeight, 1.15), 0.35, 1.15);

    setZoom(Number(nextZoom.toFixed(2)));
    setPan({
      x: (rect.width - contentWidth * nextZoom) / 2 - minX * nextZoom,
      y: (rect.height - contentHeight * nextZoom) / 2 - minY * nextZoom,
    });
  }, [nodes]);

  useEffect(() => {
    if (nodes.length === 0) {
      lastNodeCountRef.current = 0;
      return;
    }

    const countChanged = nodes.length !== lastNodeCountRef.current;
    if (countChanged && !isPanning && !draggingNodeId) {
      lastNodeCountRef.current = nodes.length;
      requestAnimationFrame(fitTopology);
    } else if (countChanged) {
      lastNodeCountRef.current = nodes.length;
    }

    if (!shouldFitAfterLayout.current) return;
    shouldFitAfterLayout.current = false;
    requestAnimationFrame(fitTopology);
  }, [nodes, fitTopology, isPanning, draggingNodeId]);

  const handleAutoLayoutAndFit = () => {
    shouldFitAfterLayout.current = true;
    onAutoLayout();
  };

  const handleOpenDropdown = (e: React.MouseEvent, parentId: string | null) => {
    e.stopPropagation();
    const menuWidth = 208;
    const menuHeight = 280;
    const maxX = Math.max(12, window.innerWidth - menuWidth - 12);
    const maxY = Math.max(12, window.innerHeight - menuHeight - 12);

    setDropdownPos({
      x: clamp(e.clientX + 12, 12, maxX),
      y: clamp(e.clientY + 12, 12, maxY),
      parentId,
    });
  };

  const handleSelectDeviceType = (type: DeviceType) => {
    if (dropdownPos) {
      onAddNode(type, dropdownPos.parentId);
      setDropdownPos(null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-[#F8F9FA] select-none">
      {/* Canvas Area */}
      <div
        ref={containerRef}
        id="topology-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="h-full w-full relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* SVG Connector Lines */}
          <svg
            id="topology-lines-svg"
            className="absolute inset-0 pointer-events-none z-0 w-full h-full"
          >
          {nodes.map((node) => {
            if (!node.parentId) return null;
            const parent = nodes.find((n) => n.id === node.parentId);
            if (!parent) return null;

            const isProblemLink =
              (node.status === 'error' && parent.status === 'warning') ||
              node.status === 'down' ||
              parent.status === 'down';

            return (
              <g key={`line-${node.id}-${parent.id}`}>
                <line
                  x1={parent.x}
                  y1={parent.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={isProblemLink ? '#ba1a1a' : '#c4c6cd'}
                  strokeWidth={isProblemLink ? '2.5' : '2'}
                  strokeDasharray={isProblemLink ? '6 4' : undefined}
                />
                {/* Midpoint link label */}
                <circle
                  cx={(parent.x + node.x) / 2}
                  cy={(parent.y + node.y) / 2}
                  r="3.5"
                  fill={isProblemLink ? '#ba1a1a' : '#74777d'}
                />
              </g>
            );
          })}
          </svg>

          {/* Canvas Content */}
          <div id="canvas-content" className="absolute inset-0 z-10">
            {/* Node Elements */}
            {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const statusBarColor =
              node.status === 'healthy'
                ? 'bg-[#4edea3]'
                : node.status === 'warning'
                ? 'bg-[#eab308]'
                : 'bg-[#ba1a1a]';

            return (
              <div
                key={node.id}
                id={node.id}
                onClick={() => onSelectNode(node)}
                onMouseDown={(e) => handleMouseDown(node, e)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute w-40 bg-white border transition-all shadow-xs flex flex-col cursor-pointer device-node group rounded select-none ${
                  isSelected
                    ? 'border-[#0058be] ring-2 ring-[#0058be]/20 shadow-md z-30'
                    : 'border-[#74777d]/40 hover:border-[#0058be] z-20'
                }`}
              >
                {/* Top Status Bar */}
                <div className={`h-1.5 ${statusBarColor} w-full rounded-t`} />

                {/* Card Body */}
                <div className="p-3 text-center pb-8 relative">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-[#191c1d] truncate flex-1 text-center device-name">
                      {node.name}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-[#44474c] opacity-80 device-type-label">
                    {node.type}
                  </div>

                  <div className="font-mono text-[10px] text-[#0058be] font-medium mt-0.5 tracking-tight">
                    {node.ip || 'Unassigned'}
                  </div>

                  {/* Center Add Button for Child Node */}
                  <button
                    onClick={(e) => handleOpenDropdown(e, node.id)}
                    className="add-btn add-btn-center absolute left-1/2 bottom-2 -translate-x-1/2 w-6 h-6 bg-white border border-[#74777d]/60 rounded-full flex items-center justify-center hover:border-[#0058be] hover:bg-[#f3f4f5] opacity-0 group-hover:opacity-100 transition-all shadow-2xs active:scale-95"
                    title={`Connect a device to ${node.name}`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#0058be]">
                      add
                    </span>
                  </button>

                  {/* Delete Button on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                    className="absolute top-2 right-2 w-4 h-4 rounded-full text-[#ba1a1a] opacity-0 group-hover:opacity-100 hover:bg-[#ffdad6] flex items-center justify-center transition-opacity text-[12px]"
                    title="Remove device"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Empty state belongs to the visible viewport, not the larger virtual workspace. */}
        {nodes.length === 0 && (
          <div id="canvas-center" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <button
              id="initial-add-btn"
              onClick={(e) => handleOpenDropdown(e, null)}
              className="pointer-events-auto w-12 h-12 bg-white border border-[#74777d]/60 hover:border-[#0058be] hover:shadow-md flex items-center justify-center transition-all rounded-full add-btn active:scale-95 group"
              title="Add Root Network Device"
            >
              <span className="material-symbols-outlined text-[#0058be] group-hover:scale-110 transition-transform">add</span>
            </button>
            <div className="text-xs text-[#44474c] font-medium tracking-wide">Add a root gateway or switch to begin</div>
          </div>
        )}

        {/* Device Type Dropdown Menu */}
        {dropdownPos && (
          <div
            id="device-dropdown"
            style={{
              position: 'fixed',
              left: `${dropdownPos.x}px`,
              top: `${dropdownPos.y}px`,
            }}
            className="bg-white border border-[#c4c6cd] shadow-xl py-1.5 w-52 z-[60] rounded text-xs font-medium dropdown-menu animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#44474c] opacity-70 border-b border-[#c4c6cd]/40 mb-1">
              Select Device Type
            </div>
            {DEVICE_TYPES.map((type) => (
              <button
                key={type}
                data-type={type}
                onClick={() => handleSelectDeviceType(type)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#f3f4f5] hover:text-[#0058be] text-[#191c1d] flex items-center justify-between group transition-colors"
              >
                <span>{type}</span>
                <span className="material-symbols-outlined text-[14px] text-[#8192a7] group-hover:text-[#0058be]">
                  add
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Controls Toolbar */}
      <div className="h-12 bg-white border-t border-[#c4c6cd] flex items-center justify-between px-4 z-20 shrink-0 select-none">
        {/* Left Toolbar Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 border-r border-[#c4c6cd] pr-3 mr-1">
            <button
              onClick={handleAutoLayoutAndFit}
              className="px-2.5 py-1 text-xs bg-[#f3f4f5] hover:bg-[#edeeef] text-[#191c1d] rounded border border-[#c4c6cd] flex items-center gap-1"
              title="Auto arrange topology nodes"
            >
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              Auto Align
            </button>
            <button
              onClick={(event) => handleOpenDropdown(event, null)}
              className="add-btn px-2.5 py-1 text-xs bg-[#0058be] hover:bg-[#004bb0] text-white rounded flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Device
            </button>
          </div>

          <div className="flex items-center gap-1.5 border border-[#c4c6cd] rounded-md bg-[#f3f4f5] p-0.5">
            <button onClick={zoomOut} className="w-7 h-7 text-sm rounded-md text-[#191c1d] hover:bg-white transition-colors">−</button>
            <div className="min-w-[52px] text-center font-mono text-[10px] font-semibold text-[#44474c] bg-white rounded px-2 py-1 border border-[#dfe1e5]">
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={zoomIn} className="w-7 h-7 text-sm rounded-md text-[#191c1d] hover:bg-white transition-colors">+</button>
            <button onClick={resetView} className="px-2.5 py-1 text-[10px] rounded-md text-[#0058be] font-semibold hover:bg-white transition-colors">
              Reset
            </button>
            <button onClick={fitTopology} className="px-2 py-1 text-[10px] rounded-md text-[#0058be] font-semibold hover:bg-white transition-colors" title="Fit all devices into view">
              Fit
            </button>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center space-x-3">
          <div className="font-mono text-[11px] text-[#44474c] opacity-60">
            {nodes.length} Device{nodes.length === 1 ? '' : 's'} Active
          </div>
          <button
            id="btn-clear-topology"
            onClick={onClearTopology}
            className="px-3 py-1 bg-[#edeeef] text-[#ba1a1a] text-xs font-semibold border border-[#ba1a1a] hover:bg-[#ffdad6] active:scale-98 transition-colors rounded"
          >
            Clear Topology
          </button>
        </div>
      </div>
    </div>
  );
};
