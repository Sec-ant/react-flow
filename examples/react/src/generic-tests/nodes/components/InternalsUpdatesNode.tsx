import { useState } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';

export default function InternalsUpdatesNode() {
  const updateNodeInternals = useUpdateNodeInternals();
  const updateFromOtherHook = useUpdateNodeInternals();
  const { setNodes } = useReactFlow();
  const [showHandle, setShowHandle] = useState(false);

  return (
    <div className="nodrag nopan" style={{ width: 250, height: 80 }}>
      <button
        onClick={() => {
          for (let i = 0; i < 100; i++) updateNodeInternals('a');
          updateFromOtherHook(['a', 'b', 'b']);
        }}
      >
        Measure nodes repeatedly
      </button>
      <button
        onClick={() => {
          setShowHandle(true);
          updateNodeInternals('probe');
        }}
      >
        Add handle and measure
      </button>
      <button
        onClick={() => {
          updateNodeInternals('a');
          setNodes((nodes) => nodes.filter(({ id }) => id !== 'a'));
        }}
      >
        Remove queued node
      </button>
      {showHandle && <Handle type="source" position={Position.Right} id="dynamic" />}
    </div>
  );
}
