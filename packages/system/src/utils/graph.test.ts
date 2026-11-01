import { describe, expect, it, vi } from 'vitest';

import type { EdgeBase, NodeBase } from '../types';
import { getElementsToRemove } from './graph';

const parent: NodeBase = { id: 'parent', data: {}, position: { x: 0, y: 0 } };
const child: NodeBase = { ...parent, id: 'child', parentId: 'parent' };
const grandchild: NodeBase = { ...parent, id: 'grandchild', parentId: 'child' };
const edge: EdgeBase = { id: 'child-grandchild', source: 'child', target: 'grandchild' };

describe('getElementsToRemove', () => {
  it.each([
    [parent, child, grandchild],
    [parent, grandchild, child],
    [child, parent, grandchild],
    [child, grandchild, parent],
    [grandchild, parent, child],
    [grandchild, child, parent],
  ])('removes the full subtree in input order: %j, %j, %j', async (...nodes) => {
    const result = await getElementsToRemove({ nodesToRemove: [parent], edgesToRemove: [], nodes, edges: [edge] });
    expect(result.nodes).toEqual(nodes);
    expect(result.edges).toEqual([edge]);
  });

  it('preserves protected subtrees but allows explicitly selected descendants to be removed', async () => {
    const nodes = [grandchild, { ...child, deletable: false }, parent];
    const result = await getElementsToRemove({ nodesToRemove: [parent], edgesToRemove: [], nodes, edges: [edge] });
    expect(result.nodes).toEqual([parent]);
    expect(result.edges).toEqual([]);

    const explicit = await getElementsToRemove({
      nodesToRemove: [parent, grandchild],
      edgesToRemove: [],
      nodes,
      edges: [edge],
    });
    expect(explicit.nodes).toEqual([grandchild, parent]);
    expect(explicit.edges).toEqual([edge]);
  });

  it('deduplicates requests, ignores missing nodes and respects edge deletion protection', async () => {
    const protectedEdge = { ...edge, deletable: false };
    const explicitEdge = { id: 'explicit', source: 'elsewhere', target: 'outside' };
    const result = await getElementsToRemove({
      nodesToRemove: [parent, parent, { id: 'missing' }],
      edgesToRemove: [protectedEdge, explicitEdge, explicitEdge],
      nodes: [grandchild, child, parent],
      edges: [explicitEdge, protectedEdge],
    });
    expect(result.nodes).toEqual([grandchild, child, parent]);
    expect(result.edges).toEqual([explicitEdge]);
  });

  it('passes the complete subtree to onBeforeDelete and respects its result', async () => {
    const nodes = [grandchild, child, parent];
    for (const allowed of [true, false]) {
      const onBeforeDelete = vi.fn().mockResolvedValue(allowed);
      const result = await getElementsToRemove({
        nodesToRemove: [parent],
        edgesToRemove: [],
        nodes,
        edges: [edge],
        onBeforeDelete,
      });
      expect(onBeforeDelete).toHaveBeenCalledWith({ nodes, edges: [edge] });
      expect(result).toEqual(allowed ? { nodes, edges: [edge] } : { nodes: [], edges: [] });
    }
    const replacement = { nodes: [child], edges: [] };
    const result = await getElementsToRemove({
      nodesToRemove: [parent],
      edgesToRemove: [],
      nodes,
      edges: [edge],
      onBeforeDelete: () => Promise.resolve(replacement),
    });
    expect(result).toBe(replacement);
  });

  it('terminates for cyclic parent references', async () => {
    const nodes = [{ ...parent, parentId: child.id }, child];
    const result = await getElementsToRemove({ nodesToRemove: [parent], edgesToRemove: [], nodes, edges: [] });
    expect(result.nodes).toEqual(nodes);
  });
});
