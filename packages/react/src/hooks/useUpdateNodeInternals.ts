import type { UpdateNodeInternals, InternalNodeUpdate } from '@xyflow/system';

import { useReactFlowStoreApi } from './useReactFlowStore';
import type { ReactFlowStoreApi } from '../types';

type PendingUpdate = { domNode: HTMLDivElement; ids: Set<string> };
const pendingUpdates = new WeakMap<ReactFlowStoreApi['optionsStore'], PendingUpdate>();

/**
 * When you programmatically add or remove handles to a node or update a node's
 * handle position, you need to let React Flow know about it using this hook. This
 * will update the internal dimensions of the node and properly reposition handles
 * on the canvas if necessary.
 *
 * @public
 * @returns Use this function to tell React Flow to update the internal state of one or more nodes
 * that you have changed programmatically.
 *
 * @example
 * ```jsx
 *import { useCallback, useState } from 'react';
 *import { Handle, useUpdateNodeInternals } from '@xyflow/react';
 *
 *export default function RandomHandleNode({ id }) {
 *  const updateNodeInternals = useUpdateNodeInternals();
 *  const [handleCount, setHandleCount] = useState(0);
 *  const randomizeHandleCount = useCallback(() => {
 *   setHandleCount(Math.floor(Math.random() * 10));
 *    updateNodeInternals(id);
 *  }, [id, updateNodeInternals]);
 *
 *  return (
 *    <>
 *      {Array.from({ length: handleCount }).map((_, index) => (
 *        <Handle
 *          key={index}
 *          type="target"
 *          position="left"
 *          id={`handle-${index}`}
 *        />
 *      ))}
 *
 *      <div>
 *        <button onClick={randomizeHandleCount}>Randomize handle count</button>
 *        <p>There are {handleCount} handles on this node.</p>
 *      </div>
 *    </>
 *  );
 *}
 *```
 * @remarks This hook can only be used in a component that is a child of a
 *{@link ReactFlowProvider} or a {@link ReactFlow} component.
 */
export function useUpdateNodeInternals(): UpdateNodeInternals {
  const { optionsStore } = useReactFlowStoreApi();

  return (id: string | string[]) => {
    const { domNode } = optionsStore.getState();
    if (!domNode) {
      return;
    }

    let pending = pendingUpdates.get(optionsStore);
    if (pending?.domNode === domNode) {
      for (const updateId of Array.isArray(id) ? id : [id]) {
        pending.ids.add(updateId);
      }
      return;
    }

    pending = { domNode, ids: new Set(Array.isArray(id) ? id : [id]) };
    pendingUpdates.set(optionsStore, pending);
    const queued = pending;

    requestAnimationFrame(() => {
      if (pendingUpdates.get(optionsStore) !== queued) {
        return;
      }
      pendingUpdates.delete(optionsStore);

      const { domNode: currentDomNode, updateNodeInternals } = optionsStore.getState();
      if (currentDomNode !== queued.domNode) {
        return;
      }

      const updates = new Map<string, InternalNodeUpdate>();
      for (const updateId of queued.ids) {
        const nodeElement = currentDomNode.querySelector<HTMLDivElement>(`.react-flow__node[data-id="${updateId}"]`);
        if (nodeElement?.isConnected) {
          updates.set(updateId, { id: updateId, nodeElement, force: true });
        }
      }

      if (updates.size) {
        updateNodeInternals(updates, { triggerFitView: false });
      }
    });
  };
}
