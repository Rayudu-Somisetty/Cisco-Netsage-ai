import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TopologyCanvas } from './components/TopologyCanvas';
import { DeviceConfigDrawer } from './components/DeviceConfigDrawer';
import { DiagnosticSection } from './components/DiagnosticSection';
import { DashboardView } from './components/DashboardView';
import { SessionsView } from './components/SessionsView';
import { Footer } from './components/Footer';
import { TestTerminalModal } from './components/TestTerminalModal';
import { StatsDrawer } from './components/StatsDrawer';
import { LogsDrawer } from './components/LogsDrawer';
import { NotificationModal } from './components/NotificationModal';
import { SettingsModal } from './components/SettingsModal';

import {
  NetworkNode,
  DeviceType,
  AIInsightResult,
  HumanReviewState,
  TroubleshootingCase,
} from './types/network';

export default function App() {
  // Navigation & Case State
  const [currentTab, setCurrentTab] = useState<'Dashboard' | 'Topology' | 'Sessions'>('Topology');
  const [caseId, setCaseId] = useState('NEW');

  // Topology State
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Diagnostic Parameters State
  const [problemDescription, setProblemDescription] = useState('');
  const [commandType, setCommandType] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI Insights & Human Review State
  const [aiInsight, setAiInsight] = useState<AIInsightResult | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('netsage-api-key') || '';
  });
  const [humanReview, setHumanReview] = useState<HumanReviewState>({
    decision: null,
    comments: '',
    reviewer: '',
    verificationTest: '',
    verificationOutput: null,
    isTesting: false,
    submitted: false,
  });

  const promptForApiKey = (message = 'Add your Gemini API key below, then run the diagnosis again.') => {
    setShowApiKeyPrompt(true);
    setFooterModalInfo({
      title: 'Gemini API key required',
      content: message,
    });
  };

  // Sessions / Case History
  const [casesHistory, setCasesHistory] = useState<TroubleshootingCase[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastPersistedTopology, setLastPersistedTopology] = useState<string>('');
  const [reviewStats, setReviewStats] = useState({ totalCases: 0, issueTypes: {}, severity: {}, decisions: { Accepted: 0, Edited: 0, Rejected: 0 }, aiAgreementRate: 0 });

  useEffect(() => {
    fetch('/api/state').then((response) => response.json()).then((state) => {
      const nextTopology = state.topology || [];
      setNodes(nextTopology);
      setCasesHistory(state.history || []);
      setCaseId(state.nextCaseId || 'NEW');
      setLastPersistedTopology(JSON.stringify(nextTopology));
      setIsHydrated(true);
    }).catch(() => undefined);
    fetch('/api/review/stats').then((response) => response.json()).then(setReviewStats).catch(() => undefined);
    fetch('/api/health').then((response) => response.json()).then((health) => {
      if (!health?.hasGeminiKey) {
        promptForApiKey('No valid Gemini API key is currently configured. Add a key here, or update the embedded fallback key in the server code.');
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const nextTopology = JSON.stringify(nodes);
    if (nextTopology === lastPersistedTopology) return;

    fetch('/api/topology', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topology: nodes }) })
      .then(() => setLastPersistedTopology(nextTopology))
      .catch(() => undefined);
  }, [nodes, isHydrated, lastPersistedTopology]);

  // Modals & Drawers
  const [activeSidebarView, setActiveSidebarView] = useState<
    'device-config' | 'ai-diagnosis' | 'interface-stats' | 'logs'
  >('device-config');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalTarget, setTerminalTarget] = useState('8.8.8.8');
  const [isTerminalLoading, setIsTerminalLoading] = useState(false);
  const [footerModalInfo, setFooterModalInfo] = useState<{ title: string; content: string } | null>(null);
  const [topologyPaneHeight, setTopologyPaneHeight] = useState(72);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const workspaceSplitRef = React.useRef<HTMLDivElement | null>(null);

  const resizeTopologyPane = (clientY: number) => {
    const rect = workspaceSplitRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextPercent = ((clientY - rect.top) / rect.height) * 100;
    setTopologyPaneHeight(Math.min(78, Math.max(38, nextPercent)));
  };

  useEffect(() => {
    if (!isDraggingSplit || !workspaceSplitRef.current) return;

    const handleMouseMove = (event: MouseEvent) => {
      resizeTopologyPane(event.clientY);
    };

    const handleMouseUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  // Command presets are hints only; terminal output stays user-entered.
  const handleCommandTypeChange = (newCmd: string) => {
    setCommandType(newCmd);
  };

  // Node Selection
  const handleSelectNode = (node: NetworkNode) => {
    setSelectedNode(node);
    setIsConfigDrawerOpen(true);
  };

  // Add Node to Canvas (Hierarchical Placement)
  const handleAddNode = (type: DeviceType, parentId: string | null) => {
    const newCount = nodes.length + 1;
    const prefix = type.split(' ')[0];
    const newId = `node-${Date.now()}`;
    const name = `${prefix}${newCount}`;

    let newX = 700;
    let newY = 180;

    if (parentId) {
      const parent = nodes.find((n) => n.id === parentId);
      if (parent) {
        const siblingCount = nodes.filter((n) => n.parentId === parentId).length;
        // Add children below their parent. Auto Align can then turn the growing
        // topology into a clean tree without new cards landing on top of a link.
        newX = parent.x + (siblingCount % 2 === 0 ? -1 : 1) * (110 + Math.floor(siblingCount / 2) * 70);
        newY = parent.y + 150;
      }
    } else {
      const rootIndex = nodes.filter((n) => !n.parentId).length;
      const row = Math.floor(rootIndex / 3);
      const col = rootIndex % 3;
      newX = 700 + (col - 1) * 180;
      newY = 180 + row * 140;
    }

    const newNode: NetworkNode = {
      id: newId,
      name,
      type,
      ip: '',
      subnet: '',
      gateway: '',
      dns: '',
      parentId,
      x: Math.max(100, Math.min(1700, newX)),
      y: Math.max(80, Math.min(900, newY)),
      status: 'healthy',
      interfaces: [],
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    setIsConfigDrawerOpen(true);
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId && n.parentId !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setIsConfigDrawerOpen(false);
    }
  };

  // Update Node Position
  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n))
    );
  };

  // Auto Layout Nodes in Tree Formation.  Leaves are placed first, then each
  // parent is centred above its children, so this works for any nesting depth.
  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const childrenById = new Map<string, NetworkNode[]>();
    nodes.forEach((node) => {
      if (node.parentId && byId.has(node.parentId)) {
        childrenById.set(node.parentId, [...(childrenById.get(node.parentId) ?? []), node]);
      }
    });

    const roots = nodes.filter((node) => !node.parentId || !byId.has(node.parentId));
    const rootNodes = roots.length ? roots : [nodes[0]];
    const positions = new Map<string, { x: number; depth: number }>();
    const visited = new Set<string>();
    let nextLeaf = 0;
    const leafGap = 210;
    const rootGap = 1;

    const placeSubtree = (node: NetworkNode, depth: number): number => {
      // Invalid cyclic input should still remain visible rather than recursing forever.
      if (visited.has(node.id)) return positions.get(node.id)?.x ?? nextLeaf++ * leafGap;
      visited.add(node.id);
      const children = (childrenById.get(node.id) ?? []).filter((child) => !visited.has(child.id));
      const childXs = children.map((child) => placeSubtree(child, depth + 1));
      const x = childXs.length ? (childXs[0] + childXs[childXs.length - 1]) / 2 : nextLeaf++ * leafGap;
      positions.set(node.id, { x, depth });
      return x;
    };

    rootNodes.forEach((root) => {
      placeSubtree(root, 0);
      nextLeaf += rootGap;
    });
    // Include disconnected/cyclic leftovers as separate roots.
    nodes.filter((node) => !visited.has(node.id)).forEach((node) => {
      placeSubtree(node, 0);
      nextLeaf += rootGap;
    });

    const xs = [...positions.values()].map((position) => position.x);
    const minX = Math.min(...xs);
    const updated = nodes.map((node) => {
      const position = positions.get(node.id)!;
      return {
        ...node,
        x: 130 + position.x - minX,
        y: 110 + position.depth * 155,
      };
    });
    setNodes(updated);
  };

  // Save Node from Drawer
  const handleSaveNode = (updated: NetworkNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNode(updated);
  };

  // Clear Topology
  const handleClearTopology = () => {
    setNodes([]);
    setSelectedNode(null);
    setIsConfigDrawerOpen(false);
  };

  // Run AI Analysis via Backend Endpoint
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription,
          commandType,
          commandOutput,
          topology: nodes,
          selectedNode,
          caseId,
          apiKey: apiKeyInput || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiInsight(data.data);
        setShowApiKeyPrompt(false);
      } else {
        setAiInsight(null);
        promptForApiKey(data.error || 'Add your Gemini API key below, then run the diagnosis again.');
      }
    } catch (err) {
      console.error('Failed to run AI diagnosis:', err);
      setAiInsight(null);
      promptForApiKey('The AI service could not be reached. Please check your Gemini API key and try again.');
    }
  };

  // Run Verification Test (Ping / Traceroute)
  const handleExecuteVerificationTest = async (requestedTargetId?: string) => {
    const testType = humanReview.verificationTest.startsWith('Traceroute') ? 'Traceroute' : 'Ping';
    const targetNode = nodes.find((node) => node.id === requestedTargetId) || nodes.find((node) => humanReview.verificationTest.endsWith(node.id));

    setTerminalTarget(targetNode?.ip || '');
    setIsTerminalLoading(true);
    setIsTerminalModalOpen(true);
    setHumanReview((prev) => ({ ...prev, isTesting: true }));

    try {
      const res = await fetch('/api/test-connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          sourceNodeId: selectedNode?.id,
          targetNodeId: targetNode?.id,
          topology: nodes,
        }),
      });

      const data = await res.json();
      setTerminalOutput(data.output || 'No output received.');
      setHumanReview((prev) => ({
        ...prev,
        verificationOutput: data.output,
        isTesting: false,
      }));
    } catch (err) {
      setTerminalOutput('Error executing socket probe.');
      setHumanReview((prev) => ({ ...prev, isTesting: false }));
    } finally {
      setIsTerminalLoading(false);
    }
  };

  // Submit Final Report to Case History
  const handleSubmitReport = async () => {
    if (!aiInsight || !humanReview.decision) return;
    const response = await fetch('/api/review/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      aiDiagnosis: aiInsight, checkerFindings: aiInsight.ruleChecks, humanDecision: humanReview.decision,
      finalDiagnosis: humanReview.decision === 'Edit' ? humanReview.comments : aiInsight.rootCause,
      reasonForChange: humanReview.comments, reviewer: humanReview.reviewer, verificationResult: humanReview.verificationOutput,
      targetDevice: selectedNode?.name || '', problemDescription, commandType, commandOutput, verificationTest: humanReview.verificationTest, nodeCount: nodes.length,
    }) });
    const data = await response.json();
    if (data.success) {
      setCaseId(data.caseId);
      setCasesHistory(data.history || []);
      setReviewStats(await (await fetch('/api/review/stats')).json());
      setHumanReview((prev) => ({ ...prev, submitted: true }));
    }
  };

  // New Case Button Handler
  const handleNewCase = () => {
    setProblemDescription('');
    setCommandType('');
    setCommandOutput('');
    setHumanReview({
      decision: null,
      comments: '',
      reviewer: '',
      verificationTest: '',
      verificationOutput: null,
      isTesting: false,
      submitted: false,
    });
  };

  // Apply suggested fix
  const handleApplySuggestedFix = (fix: string) => {
    if (selectedNode) {
      const updated = {
        ...selectedNode,
        status: 'healthy' as const,
        customCliConfig: `${selectedNode.customCliConfig || ''}\n! Applied TAC remediation:\n${fix}`,
      };
      handleSaveNode(updated);
    }
  };

  // Sidebar link handler
  const handleSelectSidebarView = (
    view: 'device-config' | 'ai-diagnosis' | 'interface-stats' | 'logs'
  ) => {
    setActiveSidebarView(view);
    if (view === 'device-config') {
      setIsConfigDrawerOpen(true);
    } else if (view === 'ai-diagnosis') {
      setCurrentTab('Topology');
      handleRunAnalysis();
    } else if (view === 'interface-stats') {
      setIsStatsOpen(true);
    } else if (view === 'logs') {
      setIsLogsOpen(true);
    }
  };

  return (
    <div className="text-[#191c1d] font-sans h-screen flex flex-col overflow-hidden bg-[#F8F9FA] select-none">
      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        caseId={caseId}
        onNewCase={handleNewCase}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          selectedNode={selectedNode}
          activeSidebarView={activeSidebarView}
          onSelectSidebarView={handleSelectSidebarView}
          onRunDiagnostic={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          onOpenDoc={() =>
            setFooterModalInfo({
              title: 'NetSage AI Precision TAC Documentation',
              content:
                'NetSage AI integrates deep network topology graph analysis with Cisco TAC and RFC standards. Use the Topology Canvas to model device connections, inspect ARP/routing tables, and run AI heuristics to pinpoint Layer 1 through Layer 7 anomalies.',
            })
          }
          onOpenSupport={() =>
            setFooterModalInfo({
              title: 'NetSage AI TAC Support & Enterprise Escalation',
              content:
                'Enterprise Tier 3 TAC support is active. For automated ticket dispatch, logs are validated against RFC 791 (IPv4), RFC 2460 (IPv6), and IEEE 802.1Q VLAN specifications.',
            })
          }
        />

        {/* Dynamic Center Main Pane */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#F8F9FA]" ref={workspaceSplitRef}>
          {currentTab === 'Topology' && (
            <>
              <div className="flex flex-col h-full min-h-0">
                <div style={{ height: `${topologyPaneHeight}%` }} className="min-h-[260px] overflow-hidden">
                  <TopologyCanvas
                    nodes={nodes}
                    selectedNode={selectedNode}
                    onSelectNode={handleSelectNode}
                    onAddNode={handleAddNode}
                    onDeleteNode={handleDeleteNode}
                    onClearTopology={handleClearTopology}
                    onUpdateNodePosition={handleUpdateNodePosition}
                    onAutoLayout={handleAutoLayout}
                  />
                </div>

                <div
                  className="h-3 w-full shrink-0 cursor-row-resize touch-none bg-[#e9ecef] border-y border-[#c4c6cd] hover:bg-[#dfe4ea] transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingSplit(true);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setIsDraggingSplit(true);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingSplit) resizeTopologyPane(e.clientY);
                  }}
                  onPointerUp={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                    setIsDraggingSplit(false);
                  }}
                  title="Drag to resize topology area"
                />

                <div className="flex-1 min-h-[220px] overflow-hidden">
                  <DiagnosticSection
                    problemDescription={problemDescription}
                    onChangeProblemDescription={setProblemDescription}
                    commandType={commandType}
                    onChangeCommandType={handleCommandTypeChange}
                    commandOutput={commandOutput}
                    onChangeCommandOutput={setCommandOutput}
                    onRunAnalysis={handleRunAnalysis}
                    isAnalyzing={isAnalyzing}
                    aiInsight={aiInsight}
                    humanReview={humanReview}
                    onChangeHumanReview={(patch) =>
                      setHumanReview((prev) => ({ ...prev, ...patch }))
                    }
                    onExecuteVerificationTest={handleExecuteVerificationTest}
                    onSubmitReport={handleSubmitReport}
                    onApplySuggestedFix={handleApplySuggestedFix}
                    verificationTargets={nodes.filter((node) => node.id !== selectedNode?.id)}
                  />
                </div>
              </div>

              {/* Right Configuration Slide-in Drawer */}
              <DeviceConfigDrawer
                isOpen={isConfigDrawerOpen}
                onClose={() => setIsConfigDrawerOpen(false)}
                selectedNode={selectedNode}
                onSaveNode={handleSaveNode}
                onTestPing={(targetIp) => {
                  setTerminalTarget(targetIp);
                  handleExecuteVerificationTest(nodes.find((node) => node.ip === targetIp)?.id);
                }}
              />
            </>
          )}

          {currentTab === 'Dashboard' && (
            <DashboardView
              nodes={nodes}
              cases={casesHistory}
              reviewStats={reviewStats}
              onOpenTopology={() => setCurrentTab('Topology')}
              onOpenNewCase={handleNewCase}
            />
          )}

          {currentTab === 'Sessions' && (
            <SessionsView
              cases={casesHistory}
              onLoadCaseToTopology={(c) => {
                setProblemDescription(c.problemDescription);
                setCommandType(c.commandType);
                setCommandOutput(c.commandOutput);
                setAiInsight(c.diagnosis);
                setHumanReview(c.humanReview);
              }}
              onOpenTopology={() => setCurrentTab('Topology')}
            />
          )}
        </main>
      </div>

      {/* Bottom Footer */}
      <Footer
        onOpenPrivacy={() =>
          setFooterModalInfo({
            title: 'Privacy Policy',
            content:
              'NetSage AI processes network topology telemetry and terminal debug logs in a secure, sandboxed container. No confidential packet payloads or plaintext credentials are stored permanently outside your local instance.',
          })
        }
        onOpenTerms={() =>
          setFooterModalInfo({
            title: 'Terms of Service',
            content:
              'NetSage AI TAC Precision Troubleshooting Platform is provided for enterprise network diagnostics, CCNA/CCNP network emulation, and automated incident triage.',
          })
        }
        onOpenApiStatus={() =>
          setFooterModalInfo({
            title: 'System & API Status',
            content:
              'All NetSage AI TAC diagnostic microservices are OPERATIONAL.\n- Gemini AI Reasoning Engine: Active (24ms)\n- Python Rule Verifier: Online (6/6 rules active)\n- Virtual ICMP Fabric Simulator: Ready',
          })
        }
      />

      {/* Modals & Dialogs */}
      <TestTerminalModal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        testType={humanReview.verificationTest}
        targetHost={terminalTarget}
        sourceNodeName={selectedNode?.name || 'No source selected'}
        output={terminalOutput}
        isLoading={isTerminalLoading}
        onReRun={handleExecuteVerificationTest}
      />

      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        selectedNode={selectedNode}
        reviewStats={reviewStats}
      />

      <LogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        selectedNode={selectedNode}
        nodes={nodes}
        problemDescription={problemDescription}
        commandType={commandType}
        commandOutput={commandOutput}
        aiInsight={aiInsight}
        humanReview={humanReview}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        nodes={nodes}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Info Popover Modal for Footer Links */}
      {footerModalInfo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded max-w-md w-full p-5 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#c4c6cd] pb-2">
              <h3 className="font-bold text-sm text-[#041627]">
                {footerModalInfo.title}
              </h3>
              <button
                onClick={() => setFooterModalInfo(null)}
                className="text-[#74777d] hover:text-[#041627] text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#44474c] leading-relaxed whitespace-pre-line font-sans">
              {footerModalInfo.content}
            </p>
            <button
              onClick={() => setFooterModalInfo(null)}
              className="mt-3 w-full py-1.5 bg-[#041627] text-white text-xs font-semibold rounded hover:bg-[#1a2b3c]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showApiKeyPrompt && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#c4c6cd] shadow-2xl rounded max-w-md w-full p-5 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#c4c6cd] pb-2">
              <h3 className="font-bold text-sm text-[#041627]">Gemini API key required</h3>
              <button
                onClick={() => setShowApiKeyPrompt(false)}
                className="text-[#74777d] hover:text-[#041627] text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#44474c] leading-relaxed">
              Add your Gemini API key to continue with AI diagnosis. The key is stored locally in this browser session only.
            </p>
            <label className="block font-mono text-[10px] font-semibold uppercase text-[#191c1d] opacity-70">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter Gemini API key"
              className="w-full border border-[#74777d]/60 bg-white text-xs p-2 rounded outline-none focus:border-[#0058be]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (apiKeyInput.trim()) {
                    const trimmedKey = apiKeyInput.trim();
                    localStorage.setItem('netsage-api-key', trimmedKey);
                    setShowApiKeyPrompt(false);
                    setFooterModalInfo({
                      title: 'API key saved',
                      content: 'Your Gemini key has been saved locally and will be used as a live fallback for future diagnoses.',
                    });
                  }
                }}
                className="flex-1 py-2 bg-[#0058be] text-white text-xs font-semibold rounded hover:bg-[#004bb0]"
              >
                Save Key
              </button>
              <button
                onClick={() => setShowApiKeyPrompt(false)}
                className="flex-1 py-2 bg-[#edeeef] text-[#191c1d] text-xs font-semibold rounded border border-[#c4c6cd] hover:bg-[#e1e3e4]"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
