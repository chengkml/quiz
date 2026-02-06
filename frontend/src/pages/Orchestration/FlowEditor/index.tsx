import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './index.less';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { StartNode, EndNode, LLMNode, KnowledgeNode, SkillNode, ConditionNode } from './nodes';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  knowledge: KnowledgeNode,
  skill: SkillNode,
  condition: ConditionNode,
};

interface FlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

const FlowEditor: React.FC<FlowEditorProps> = ({ initialNodes = [], initialEdges = [], onSave }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Update nodes/edges when props change (e.g. initial load)
  useEffect(() => {
    if (initialNodes.length > 0) setNodes(initialNodes);
    if (initialEdges.length > 0) setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Sync back to parent when graph changes
  useEffect(() => {
    if (onSave) {
       onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      // Update styling to show selection
      setNodes((nds) => nds.map(n => ({
          ...n,
          selected: n.id === node.id
      })));
  }, [setNodes]);

  const onPaneClick = useCallback(() => {
      setSelectedNodeId(null);
      setNodes((nds) => nds.map(n => ({
          ...n,
          selected: false
      })));
  }, [setNodes]);

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
      setNodes((nds) => nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }));
  }, [setNodes]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <ReactFlowProvider>
        <div style={{ width: 250, flexShrink: 0 }}>
             <Sidebar />
        </div>
        
        <div style={{ flex: 1, height: '100%' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>

        <div style={{ width: 300, flexShrink: 0 }}>
            <PropertiesPanel 
                selectedNode={selectedNode} 
                onChange={handleNodeUpdate} 
            />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default FlowEditor;
