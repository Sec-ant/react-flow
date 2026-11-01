import { useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';

export default function InternalsUpdatesNode() {
  const updateNodeInternals = useUpdateNodeInternals();
  const updateFromOtherHook = useUpdateNodeInternals();
  const [showHandle, setShowHandle] = useState(false);

  return (
    <div className="nodrag nopan" style={{ width: 250, height: 80 }}>
      <button
        onClick={() => {
          updateNodeInternals('a');
          updateNodeInternals('a');
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
      {showHandle && <Handle type="source" position={Position.Right} id="dynamic" />}
    </div>
  );
}
