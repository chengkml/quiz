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
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './index.less';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { StartNode, EndNode, LLMNode, KnowledgeNode, SkillNode, ConditionNode } from './nodes';
import { resolveNodeMeta } from './nodeMeta';

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
  graphKey?: string;
}

const FlowEditor: React.FC<FlowEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  graphKey,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Update nodes/edges when props change (e.g. initial load)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
  }, [graphKey, setNodes, setEdges]);

  // Sync back to parent when graph changes
  useEffect(() => {
    if (onSave) {
       onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#64748b",
            },
          },
          eds
        )
      ),
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
        data: {
          label,
          description: resolveNodeMeta(type).description,
        },
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
    <div className="flow-editor">
      <ReactFlowProvider>
        <div className="flow-editor__sidebar">
          <Sidebar />
        </div>

        <div className="flow-editor__canvas" ref={reactFlowWrapper}>
          <div className="flow-editor__canvas-hint">
            <div className="flow-editor__canvas-title">工作流画布</div>
            <div className="flow-editor__canvas-desc">
              将左侧节点拖入画布，连接它们并在右侧完成配置。
            </div>
          </div>

          <ReactFlow
            className="flow-editor__reactflow"
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
            proOptions={{ hideAttribution: true }}
          >
            <Controls position="bottom-right" />
            <MiniMap
              position="bottom-left"
              nodeColor={(node) => resolveNodeMeta(node.type).accent}
              pannable
              zoomable
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.2}
              color="#d4dbe6"
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="flow-editor__empty-state">
              <div className="flow-editor__empty-title">从节点库开始搭建工作流</div>
              <div className="flow-editor__empty-desc">
                推荐先放置“开始”节点，再补充模型、知识库和条件分支节点。
              </div>
            </div>
          )}
        </div>

        <div className="flow-editor__properties">
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
