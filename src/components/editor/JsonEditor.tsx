// src/components/editor/JsonEditor.tsx
import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

type JsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

// Ejemplo por defecto (el que estabas usando)
const DEFAULT_EXAMPLE = `{
  "lab": {
    "name": "DevOps Lab - CI/CD + Artifact Repo",
    "description": "CI server with Bamboo agent, Nexus and shared libraries",
    "version": "1.0",
    "author": "Andrei Ionut Hrisca",
    "updatedAt": "2024-06-10",
    "environment": "lab",
    "domain": "CI/CD & Artifacts",
    "tags": ["on-prem", "ci-cd", "demo"],
    "ownerTeam": "Platform Engineering",
    "links": {
      "documentation": "https://confluence.example.com/devops-lab",
      "runbook": "https://confluence.example.com/devops-lab-runbook",
      "repo": "https://bitbucket.example.com/scm/devops/devops-lab-diagrams.git"
    }
  },
  "nodes": [
    {
      "id": "fsw-server-03",
      "label": "FSW-Server-03",
      "type": "machine",
      "status": "running",
      "os": "Windows Server 2019",
      "role": "CI Server",
      "permissions": ["anhh", "anrv", "localadmin"],
      "tags": ["on-prem", "bamboo-agent"],
      "fqdn": "FSW-Server-03.deimos-space.com",
      "ip": "10.10.20.15",
      "location": {
        "datacenter": "MAD-DC1",
        "rack": "R12",
        "zone": "on-prem"
      },
      "capacity": {
        "cpuCores": 8,
        "ramGB": 32,
        "diskGB": 500
      },
      "backup": {
        "enabled": true,
        "policy": "daily-7d-retention"
      },
      "libraries": [
        {
          "id": "lib-docker-cli",
          "label": "Docker CLI",
          "type": "container-tool",
          "version": "20.10.7",
          "description": "Docker Command Line Interface for container management",
          "path": "C:\\\\Program Files\\\\Docker\\\\docker.exe",
          "source": {
            "packageManager": "manual-install",
            "downloadUrl": "https://www.docker.com/",
            "managedBy": "ansible"
          }
        },
        {
          "id": "lib-jdk17",
          "label": "OpenJDK 17",
          "type": "java-runtime",
          "version": "17.0.8",
          "description": "OpenJDK 17 Runtime Environment",
          "path": "C:\\\\Program Files\\\\Java\\\\jdk-17",
          "source": {
            "packageManager": "manual-install",
            "downloadUrl": "https://adoptium.net/",
            "managedBy": "ansible"
          }
        }
      ],
      "services": [
        {
          "id": "svc-bamboo-agent1",
          "label": "Bamboo Agent 1",
          "type": "ci-agent",
          "version": "8.3.4",
          "description": "Bamboo build agent for CI/CD pipelines",
          "ports": [
            {
              "port": 8085,
              "protocol": "HTTP",
              "description": "Bamboo agent communication port",
              "exposed": false
            }
          ],
          "ownerTeam": "CI/CD Team",
          "repo": "https://bitbucket.example.com/scm/ci/bamboo-agent-config.git",
          "deployment": {
            "method": "ansible",
            "playbook": "ansible/roles/bamboo-agent",
            "pipelineId": "BAMBOO-PLAN-KEY"
          },
          "monitoring": {
            "prometheusTarget": "fsw-server-03:9100",
            "dashboards": [
              "https://grafana.example.com/d/bamboo-agent/bamboo-agent-overview"
            ]
          },
          "logging": {
            "system": "loki",
            "query": "{app=\\"bamboo-agent1\\"}"
          },
          "sla": {
            "criticality": "high",
            "availabilityTarget": "99.5"
          }
        }
      ]
    },
    {
      "id": "nexus-server-01",
      "label": "nexus3.deimos-space.com",
      "type": "machine",
      "status": "maintenance",
      "os": "Rocky Linux 9",
      "role": "Artifact Repository",
      "tags": ["on-prem", "nexus"],
      "fqdn": "nexus3.deimos-space.com",
      "ip": "10.10.30.20",
      "location": {
        "datacenter": "MAD-DC1",
        "rack": "R15",
        "zone": "on-prem"
      },
      "capacity": {
        "cpuCores": 8,
        "ramGB": 32,
        "diskGB": 2000
      },
      "backup": {
        "enabled": true,
        "policy": "daily-30d-retention"
      },
      "services": [
        {
          "id": "svc-nexus",
          "label": "Nexus 3",
          "type": "artifact-repo",
          "version": "3.x",
          "description": "Nexus 3 artifact repository for Maven, npm and Docker",
          "ports": [
            {
              "port": 18161,
              "protocol": "HTTPS",
              "description": "Docker/Artifacts endpoint",
              "exposed": true
            }
          ],
          "ownerTeam": "Platform Engineering",
          "repo": "https://bitbucket.example.com/scm/infra/nexus-config.git",
          "deployment": {
            "method": "ansible",
            "playbook": "ansible/roles/nexus3",
            "pipelineId": "INFRA-NEXUS-DEPLOY"
          },
          "monitoring": {
            "prometheusTarget": "nexus3.deimos-space.com:9100",
            "dashboards": [
              "https://grafana.example.com/d/nexus/nexus-overview"
            ]
          },
          "logging": {
            "system": "loki",
            "query": "{app=\\"nexus3\\"}"
          },
          "sla": {
            "criticality": "high",
            "availabilityTarget": "99.9"
          }
        }
      ]
    }
  ],
  "edges": [
    {
      "id": "net-bamboo-to-nexus",
      "from": "svc-bamboo-agent1",
      "to": "svc-nexus",
      "kind": "communicates_with",
      "label": "publish artifacts",
      "meta": {
        "protocol": "HTTPS",
        "port": 18161,
        "direction": "outbound",
        "network": {
          "sourceSubnet": "10.10.20.0/24",
          "targetSubnet": "10.10.30.0/24",
          "firewallRule": "FW-CI-TO-NEXUS-HTTPS"
        },
        "security": {
          "auth": "basic-auth",
          "tls": "internal-ca",
          "sensitiveData": false
        }
      }
    },
    {
      "id": "dep-bamboo-docker",
      "from": "svc-bamboo-agent1",
      "to": "lib-docker-cli",
      "kind": "depends_on",
      "label": "docker builds",
      "meta": {
        "reason": "Required for Docker-based build jobs"
      }
    },
    {
      "id": "dep-bamboo-jdk",
      "from": "svc-bamboo-agent1",
      "to": "lib-jdk17",
      "kind": "depends_on",
      "label": "runs on JDK 17",
      "meta": {
        "reason": "Agent runtime",
        "mandatory": true
      }
    }
  ]
}
`;

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar ejemplo al arrancar si no hay nada
  useEffect(() => {
    if (!value || value.trim() === "") {
      onChange(DEFAULT_EXAMPLE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseExample = () => {
    onChange(DEFAULT_EXAMPLE);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      onChange(text);
    };
    reader.readAsText(file);
    // reset input para poder cargar el mismo fichero otra vez si hace falta
    e.target.value = "";
  };

  const handleEditorChange = (val?: string) => {
    onChange(val ?? "");
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#020617",
        color: "#e5e7eb"
      }}
    >
      {/* Header del panel */}
      <div
        style={{
          padding: "10px 12px 6px 12px",
          borderBottom: "1px solid #111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Lab JSON</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleFileButtonClick}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            Load JSON
          </button>
          <button
            onClick={handleUseExample}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              background: "#0f172a",
              color: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            Use example
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on"
          }}
        />
      </div>
    </div>
  );
};
