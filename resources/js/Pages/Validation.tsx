import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ShieldCheck, Zap, Server, Activity, Database, RefreshCcw, 
    CheckCircle2, XCircle, Loader2, Search, Info, Settings2,
    Lock, Unlock, Cpu, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

export default function Validation() {
    const [sourceConn, setSourceConn] = useState({ host: 'localhost', port: '3306', user: '', pass: '', db: '' });
    const [targetConn, setTargetConn] = useState({ host: 'localhost', port: '5432', user: '', pass: '', db: '' });
    const [sourceType, setSourceType] = useState('mysql');
    const [isValidating, setIsValidating] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleValidate = async () => {
        if (!sourceConn.db || !targetConn.db) {
            toast.error('Both Source and Target database details are required.');
            return;
        }

        setIsValidating(true);
        setResults(null);

        try {
            const response = await axios.post('/convert/validate', {
                source: sourceConn,
                source_type: sourceType,
                target: targetConn
            });

            if (response.data.success) {
                setResults(response.data.data);
                toast.success('Integrity validation completed.');
            } else {
                throw new Error(response.data.error);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Validation failed');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                        Data Integrity Laboratory
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        Parity Audit System
                    </h2>
                </div>
            }
        >
            <Head>
                <title>Data Integrity Labs | Parity Audit System</title>
                <meta name="description" content="Verify data parity and execute cryptographic checksum audits between sharded database nodes." />
            </Head>

            <div className="py-6 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-24">
                {/* Intro Section */}
                <section className="space-y-6 max-w-2xl">
                    <h1 className="text-6xl font-black tracking-tighter leading-none text-foreground uppercase italic px-1">
                        Audit & <span className="text-primary italic">Verify.</span>
                    </h1>
                    <p className="text-xl text-foreground/40 font-bold leading-relaxed tracking-tight">
                        Verify row counts and sample checksums between source and target nodes with cryptographic precision and sharded parity checks.
                    </p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Setup Column */}
                    <div className="lg:col-span-5 space-y-8">
                        <Card className="glass-card rounded-[3.5rem] p-10 border-foreground/5 dark:border-white/5 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                                <Server className="h-24 w-24 text-primary" />
                            </div>
                            
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 ring-1 ring-primary/30">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-foreground leading-none">Source Node</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Engine Typology</Label>
                                    <select
                                        className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none shadow-sm"
                                        value={sourceType}
                                        onChange={(e) => setSourceType(e.target.value)}
                                    >
                                        <option value="mysql">MySQL Engine</option>
                                        <option value="oracle">Oracle Database</option>
                                        <option value="sqlserver">SQL Server (MSSQL)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Host</Label>
                                        <input
                                            className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none italic shadow-sm placeholder:text-foreground/20"
                                            value={sourceConn.host}
                                            onChange={e => setSourceConn({ ...sourceConn, host: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Port</Label>
                                        <input
                                            className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none italic shadow-sm placeholder:text-foreground/20"
                                            value={sourceConn.port}
                                            onChange={e => setSourceConn({ ...sourceConn, port: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Identity (Namespace)</Label>
                                    <input
                                        className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none italic shadow-sm placeholder:text-foreground/40 dark:placeholder:text-foreground/20"
                                        value={sourceConn.db}
                                        onChange={e => setSourceConn({ ...sourceConn, db: e.target.value })}
                                        placeholder="DATABASE_NAME"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="glass-card rounded-[3.5rem] p-10 border-foreground/5 dark:border-white/5 relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                                <Zap className="h-24 w-24 text-emerald-500" />
                            </div>
                            
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 ring-1 ring-emerald-500/30">
                                    <RefreshCcw className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-foreground leading-none">Target Node</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Host</Label>
                                        <input
                                            className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-emerald-500 transition-all outline-none italic shadow-sm"
                                            value={targetConn.host}
                                            onChange={e => setTargetConn({ ...targetConn, host: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Port</Label>
                                        <input
                                            className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-emerald-500 transition-all outline-none italic shadow-sm"
                                            value={targetConn.port}
                                            onChange={e => setTargetConn({ ...targetConn, port: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20 ml-2">Target Registry</Label>
                                    <input
                                        className="w-full bg-background dark:bg-white/[0.02] border border-foreground/10 dark:border-white/10 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-emerald-500 transition-all outline-none italic shadow-sm placeholder:text-foreground/40 dark:placeholder:text-foreground/20"
                                        value={targetConn.db}
                                        onChange={e => setTargetConn({ ...targetConn, db: e.target.value })}
                                        placeholder="POSTGRES_DB"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Button
                            className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_60px_rgba(var(--primary),0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 ring-1 ring-white/20"
                            onClick={handleValidate}
                            disabled={isValidating}
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Scanning Global Nodes...
                                </>
                            ) : (
                                <>
                                    <Search className="h-5 w-5" />
                                    Initiate Parity Scan
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-7">
                        <Card className="glass-card rounded-[4rem] border-foreground/5 dark:border-white/5 min-h-[700px] shadow-2xl relative overflow-hidden flex flex-col group/results">
                            <AnimatePresence mode="wait">
                                {!results && !isValidating && (
                                    <motion.div 
                                        key="standby"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10"
                                    >
                                        <div className="h-32 w-32 rounded-[2.5rem] bg-foreground/[0.02] flex items-center justify-center border border-foreground/5 shadow-inner relative">
                                            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                                            <Activity className="h-12 w-12 text-foreground/20 relative z-10" />
                                        </div>
                                        <div className="space-y-4 max-w-sm">
                                            <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none">Audit Standby</h3>
                                            <p className="text-foreground/30 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                                                Provide node connection parameters to begin the cryptographic parity verification sequence.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {isValidating && (
                                    <motion.div 
                                        key="validating"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12"
                                    >
                                        <div className="relative">
                                            <div className="h-40 w-40 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground animate-pulse">Scanning Parity...</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 justify-center">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                                Analyzing Binary Deltas
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {results && (
                                    <motion.div 
                                        key="results"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex-1 flex flex-col overflow-hidden"
                                    >
                                        <div className="p-12 border-b border-foreground/5 space-y-10">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none">Cluster Report</h3>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">Operational Parity Score</p>
                                                </div>
                                                <Button 
                                                    variant="ghost"
                                                    onClick={() => setResults(null)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-primary transition-colors"
                                                >
                                                    Discard Analysis
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-8">
                                                <Card className="p-8 bg-emerald-500/5 rounded-[2.5rem] border-emerald-500/10 text-center shadow-glow-emerald">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/40 mb-2">Verified</p>
                                                    <p className="text-4xl font-black text-emerald-500 tracking-tighter leading-none italic">{results.summary.passed}</p>
                                                </Card>
                                                <Card className="p-8 bg-red-500/5 rounded-[2.5rem] border-red-500/10 text-center shadow-glow-red">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500/40 mb-2">Diverged</p>
                                                    <p className="text-4xl font-black text-red-500 tracking-tighter leading-none italic">{results.summary.failed}</p>
                                                </Card>
                                                <Card className="p-8 bg-foreground/[0.02] rounded-[2.5rem] border-foreground/5 text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-2">Objects</p>
                                                    <p className="text-4xl font-black text-foreground tracking-tighter leading-none italic">{results.summary.total_tables}</p>
                                                </Card>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-6">
                                            {results.results.map((r: any, i: number) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="p-8 rounded-[3rem] bg-foreground/[0.02] border border-foreground/5 hover:bg-foreground/[0.04] transition-all group/item relative overflow-hidden"
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${r.status === 'passed' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                                                {r.status === 'passed' ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="font-black text-lg tracking-tighter uppercase italic text-foreground leading-none">{r.table}</h4>
                                                                <p className={`text-[10px] font-black uppercase tracking-widest ${r.status === 'passed' ? 'text-emerald-500/60' : 'text-red-500/60'}`}>{r.message}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-10 items-center">
                                                            <div className="text-right space-y-1">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 leading-none mb-1">Source Node</p>
                                                                <p className={`font-black text-lg tracking-tighter italic ${r.source_count !== r.target_count ? 'text-red-400' : 'text-foreground/60'}`}>{r.source_count}</p>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 leading-none mb-1">Target Sink</p>
                                                                <p className="font-black text-lg tracking-tighter italic text-foreground leading-none">{r.target_count}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsla(var(--foreground), 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsla(var(--foreground), 0.1); }
                .shadow-glow-emerald { box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.2); }
                .shadow-glow-red { box-shadow: 0 10px 30px -10px rgba(239, 68, 68, 0.2); }
            `}</style>
        </AuthenticatedLayout>
    );
}
