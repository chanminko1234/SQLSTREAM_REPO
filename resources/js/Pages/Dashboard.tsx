import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Zap, Activity, ShieldCheck,
    ArrowUpRight, Clock, Server, Layers,
    TrendingUp, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SQLStreamer } from '@/components/SQLStreamer';

export default function Dashboard() {
    const stats = [
        { label: 'Migration Streams', value: '12 Active', icon: <Zap className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'System Throughput', value: '850 MB/s', icon: <Activity className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Database Integrity', value: '100% Parity', icon: <ShieldCheck className="h-4 w-4" />, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { label: 'Active Infrastructure', value: '24 Nodes', icon: <Server className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                            Infrastructure Overview
                        </Badge>
                        <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic px-1">
                            Node Control Center
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            onClick={() => {
                                const telemetryData = {
                                    timestamp: new Date().toISOString(),
                                    nodes: 24,
                                    throughput: '850 MB/s',
                                    integrity: '100% Parity',
                                    active_streams: 12,
                                    status: 'HYPER-OPERATIONAL'
                                };
                                const blob = new Blob([JSON.stringify(telemetryData, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `sql-stream-telemetry-${Date.now()}.json`;
                                a.click();
                            }}
                            variant="outline" 
                            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-foreground/20 dark:border-white/10 hover:bg-foreground/5 bg-background dark:bg-background/50 backdrop-blur-xl transition-all shadow-sm text-foreground/80 hover:text-foreground"
                        >
                            Export Telemetry
                        </Button>
                        <Link href="/orchestrator">
                            <Button className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                Launch Sync
                            </Button>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head>
                <title>Control Center | SQL STREAM Dashboard</title>
                <meta name="description" content="Manage your database migration streams and monitor system throughput in real-time with the SQL STREAM control center." />
            </Head>

            <div className="py-6 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="glass-card p-6 border-foreground/10 dark:border-white/5 rounded-[2rem] hover:border-primary/20 transition-all group shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { className: "w-24 h-24" })}
                                </div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
                                        <TrendingUp className="w-3 h-3" />
                                    </div>
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/70 dark:text-foreground/40 mb-1">{stat.label}</h3>
                                <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Interactive Query Streamer
                            </h3>
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5">Prototype Engine v1.0</Badge>
                        </div>

                        <SQLStreamer
                            initialQuery="SELECT * FROM migrations LIMIT 10"
                            sourceType="postgresql"
                            connectionConfig={{
                                host: '127.0.0.1',
                                port: '5432',
                                user: 'postgres',
                                db: 'sql_stream'
                            }}
                        />
                    </motion.div>

                    {/* Quick Access */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2 px-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Fast Response
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { title: 'Orchestrator', desc: 'Manage binary log sync', color: 'bg-primary' },
                                { title: 'Validation', desc: 'Run integrity parity check', color: 'bg-teal-500' },
                                { title: 'Index Advisor', desc: 'Optimize query throughput', color: 'bg-emerald-500' },
                                { title: 'System Docs', desc: 'Review node protocols', color: 'bg-slate-700' },
                            ].map((item, i) => (
                                <Card key={i} className="glass-card p-6 border-foreground/10 dark:border-white/5 rounded-[2rem] hover:bg-foreground/[0.03] transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary shadow-lg dark:shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${item.color}/10 flex items-center justify-center text-foreground`}>
                                            <ArrowUpRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-colors" />
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                                    <p className="text-[10px] font-bold text-foreground/70 dark:text-foreground/40">{item.desc}</p>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
            `}</style>
        </AuthenticatedLayout>
    );
}
