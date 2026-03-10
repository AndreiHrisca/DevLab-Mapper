import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { sampleLab } from "../../core/sampleLab";

type JsonEditorProps = {
  value: string;
  errorMessage?: string;
  fontSize?: number;
  mono?: boolean;
  theme: "light" | "dark";
  onToggleMono?: () => void;
  onChange: (value: string) => void;
};

const DEFAULT_EXAMPLE = JSON.stringify(sampleLab, null, 2);

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  errorMessage,
  fontSize,
  mono = true,
  theme,
  onToggleMono,
  onChange
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      onChange(text);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleEditorChange = (nextValue?: string) => {
    onChange(nextValue ?? "");
  };

  const isDark = theme === "dark";
  const palette = {
    bg: "var(--surface-1)",
    panel: "var(--surface-2)",
    panelAlt: "var(--surface-3)",
    border: "var(--border-color)",
    borderStrong: "var(--border-strong)",
    text: "var(--text-primary)",
    secondary: "var(--text-secondary)",
    accent: "var(--accent)",
    accentContrast: "var(--accent-contrast)",
    danger: "var(--danger)",
    dangerSoft: "var(--danger-soft)"
  };

  const actionButtonStyle = (
    active = false
  ): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 600,
    padding: "7px 11px",
    borderRadius: 12,
    border: `1px solid ${active ? palette.accent : palette.borderStrong}`,
    background: active ? palette.accent : palette.panelAlt,
    color: active ? palette.accentContrast : palette.text,
    cursor: "pointer",
    transition:
      "background-color 150ms ease, border-color 150ms ease, color 150ms ease"
  });

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: palette.bg,
        color: palette.text
      }}
    >
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${palette.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: palette.panel
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Lab JSON</div>
            <div
              style={{
                fontSize: 12,
                color: palette.secondary,
                maxWidth: 360
              }}
            >
              Load a file or use the base example to start mapping the lab.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleFileButtonClick} style={actionButtonStyle()}>
              Load JSON
            </button>
            <button onClick={handleUseExample} style={actionButtonStyle()}>
              Use example
            </button>
            {onToggleMono && (
              <button
                onClick={onToggleMono}
                style={actionButtonStyle(mono)}
                title="Toggle a monospace font in the editor"
              >
                {mono ? "Monospace font" : "Normal font"}
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              fontSize: 11,
              color: palette.danger,
              background: palette.dangerSoft,
              border: `1px solid ${palette.danger}`,
              borderRadius: 12,
              padding: "8px 10px"
            }}
          >
            {errorMessage}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: 12,
          background: palette.bg
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="json"
          theme={isDark ? "vs-dark" : "vs"}
          value={value}
          onChange={handleEditorChange}
          options={{
            fontSize: fontSize ?? 12,
            fontFamily: mono
              ? "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              : "'Aptos', 'Segoe UI Variable', 'Segoe UI', sans-serif",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            lineNumbersMinChars: 3,
            padding: {
              top: 12,
              bottom: 12
            }
          }}
          wrapperProps={{
            style: {
              height: "100%",
              overflow: "hidden",
              borderRadius: 18,
              border: `1px solid ${palette.border}`,
              boxShadow: "var(--shadow-soft)"
            }
          }}
        />
      </div>
    </div>
  );
};
