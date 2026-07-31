import ReactFlow, { 
  Background, 
  BackgroundVariant,
  Controls, 
  Panel,
  Handle,
  Position,
  Node,
  Edge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Key, Link as LinkIcon, Database, ShieldAlert } from 'lucide-react';

import { motion } from 'framer-motion';
import { useCallback, useEffect } from 'react';

const TableNode = ({ data, selected }: any) => {
  const colIdMatch = (name: string) => name.toLowerCase();

  return (
    <div className="w-[260px] relative">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ 
            scale: selected ? 1.05 : 1, 
            opacity: 1, 
            y: 0,
            borderColor: selected ? '#6366f1' : 'rgba(255,255,255,0.1)',
            boxShadow: selected ? [
                "0 0 20px rgba(99,102,241,0.4)",
                "0 0 50px rgba(99,102,241,0.7)",
                "0 0 20px rgba(99,102,241,0.4)"
            ] : [
                "0 0 10px rgba(99,102,241,0.05)",
                "0 0 30px rgba(99,102,241,0.25)",
                "0 0 10px rgba(99,102,241,0.05)"
            ]
        }}
        transition={{ 
            scale: { type: 'spring', damping: 15, stiffness: 300 },
            boxShadow: { duration: selected ? 2 : 6, repeat: Infinity, ease: "easeInOut" },
            borderColor: { duration: 0.2 }
        }}
        className={`bg-[#1e1e2e] border-2 rounded-xl overflow-hidden font-sans relative group/node transition-colors z-20 shadow-2xl`}
      >
        {selected && (
            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white-[0.02] to-transparent -translate-x-full group-hover/node:animate-[shimmer_3s_infinite] pointer-events-none" />
        
        {/* HEADER / DRAG HANDLE */}
        <div className="bg-[#24273a] px-4 py-3 border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing react-flow__node-drag-handle">
          <h3 className="font-bold text-[14px] text-white flex items-center gap-2 pointer-events-none">
             {data.name}
          </h3>
          <Database className="w-3.5 h-3.5 text-white/20 pointer-events-none" />
        </div>

        {/* COLUMNS */}
        <div className="py-2 bg-[#181926]">
          {(data.columns || []).map((col: any, idx: number) => {
            if (!col || typeof col !== 'object') return null;
            const colName = col.name || col.column_name || `col_${idx}`;
            const origType = String(col.original_type || col.type || col.data_type || '');
            const colType = String(col.converted_type || col.type || col.data_type || col.original_type || 'VARCHAR');
            const typeDisplay = colType.split(' ')[0];

            const isPK = Boolean(col.is_pk || col.primary_key || colName.toLowerCase() === 'id' || origType.toLowerCase().includes('primary key'));
            const isFK = Boolean(col.is_fk || data.foreign_keys?.some((fk: any) => fk.column === colName));
            const piiTag = col.pii_tag;
            const colId = colIdMatch(colName);

            return (
              <div key={colName + '_' + idx} className={`group relative flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors ${piiTag ? 'bg-amber-500/5 border-l-2 border-amber-500/40' : ''}`}>
                {/* HANDLES MOVED TO ROOT WRAPPER FOR STABILITY */}
                <div className="absolute inset-x-0 h-full pointer-events-none">
                    <Handle 
                        type="target" 
                        position={Position.Left} 
                        id={`${colId}-target-left`} 
                        className="!w-1.5 !h-1.5 !bg-white/30 !border-none !-left-[4px] pointer-events-auto" 
                    />
                    <Handle 
                        type="source" 
                        position={Position.Right} 
                        id={`${colId}-source-right`} 
                        className="!w-1.5 !h-1.5 !bg-white/30 !border-none !-right-[4px] pointer-events-auto" 
                    />
                </div>

                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-4 flex justify-center shrink-0">
                      {isPK ? (
                          <Key className="w-3 h-3 text-amber-300 opacity-60" />
                      ) : isFK ? (
                          <LinkIcon className="w-3 h-3 text-primary opacity-60" />
                      ) : piiTag ? (
                          <ShieldAlert className="w-3 h-3 text-amber-500 animate-pulse" />
                      ) : (
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                      )}
                  </div>
                  <span className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate">
                      {colName}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">
                      {typeDisplay}
                  </span>
                  {isPK && <span className="text-[8px] font-black bg-white/5 text-white/30 px-1 rounded">PK</span>}
                  {piiTag && (
                    <span className="text-[8px] font-black bg-amber-500/20 text-amber-500 px-1 rounded animate-pulse">
                      {piiTag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

const ERDContent = ({ tables }: { tables: any }) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const tableList: any[] = Array.isArray(tables)
      ? tables
      : (tables && typeof tables === 'object' ? Object.values(tables) : []);

    tableList.forEach((table, i) => {
      if (!table || typeof table !== 'object') return;

      const rawName = table.name || table.table_name || `table_${i}`;
      const tableId = String(rawName).toLowerCase();
      const x = (i % 3) * 450;
      const y = Math.floor(i / 3) * 600;

      const columns = Array.isArray(table.columns)
        ? table.columns
        : (table.columns && typeof table.columns === 'object' ? Object.values(table.columns) : []);

      const foreignKeys = Array.isArray(table.foreign_keys)
        ? table.foreign_keys
        : (table.foreign_keys && typeof table.foreign_keys === 'object' ? Object.values(table.foreign_keys) : []);

      initialNodes.push({
        id: tableId,
        type: 'table',
        position: { x, y },
        data: { name: rawName, columns, foreign_keys: foreignKeys },
      });

      if (foreignKeys.length > 0) {
        foreignKeys.forEach((fk: any, j: number) => {
          if (!fk || !fk.references_table || !fk.column) return;
          const sourceTableId = String(fk.references_table).toLowerCase();
          const targetTableId = tableId;
          const sourceCol = String(fk.references_column || 'id').toLowerCase();
          const targetCol = String(fk.column).toLowerCase();

          initialEdges.push({
            id: `e-${targetTableId}-${sourceTableId}-${j}`,
            source: sourceTableId,
            target: targetTableId,
            sourceHandle: `${sourceCol}-source-right`,
            targetHandle: `${targetCol}-target-left`,
            type: 'smoothstep',
            animated: true,
            style: { 
                stroke: '#ffffff', 
                strokeWidth: 2,
                opacity: 0.6
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: '#ffffff',
            },
          });
        });
      }
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [tables, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
      fitView({ nodes: [node], duration: 800, padding: 0.8 });
  }, [fitView]);

  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-[#1a1b26] rounded-3xl overflow-hidden min-h-[500px] relative group/erd">
      {/* PARALLAX MOVING BACKGROUND LAYERS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ x: [-20, 20], y: [-20, 20] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
          className="absolute inset-[-50px] bg-dot-grid opacity-[0.05] scale-110" 
        />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/15 blur-[120px] rounded-full animate-blob overflow-hidden" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/15 blur-[120px] rounded-full animate-blob animation-delay-2000 overflow-hidden" />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        className="z-10"
        onNodeClick={onNodeClick}
      >
        <Background color="transparent" gap={28} variant={BackgroundVariant.Dots} className="animate-[pan_40s_linear_infinite] opacity-20" />
        <Controls />
        <Panel position="top-right">
            <div className="bg-[#24273a]/90 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-white/40 shadow-2xl">
                System Blueprint Model
            </div>
        </Panel>
      </ReactFlow>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pan {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }
      `}</style>
    </div>
  );
};

export const ERDVisualizer = (props: any) => (
  <ReactFlowProvider>
    <ERDContent {...props} />
  </ReactFlowProvider>
);
