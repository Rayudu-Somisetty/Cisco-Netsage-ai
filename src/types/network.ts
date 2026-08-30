export type DeviceType =
  | 'PC'
  | 'Server'
  | 'Switch (L2)'
  | 'Multilayer Switch (L3)'
  | 'Router'
  | 'DHCP Server'
  | 'DNS Server'
  | 'Access Point (Wireless)';

export type DeviceStatus = 'healthy' | 'warning' | 'error' | 'down';

export interface NetworkInterface {
  name: string;
  status: 'UP' | 'DOWN';
  vlan: string;
  mode?: 'Access' | 'Trunk';
  speed?: string;
  duplex?: 'Full' | 'Half' | 'Auto';
}

export interface NetworkNode {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  subnet: string;
  gateway: string;
  dns: string;
  parentId: string | null;
  x: number;
  y: number;
  status: DeviceStatus;
  interfaces: NetworkInterface[];
  dhcpConfig?: {
    poolNetwork: string;
    excluded: string;
    leaseTime?: string;
  };
  apConfig?: {
    ssid: string;
    security: string;
    vlan: string;
  };
  notes?: string;
  customCliConfig?: string;
}

export interface RuleCheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning';
  detail: string;
}

export interface AIInsightResult {
  rootCause: string;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  osiLayer: string;
  evidence: string[];
  nextCommand: string;
  suggestedFix: string;
  explanation?: string;
  ruleChecks: RuleCheckResult[];
}

export interface HumanReviewState {
  decision: 'Accept' | 'Edit' | 'Reject' | null;
  comments: string;
  reviewer: string;
  verificationTest: string;
  verificationOutput: string | null;
  isTesting: boolean;
  submitted: boolean;
}

export interface TroubleshootingCase {
  caseId: string;
  timestamp: string;
  title: string;
  status: 'OPEN' | 'RESOLVED' | 'REVIEW_PENDING' | 'REJECTED';
  targetDevice: string;
  problemDescription: string;
  commandType: string;
  commandOutput: string;
  diagnosis: AIInsightResult;
  humanReview: HumanReviewState;
  nodeCount: number;
}
