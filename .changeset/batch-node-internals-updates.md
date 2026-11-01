---
"@xyflow/react": patch
---

Measure each node once per animation frame when `useUpdateNodeInternals` is called repeatedly or from multiple components in the same flow. Resolve node elements after React commits and skip nodes that have been removed.
