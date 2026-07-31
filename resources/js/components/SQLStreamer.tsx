import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Square, Activity, Database, Table as TableIcon, Terminal, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StreamingDataTable } from './StreamingDataTable';

interface SQLStreamerProps {
  initialQuery?: string;
  sourceType?: string;
  connectionConfig?: any;
}

export const SQLStreamer: React.FC<SQLStreamerProps> = ({
  initialQuery = 'SELECT * FROM users LIMIT 100',
  sourceType = 'mysql',
  connectionConfig = {}
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState({ totalRows: 0, startTime: 0, rowsPerSec: 0 });
  const [status, setStatus] = useState<'idle' | 'connecting' | 'streaming' | 'completed' | 'error'>('idle');
  const [columns, setColumns] = useState<string[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stopStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setStatus('idle');
    toast.error('Protocol Terminated: Stream closed by operator.');
  };

  const startStream = () => {
    if (isStreaming) return;

    // Cleanup previous connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setRows([]);
    setColumns([]);
    setIsStreaming(true);
    setStatus('connecting');
    setStats({ totalRows: 0, startTime: Date.now(), rowsPerSec: 0 });

    const params = new URLSearchParams({
      sql: query,
      source_type: sourceType,
      ...Object.keys(connectionConfig).reduce((acc: any, key) => {
        acc[`source[${key}]`] = connectionConfig[key];
        return acc;
      }, {})
    });

    const url = `/convert/stream-results?${params.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('meta', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        setStatus('streaming');
        toast.info('Connected to database engine.');
      } catch {
        setStatus('streaming');
      }
    });

    es.addEventListener('row', (event: any) => {
      try {
        const row = JSON.parse(event.data);
        if (row && typeof row === 'object') {
          setRows((prev) => {
            const next = [row, ...prev].slice(0, 500); // Keep last 500 for performance
            if (prev.length === 0 && row) {
              setColumns(Object.keys(row));
            }
            return next;
          });

          setStats((prev) => {
            const total = prev.totalRows + 1;
            const elapsed = (Date.now() - prev.startTime) / 1000;
            return {
              ...prev,
              totalRows: total,
              rowsPerSec: Math.round(total / (elapsed || 1))
            };
          });
        }
      } catch (e) {
        console.error('Invalid row stream frame payload:', e);
      }
    });

    es.addEventListener('done', (event: any) => {
      setStatus('completed');
      setIsStreaming(false);
      es.close();
      toast.success('Streaming protocol completed successfully.');
    });

    es.addEventListener('error', (event: any) => {
      setStatus('error');
      setIsStreaming(false);
      es.close();

      try {
        if (event.data) {
          const error = JSON.parse(event.data);
          toast.error(error.message || 'Streaming failed.');
        } else {
          toast.error('Stream connection interrupted.');
        }
      } catch {
        toast.error('Stream connection ended with error status.');
      }
    });
  };


  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isStreaming) {
          startStream();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, query]);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-foreground/10 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-foreground/5 dark:border-white/5">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-xl font-bold tracking-tight">SQL Live Streamer</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={status === 'streaming' ? 'default' : 'secondary'} className="px-3 py-1">
              {status.toUpperCase()}
            </Badge>
            {isStreaming && (
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Presets:</span>
                <button
                  type="button"
                  onClick={() => setQuery('SELECT id, name, email, created_at FROM users LIMIT 100')}
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  Users Stream
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('SELECT order_id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 50')}
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-500/20 transition-all border border-teal-500/20"
                >
                  Orders Analytics
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('SELECT id, user_id, action, ip_address, created_at FROM audit_logs LIMIT 100')}
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all border border-amber-500/20"
                >
                  Audit Trail
                </button>
              </div>
              <span className="text-[10px] font-bold text-foreground/40 hidden sm:inline-block">
                Press <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-[9px] font-mono">⌘/Ctrl + Enter</kbd> to stream
              </span>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-teal-500/50 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="relative w-full h-32 p-4 bg-muted border border-foreground/5 dark:border-none rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50 transition-all resize-none text-foreground"
                placeholder="Enter SQL Query..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                {!isStreaming ? (
                  <Button
                    onClick={startStream}
                    className="rounded-2xl flex justify-center items-center h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_15px_40px_rgba(var(--primary),0.3)] group"
                  >
                    <Play className="w-4 h-4 mr-3 fill-current group-hover:scale-110 transition-transform" /> Start Protocol <span className="ml-2 text-[9px] opacity-60 font-normal">(⌘↵)</span>
                  </Button>
                ) : (
                  <Button
                    onClick={stopStream}
                    variant="destructive"
                    className="rounded-2xl flex justify-center items-center h-14 px-8 font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_15px_40px_rgba(239,68,68,0.3)] animate-pulse"
                  >
                    <Square className="w-4 h-4 mr-3 fill-current" /> Stop Stream
                  </Button>
                )}

                <Button
                  onClick={() => { setRows([]); setColumns([]); }}
                  variant="outline"
                  className="rounded-2xl h-14 px-8 border-foreground/20 dark:border-foreground/10 text-foreground/80 dark:text-foreground/60 font-black uppercase text-[11px] tracking-widest hover:bg-foreground/5 transition-all shadow-sm"
                >
                  Clear Buffer
                </Button>
              </div>
              <div className="flex items-center text-[11px] font-black uppercase tracking-widest text-foreground/50 dark:text-muted-foreground mr-4">
                <div className="flex items-center">
                  <TableIcon className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-black text-foreground mx-1">{stats.totalRows}</span> <span className="italic">rows</span>
                </div>
                <div className="flex items-center ml-4">
                  <Activity className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-black text-foreground mx-1">{stats.rowsPerSec}</span> <span className="italic">r/s</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StreamingDataTable
        rows={rows}
        columns={columns}
        isStreaming={isStreaming}
      />

      {isStreaming && (
        <Progress value={Math.min(100, stats.rowsPerSec)} className="h-1 animate-pulse" />
      )}
    </div>
  );
};

export default SQLStreamer;
