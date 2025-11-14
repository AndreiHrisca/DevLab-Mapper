// src/components/editor/JsonEditor.tsx
import React from "react";
import Editor from "@monaco-editor/react";

type JsonEditorProps = {
  value: string;
  onChange: (val: string) => void;
};

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange
}) => {
  const handleChange = (val?: string) => {
    onChange(val ?? "");
  };

  return (
    <div
      style={{
        flex: 1,
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}
    >
      <Editor
        value={value}
        language="json"
        defaultLanguage="json"
        theme="vs-dark"
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on"
        }}
      />
    </div>
  );
};
