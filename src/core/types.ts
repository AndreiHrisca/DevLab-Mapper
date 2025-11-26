// ---- Original JSON Types ----

export type LabInfo = {
  name: string;
  description: string;
  version: string;
  author: string;
  updatedAt: string;
  environment?: string;
  domain?: string;
  tags?: string[];
  ownerTeam?: string;
  links?: {
    documentation?: string;
    runbook?: string;
    repo?: string;
  };
};

export type Port = {
  port: number;
  protocol: string;
  description?: string;
  exposed?: boolean;
};

export type Library = {
  id: string;
  label: string;
  type: string;
  version?: string;
  description?: string;
  path?: string;
  source?: Record<string, any>;
};

export type Service = {
  id: string;
  label: string;
  type: string;
  version?: string;
  description?: string;
  ports?: Port[];
  ownerTeam?: string;
  repo?: string;
  deployment?: Record<string, any>;
  monitoring?: Record<string, any>;
  logging?: Record<string, any>;
  sla?: Record<string, any>;
};

export type MachineNodeJson = {
  id: string;
  label: string;
  type: "machine";
  os: string;
  status?: "running" | "maintenance" | "deleted" | "disabled";
  role?: string;
  permissions?: string[];
  tags?: string[];
  fqdn?: string;
  ip?: string;
  location?: Record<string, any>;
  capacity?: Record<string, any>;
  backup?: Record<string, any>;
  libraries?: Library[];
  services?: Service[];
};


export type EdgeLabelOffset = {
  x?: number;
  y?: number;
};

export type EdgeCurveOffset = {
  x?: number;
  y?: number;
};

export type EdgeJson = {
  id: string;
  from: string;
  to: string;
  kind: "communicates_with" | "depends_on" | string;
  label?: string;
  color?: string;
  bend?: number;
  labelOffset?: EdgeLabelOffset;
  curveOffset?: EdgeCurveOffset;
  meta?: Record<string, any>;
};

export type LabJson = {
  lab: LabInfo;
  nodes: MachineNodeJson[];
  edges: EdgeJson[];
};

// ---- Graph Internal types ----

export type GraphNodeKind = "machine" | "service" | "library";

export type GraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  host?: string;
  parentId?: string;
  jsonRefPath: string;
  data: any;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: string;
  label?: string;
  color?: string;
  bend?: number;
  labelOffset?: EdgeLabelOffset;
  curveOffset?: EdgeCurveOffset;
  data?: any;
};

export type EdgeAdjustment = {
  bend?: number;
  labelOffset?: EdgeLabelOffset;
  curveOffset?: EdgeCurveOffset;
};

export type EdgeAdjustments = Record<string, EdgeAdjustment>;

export type NodeAdjustment = {
  width?: number;
  height?: number;
};

export type NodeAdjustments = Record<string, NodeAdjustment>;

export type LayoutState = {
  nodes?: Record<string, { x?: number; y?: number; width?: number; height?: number }>;
  edges?: EdgeAdjustments;
};
