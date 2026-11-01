import InternalsUpdatesNode from './components/InternalsUpdatesNode';

export default {
  flowProps: {
    nodeTypes: { internalsUpdates: InternalsUpdatesNode },
    nodes: [
      {
        id: 'probe',
        type: 'internalsUpdates',
        data: {},
        position: { x: 0, y: 0 },
        selectable: false,
        draggable: false,
        style: { pointerEvents: 'all' },
      },
      { id: 'a', data: {}, position: { x: 0, y: 150 } },
      { id: 'b', data: {}, position: { x: 200, y: 150 } },
    ],
    edges: [{ id: 'dynamic-b', source: 'probe', sourceHandle: 'dynamic', target: 'b' }],
  },
} satisfies FlowConfig;
