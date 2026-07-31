import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Zap, Rocket, Shield, Activity, Database, Cpu, 
    ChevronRight, Github, Terminal, Layers, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Docs() {
    const sections = [
        {
            id: 'quick-start',
            title: 'Quick Start',
            icon: <Rocket className="h-5 w-5 text-primary" />,
            content: (
                <div className="space-y-6">
                    <p className="text-foreground/50 dark:text-foreground/40 font-bold leading-relaxed tracking-tight">
                        SQL STREAM is engineered for zero-artifact database migrations. Connect MySQL, Oracle, or SQL Server directly and stream to PostgreSQL with zero-downtime.
                    </p>
                    <div className="bg-slate-900/90 dark:bg-slate-900/40 rounded-[2.5rem] border border-foreground/10 dark:border-white/5 p-8 font-mono text-[11px] group relative overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 opacity-40">
                            <Terminal className="w-3 h-3 text-primary" />
                            <span className="uppercase tracking-[0.2em] font-black text-white dark:text-foreground">Terminal</span>
                        </div>
                        <p className="text-primary/80 dark:text-primary/60 mb-2 font-black italic"># Initialize a live migration stream</p>
                        <p className="text-white dark:text-foreground font-black tracking-tight flex items-center gap-2">
                             <span className="text-primary transition-transform group-hover:translate-x-1">$</span>
                             php artisan convert:stream --source=oracle --target=pgsql
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'source-adapters',
            title: 'Source Fabric',
            icon: <Database className="h-5 w-5 text-blue-400" />,
            content: (
                <div className="space-y-6">
                    <p className="text-foreground/50 dark:text-foreground/40 font-bold leading-relaxed tracking-tight">Our enterprise adapter fabric supports high-fidelity transpilation from diverse engines:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'Postgres Node', desc: 'Atomic synchronization and real-time SSE streaming for PG targets.' },
                            { name: 'MySQL Node', desc: 'Full support for Enums, JSONB, and complex spatial types.' },
                            { name: 'Oracle Node', desc: 'Automatic mapping of RAW, CLOB, and NUMBER(p,s) to native PG types.' },
                            { name: 'T-SQL Node', desc: 'SQL Server conversion with bracketed identifier normalization.' },
                            { name: 'SQLite Node', desc: 'Lightweight local database migration using sqlite_master catalogs.' }
                        ].map(f => (
                            <Card key={f.name} className="p-6 rounded-[2rem] bg-background dark:bg-foreground/[0.02] border-foreground/10 dark:border-foreground/5 hover:border-primary/20 transition-all group shadow-sm hover:shadow-lg">
                                <h6 className="font-black text-[10px] uppercase tracking-widest mb-3 text-primary italic">{f.name}</h6>
                                <p className="text-[10px] text-foreground/60 dark:text-foreground/40 leading-relaxed font-bold tracking-tight">{f.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'ai-index-advisor',
            title: 'Neural Engine',
            icon: <Cpu className="h-5 w-5 text-emerald-400" />,
            content: (
                <div className="space-y-6">
                    <p className="text-foreground/50 dark:text-foreground/40 font-bold leading-relaxed tracking-tight">Leverage Google Gemini to optimize your target PostgreSQL architecture. NTE scans your source schema and suggests indexing strategies.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { label: 'GIN Indexing', desc: 'Optimized for JSONB containment and full-text search.' },
                            { label: 'BRIN Strategy', desc: 'Block Range Indexing for massive time-series datasets.' },
                            { label: 'Partial Scans', desc: 'Index only rows your node actually prioritizes.' },
                            { label: 'Neural Rationale', desc: 'Justifications for every proposed DDL modification.' }
                        ].map(item => (
                            <div key={item.label} className="p-5 rounded-3xl bg-background dark:bg-foreground/[0.02] border border-foreground/10 dark:border-foreground/5 hover:bg-primary/5 transition-all group shadow-sm">
                                <h6 className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">{item.label}</h6>
                                <p className="text-[10px] text-foreground/60 dark:text-foreground/40 font-bold leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'identity-federation',
            title: 'Identity Hub',
            icon: <Shield className="h-5 w-5 text-emerald-400" />,
            content: (
                <div className="space-y-6">
                    <p className="text-foreground/40 font-bold leading-relaxed tracking-tight">Instant node establishment via enterprise-grade identity providers. Connect your engineering profile seamlessly.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { label: 'GitHub OAuth', desc: 'Quick-access authorization via established developer profiles.' },
                            { label: 'Google SSO', desc: 'Standardized enterprise authentication for large clusters.' },
                            { label: 'Persistent ACL', desc: 'User-to-node permissions are maintained across sessions.' },
                            { label: 'Node Secrets', desc: 'Social tokens are encrypted and strictly managed.' }
                        ].map(item => (
                            <div key={item.label} className="p-5 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.02] border border-foreground/10 dark:border-foreground/5 hover:bg-primary/5 transition-all group shadow-sm">
                                <h6 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2 tracking-widest">{item.label}</h6>
                                <p className="text-[10px] text-foreground/50 dark:text-foreground/40 font-bold leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        }
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                        Engineering Documentation
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        System Hub
                    </h2>
                </div>
            }
        >
            <Head>
                <title>Engineering Documentation | SQL STREAM Guide</title>
                <meta name="description" content="Technical specifications and quick-start guides for the SQL STREAM high-performance migration ecosystem." />
            </Head>

            <div className="py-6 flex flex-col md:flex-row gap-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-24">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0">
                    <div className="sticky top-32 space-y-10">
                        <div className="space-y-6">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-4">Node Directory</div>
                            <nav className="flex flex-col gap-1">
                                {sections.map(s => (
                                    <a 
                                        key={s.id} 
                                        href={`#${s.id}`} 
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-foreground/5 transition-all text-[11px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 hover:text-foreground group"
                                    >
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all scale-0 group-hover:scale-100" />
                                        {s.title}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        <Card className="p-8 glass-card rounded-[3rem] border-foreground/10 dark:border-white/5 space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform">
                                <Info className="w-12 h-12 text-primary shadow-glow-primary" />
                            </div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground leading-tight">Need Node<br />Clearance?</h5>
                            <p className="text-[9px] text-foreground/60 dark:text-foreground/40 font-bold leading-relaxed">Join our enterprise cluster for 24/7 technical oversight and architectural reviews.</p>
                            <Link href="/support" className="block">
                                <Button variant="outline" className="w-full rounded-2xl text-[9px] font-black uppercase tracking-widest border-primary/20 h-11 hover:bg-primary/5 hover:text-primary transition-all">Support Desk</Button>
                            </Link>
                        </Card>
                    </div>
                </aside>

                {/* Documentation Content */}
                <div className="flex-1 space-y-24">
                    <section className="space-y-6 max-w-2xl">
                        <h1 className="text-6xl font-black tracking-tighter leading-none text-foreground uppercase italic px-1">
                            Engineering <span className="text-primary italic">The Node.</span>
                        </h1>
                        <p className="text-xl text-foreground/50 dark:text-foreground/40 font-bold leading-relaxed tracking-tight">
                            Master the high-performance SQL STREAM ecosystem. From complex structural transpilation to zero-downtime mission orchestration.
                        </p>
                    </section>

                    {sections.map(section => (
                        <motion.section 
                            key={section.id} 
                            id={section.id} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-10 scroll-mt-32"
                        >
                            <div className="flex items-center gap-6 group">
                                <div className="p-4 bg-foreground/5 rounded-[1.8rem] border border-foreground/10 group-hover:border-primary/20 transition-all shadow-xl">
                                    {section.icon}
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">{section.title}</h2>
                            </div>
                            <div className="pl-2 border-l border-foreground/5 ml-2">
                                {section.content}
                            </div>
                        </motion.section>
                    ))}

                    <footer className="pt-20 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-8 text-foreground/20">
                         <div className="flex items-center gap-3">
                            <Database className="h-4 w-4" />
                            <div className="h-px w-8 bg-foreground/10" />
                            <Shield className="h-4 w-4" />
                             <div className="h-px w-8 bg-foreground/10" />
                            <Zap className="h-4 w-4" />
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.4em]">© 2026 SQL STREAM INFRASTRUCTURE</div>
                    </footer>
                </div>
            </div>

            <style>{`
                html { scroll-behavior: smooth; }
            `}</style>
        </AuthenticatedLayout>
    );
}
