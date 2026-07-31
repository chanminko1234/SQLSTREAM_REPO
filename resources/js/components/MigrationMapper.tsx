import { useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  Connection,
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Database, Zap, Split, Key, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom Node for Database Tables
const TableNode = ({ data, selected }: any) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{
        scale: selected ? 1.05 : 1,
        opacity: 1,
        y: 0,
        borderColor: selected ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
        boxShadow: selected ? "0 0 30px rgba(139,92,246,0.3)" : "0 0 10px rgba(0,0,0,0.2)"
      }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className="min-w-[240px] bg-[#1e1e2e]/90 border-2 rounded-2xl overflow-hidden backdrop-blur-xl relative group/node"
    >
      <div className="px-4 py-3 bg-[#24273a] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className={`w-3.5 h-3.5 ${data.type === 'source' ? 'text-blue-400' : 'text-primary'}`} />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/90">{data.name}</span>
        </div>
        {data.type === 'source' && (
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-primary/20 rounded-lg transition-colors group" title="Split Table">
            <Split className="w-2.5 h-2.5 text-white/40 group-hover:text-primary" />
          </Button>
        )}
      </div>
      <div className="py-2 bg-[#181926]/50">
        {data.columns.map((col: any) => {
          const isPK = col.name.toLowerCase() === 'id' || (col.original_type && col.original_type.toLowerCase().includes('primary key'));
          const piiTag = col.pii_tag;

          return (
            <div key={col.name} className="relative group px-4 py-2 hover:bg-white/5 flex items-center justify-between transition-colors">
              {data.type === 'target' && (
                <Handle
                  type="target"
                  position={Position.Left}
                  className="!w-2 !h-2 !bg-primary !border-none !-left-[4px]"
                  id={col.name}
                />
              )}
              
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-4 flex justify-center shrink-0">
                  {isPK ? (
                    <Key className="w-3 h-3 text-amber-300 opacity-60" />
                  ) : piiTag ? (
                    <ShieldAlert className="w-3 h-3 text-amber-500 animate-pulse" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                  )}
                </div>
                <span className="text-[12px] font-medium text-white/70 group-hover:text-white transition-colors truncate">
                  {col.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="text-[9px] font-mono text-white/30 uppercase">
                  {(col.type || '').split(' ')[0]}
                </span>
                {data.type === 'source' && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-2 !h-2 !bg-primary !border-none !-right-[4px]"
                    id={col.name}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const nodeTypes = {
  table: TableNode,
};

const MapperContent = ({ schema }: { schema: any }) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];
    let yOffset = 0;

    // MySQL Source Nodes (Left)
    Object.entries(schema).forEach(([tableName, table]: any) => {
      nodesList.push({
        id: `source-${tableName}`,
        type: 'table',
        data: {
          name: tableName,
          type: 'source',
          columns: table.columns.map((c: any) => ({ 
            name: c.name, 
            type: c.original_type,
            pii_tag: c.pii_tag 
          }))
        },
        position: { x: 50, y: yOffset },
      });
      yOffset += (table.columns.length * 40) + 120;
    });

    yOffset = 0;

    // PostgreSQL Target Nodes (Right)
    Object.entries(schema).forEach(([tableName, table]: any) => {
      nodesList.push({
        id: `target-${tableName}`,
        type: 'table',
        data: {
          name: tableName,
          type: 'target',
          columns: table.columns.map((c: any) => ({ 
            name: c.name, 
            type: c.converted_type 
          }))
        },
        position: { x: 600, y: yOffset },
      });

      // Default connections
      table.columns.forEach((col: any) => {
        edgesList.push({
          id: `edge-${tableName}-${col.name}`,
          source: `source-${tableName}`,
          target: `target-${tableName}`,
          sourceHandle: col.name,
          targetHandle: col.name,
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.6 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6', width: 12, height: 12 },
        });
      });

      yOffset += (table.columns.length * 40) + 120;
    });

    setNodes(nodesList);
    setEdges(edgesList);
  }, [schema, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({
    ...params,
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6', width: 15, height: 15 }
  }, eds)), [setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    fitView({ nodes: [node], duration: 800, padding: 0.8 });
  }, [fitView]);

  const resetView = () => {
    fitView({ duration: 800, padding: 0.2 });
  };

  return (
    <div className="h-full w-full bg-[#1a1b26] rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ x: [-10, 10], y: [-10, 10] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "mirror" }}
          className="absolute inset-[-20px] bg-dot-grid opacity-[0.03]" 
        />
        <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse animation-delay-2000" />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.05}
        maxZoom={3}
        className="z-10"
      >
        <Background color="rgba(139, 92, 246, 0.1)" variant={BackgroundVariant.Dots} />
        <Controls className="bg-slate-900/80 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl [&_button]:bg-transparent [&_button]:border-white/5 [&_path]:fill-white/60 hover:[&_path]:fill-primary transition-all p-1" />
        <Panel position="top-right" className="flex items-center gap-4">
          <div className="bg-[#24273a]/90 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <Zap className="w-3 h-3 fill-primary" /> Transformer
              </h4>
              <p className="text-[9px] opacity-40 font-bold uppercase tracking-tighter italic">Live Bridge Active</p>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[9px] font-mono text-white/70">
                  <span className="text-emerald-400 font-bold">TINYINT(1)</span> → <span className="text-teal-300">BOOL</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[9px] font-mono text-white/70">
                  <span className="text-emerald-400 font-bold">DATETIME</span> → <span className="text-teal-300">TIMESTAMPTZ</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={resetView}
                    className="h-9 w-9 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all shadow-inner"
                    title="Fit to Screen"
                >
                    <Database className="w-4 h-4" />
                </Button>
                <Button size="sm" className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    Sync All
                </Button>
            </div>
          </div>
        </Panel>
        
      </ReactFlow>

      <style>{`
        .react-flow__handle {
            transition: all 0.2s ease;
        }
        .react-flow__handle:hover {
            transform: scale(2);
            background: #ffffff !important;
            box-shadow: 0 0 10px #8b5cf6;
        }
        .react-flow__edge-path {
            transition: stroke-width 0.2s, opacity 0.2s;
        }
        .react-flow__edge:hover .react-flow__edge-path {
            stroke-width: 4;
            opacity: 1;
        }
        .react-flow__controls {
            background: rgba(15, 23, 42, 0.8) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            padding: 4px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
        }
        .react-flow__controls-button {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            height: 32px !important;
            width: 32px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s !important;
        }
        .react-flow__controls-button:last-child {
            border-bottom: none !important;
        }
        .react-flow__controls-button svg {
            fill: rgba(255, 255, 255, 0.5) !important;
            width: 14px !important;
            height: 14px !important;
        }
        .react-flow__controls-button:hover {
            background: rgba(139, 92, 246, 0.1) !important;
        }
        .react-flow__controls-button:hover svg {
            fill: #8b5cf6 !important;
        }
      `}</style>
    </div>
  );
};

export const MigrationMapper = (props: any) => (
  <ReactFlowProvider>
    <MapperContent {...props} />
  </ReactFlowProvider>
);

