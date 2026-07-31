import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Activity, Zap, Server, Clock, MessageSquare, Cpu, 
    RefreshCcw, Globe, Rocket, Shield, Info, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Status() {
    const services = [
        { name: 'Adapter Fabric', status: 'operational', uptime: '100%', latency: '12ms', icon: <Server /> },
        { name: 'SSE Streamer Node', status: 'operational', uptime: '100%', latency: '02ms', icon: <Zap /> },
        { name: 'Mission Orchestrator', status: 'operational', uptime: '100%', latency: '04ms', icon: <Rocket /> },
        { name: 'Neural Advisor', status: 'operational', uptime: '99.96%', latency: '412ms', icon: <Cpu /> },
        { name: 'Audit Pipeline', status: 'operational', uptime: '99.99%', latency: '29ms', icon: <Activity /> },
        { name: 'Sync Worker Node', status: 'operational', uptime: '100%', latency: '08ms', icon: <RefreshCcw /> },
        { name: 'Identity Federation', status: 'operational', uptime: '99.99%', latency: '15ms', icon: <Shield /> },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-lg shadow-emerald-500/5"
                    >
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        Hyper-Operational: ALL NODES ONLINE
                    </motion.div>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        Network Status
                    </h2>
                </div>
            }
        >
            <Head>
                <title>Network Status | SQL STREAM Health Grid</title>
                <meta name="description" content="Real-time observability and health monitoring for all sharded nodes within the SQL STREAM global infrastructure." />
            </Head>

            <div className="py-6 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-24">
                {/* Status Hero Section */}
                <section className="space-y-6 max-w-2xl">
                    <h1 className="text-6xl font-black tracking-tighter leading-none text-foreground uppercase italic px-1">
                        Infrastructure <span className="text-primary italic">Health Grid.</span>
                    </h1>
                    <p className="text-xl text-foreground/40 font-bold leading-relaxed tracking-tight">
                        Real-time performance metrics for the SQL STREAM globally distributed transformation network. Peak capacity guaranteed across all sharded nodes.
                    </p>
                </section>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((s, i) => (
                        <motion.div
                            key={s.name}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="glass-card rounded-[2.5rem] p-10 border-foreground/5 dark:border-white/5 hover:border-primary/20 transition-all group overflow-hidden shadow-2xl relative">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">
                                    {React.isValidElement(s.icon) && React.cloneElement(s.icon as React.ReactElement<any>, { className: "h-32 w-32" })}
                                </div>
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div className="h-14 w-14 bg-foreground/5 dark:bg-white/5 rounded-2xl border border-foreground/10 dark:border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors ring-1 ring-white/5">
                                        {React.isValidElement(s.icon) && React.cloneElement(s.icon as React.ReactElement<any>, { className: "h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" })}
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black tracking-widest px-4 py-1.5 rounded-xl uppercase shadow-glow-emerald">
                                        {s.status}
                                    </Badge>
                                </div>
                                <h3 className="font-black mb-2 text-xl tracking-tighter relative z-10 text-foreground uppercase italic leading-none">{s.name}</h3>
                                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-foreground/40 dark:text-foreground/20 mb-8 relative z-10">Engine Readiness Verified</p>
                                
                                <div className="flex items-center justify-between pt-8 border-t border-foreground/10 dark:border-white/5 relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-foreground/40 dark:text-foreground/20 uppercase tracking-[0.2em]">Global Uptime</p>
                                        <p className="font-black text-[12px] text-emerald-500 tracking-tighter">{s.uptime}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[8px] font-black text-foreground/40 dark:text-foreground/20 uppercase tracking-[0.2em]">IO Latency</p>
                                        <p className="font-black text-[12px] text-foreground tracking-tighter">{s.latency}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Pulse Visualizer */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground text-foreground">Response Matrix</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary/60 dark:bg-primary/40 animate-pulse" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/20">Updated: T+30s</p>
                        </div>
                    </div>
                    
                    <Card className="glass-card rounded-[3.5rem] border-foreground/10 dark:border-white/5 p-12 h-96 flex items-end gap-1.5 overflow-hidden relative shadow-2xl group shadow-inner">
                        {Array.from({ length: 80 }).map((_, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.floor(Math.random() * 60) + 40}%` }}
                                transition={{ delay: i * 0.005, duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                className="flex-1 bg-primary/20 dark:bg-primary/10 group-hover:bg-primary/30 transition-all rounded-t-lg shadow-[0_0_20px_rgba(var(--primary),0.05)]" 
                            />
                        ))}
                        <div className="absolute inset-x-0 bottom-0 p-10 flex justify-between items-center bg-background/95 dark:bg-background/95 via-background/60 to-transparent backdrop-blur-sm border-t border-foreground/10 dark:border-white/5">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/50 dark:text-white/30">
                                <Clock className="h-4 w-4 text-primary" />
                                Peak Node: 1x-B-4 • London Fabric
                            </div>
                            <div className="font-black text-[12px] text-primary tracking-tighter uppercase italic">1.48M Syncs / S</div>
                        </div>
                    </Card>
                </section>

                {/* Community Portal Footer */}
                <footer className="p-1.5 bg-gradient-to-r from-primary/10 via-emerald-500/15 to-primary/10 dark:from-primary/20 dark:via-emerald-500/25 dark:to-primary/20 rounded-[4rem] shadow-2xl relative">
                    <div className="p-14 rounded-[3.8rem] bg-background/80 dark:bg-background/60 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-12 border border-foreground/10 dark:border-white/5 overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform">
                            <Globe className="w-64 h-64 text-primary" />
                        </div>
                        <div className="flex items-center gap-10 relative z-10">
                            <div className="h-20 w-20 bg-primary/10 dark:bg-primary/20 rounded-[2.5rem] flex items-center justify-center ring-1 ring-primary/20 dark:ring-primary/30 shadow-2xl">
                                <MessageSquare className="text-primary h-10 w-10 shadow-glow-primary" />
                            </div>
                            <div className="text-center md:text-left space-y-2">
                                <h3 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">Engineering Hub</h3>
                                <p className="text-[11px] text-foreground/60 dark:text-foreground/40 font-bold uppercase tracking-widest">Connect with the developers behind the protocol.</p>
                            </div>
                        </div>
                        
                        <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer" className="relative z-10">
                            <Button className="group relative rounded-3xl px-12 h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_20px_60px_rgba(var(--primary),0.3)] ring-1 ring-foreground/10 dark:ring-white/20">
                                <span className="relative flex items-center gap-4">
                                    Join Core Community
                                    <Rocket className="h-4 w-4" />
                                </span>
                            </Button>
                        </a>
                    </div>
                </footer>
            </div>

            <style>{`
                .shadow-glow-emerald { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.2)); }
                .shadow-glow-primary { filter: drop-shadow(0 0 12px rgba(var(--primary), 0.4)); }
            `}</style>
        </AuthenticatedLayout>
    );
}
