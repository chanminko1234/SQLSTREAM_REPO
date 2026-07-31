import React, { useRef, useEffect, useState } from 'react';
import { diffLines, Change } from 'diff';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Database, Zap, ArrowRight, Activity, Search } from 'lucide-react';

interface DiffExplorerProps {
  oldCode: string;
  newCode: string;
}

export const DiffExplorer: React.FC<DiffExplorerProps> = ({ oldCode, newCode }) => {
  const [diffParts, setDiffParts] = useState<Change[]>([]);
  const [viewMode, setViewMode] = useState<'diff' | 'rollback' | 'laravel'>('diff');
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync scrolling
    const left = leftRef.current;
    const right = rightRef.current;

    const handleLeftScroll = () => { if (right && left) right.scrollTop = left.scrollTop; };
    const handleRightScroll = () => { if (left && right) left.scrollTop = right.scrollTop; };

    left?.addEventListener('scroll', handleLeftScroll);
    right?.addEventListener('scroll', handleRightScroll);

    return () => {
      left?.removeEventListener('scroll', handleLeftScroll);
      right?.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  useEffect(() => {
    if (oldCode && newCode) {
        setDiffParts(diffLines(oldCode, newCode));
    }
  }, [oldCode, newCode]);

  const generateRollbackSql = (pgCode: string) => {
    const tableMatches = [...pgCode.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?([^\s(]+)/gi)];
    if (tableMatches.length === 0) return '-- No CREATE TABLE statements found to generate rollback.';
    return '-- Transactional Rollback Script (down.sql)\nBEGIN;\n\n' +
      tableMatches.map(m => `DROP TABLE IF EXISTS ${m[1]} CASCADE;`).join('\n') +
      '\n\nCOMMIT;';
  };

  const generateLaravelMigration = (pgCode: string) => {
    const tableMatches = [...pgCode.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?([^\s(]+)/gi)];
    const tableName = tableMatches[0]?.[1]?.replace(/["`]/g, '') || 'target_table';
    return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations on target PostgreSQL engine.
     */
    public function up(): void
    {
        DB::statement(<<<SQL
${pgCode}
SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
${generateRollbackSql(pgCode).split('\n').map(l => '        // ' + l).join('\n')}
    }
};`;
  };

  const generatePrismaSchema = (pgCode: string) => {
    const tableMatches = [...pgCode.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?([^\s(]+)\s*\(([\s\S]*?)\);/gi)];
    let models = `// Prisma Schema (schema.prisma)\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;
    if (tableMatches.length === 0) return models + '// No tables detected in schema.';
    for (const m of tableMatches) {
      const rawName = m[1].replace(/["`]/g, '');
      const modelName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      models += `model ${modelName} {\n`;
      const colLines = m[2].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('PRIMARY KEY') && !l.startsWith('FOREIGN KEY') && !l.startsWith('CONSTRAINT'));
      colLines.forEach(line => {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const fieldName = parts[0].replace(/["`]/g, '');
          const fieldType = parts[1].toLowerCase();
          let pType = 'String';
          if (fieldType.includes('int')) pType = 'Int';
          else if (fieldType.includes('bool')) pType = 'Boolean';
          else if (fieldType.includes('time') || fieldType.includes('date')) pType = 'DateTime';
          else if (fieldType.includes('decimal') || fieldType.includes('numeric') || fieldType.includes('float')) pType = 'Float';
          else if (fieldType.includes('json')) pType = 'Json';

          const isPk = line.toUpperCase().includes('PRIMARY KEY') || fieldName === 'id';
          const isAuto = line.toUpperCase().includes('AUTO_INCREMENT') || line.toUpperCase().includes('SERIAL');
          models += `  ${fieldName.padEnd(16)} ${pType}${isPk ? ' @id' : ''}${isAuto ? ' @default(autoincrement())' : ''}\n`;
        }
      });
      models += `  @@map("${rawName}")\n}\n\n`;
    }
    return models;
  };

  const generateDrizzleSchema = (pgCode: string) => {
    const tableMatches = [...pgCode.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?([^\s(]+)\s*\(([\s\S]*?)\);/gi)];
    let drizzle = `// Drizzle ORM Schema (schema.ts)\nimport { pgTable, serial, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";\n\n`;
    if (tableMatches.length === 0) return drizzle + '// No tables detected in schema.';
    for (const m of tableMatches) {
      const rawName = m[1].replace(/["`]/g, '');
      drizzle += `export const ${rawName} = pgTable("${rawName}", {\n`;
      const colLines = m[2].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('PRIMARY KEY') && !l.startsWith('FOREIGN KEY') && !l.startsWith('CONSTRAINT'));
      colLines.forEach(line => {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const fieldName = parts[0].replace(/["`]/g, '');
          const fieldType = parts[1].toLowerCase();
          if (fieldName === 'id' || line.toUpperCase().includes('SERIAL') || line.toUpperCase().includes('AUTO_INCREMENT')) {
            drizzle += `  ${fieldName}: serial("${fieldName}").primaryKey(),\n`;
          } else if (fieldType.includes('bool')) {
            drizzle += `  ${fieldName}: boolean("${fieldName}").default(true),\n`;
          } else if (fieldType.includes('time') || fieldType.includes('date')) {
            drizzle += `  ${fieldName}: timestamp("${fieldName}").defaultNow(),\n`;
          } else if (fieldType.includes('int')) {
            drizzle += `  ${fieldName}: integer("${fieldName}"),\n`;
          } else if (fieldType.includes('json')) {
            drizzle += `  ${fieldName}: json("${fieldName}"),\n`;
          } else {
            drizzle += `  ${fieldName}: text("${fieldName}"),\n`;
          }
        }
      });
      drizzle += `});\n\n`;
    }
    return drizzle;
  };

  const generateDockerCompose = () => {
    return `# Production Docker Compose for PostgreSQL 16 + pgAdmin4
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: sqlstream_postgres
    restart: always
    environment:
      POSTGRES_DB: target_db
      POSTGRES_USER: sqlstream
      POSTGRES_PASSWORD: supersecretpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sqlstream -d target_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: sqlstream_pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@sqlstream.local
      PGADMIN_DEFAULT_PASSWORD: adminpassword
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  pgdata:
`;
  };

  if (!oldCode || !newCode) {
      return (
        <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center gap-4 bg-[#0d1117]/50 rounded-3xl border border-white/5">
          <Search className="h-16 w-16 mb-4" />
          <p className="font-bold text-sm uppercase tracking-[0.2em]">Generate SQL to view structural Delta</p>
        </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:block">
          <div className="bg-primary/20 backdrop-blur-xl p-3 rounded-full border border-primary/40 shadow-[0_0_50px_rgba(109,40,217,0.5)] flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
          </div>
      </div>

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-xl">
                <Database className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">MySQL Source</span>
          </div>
          <span className="text-white/20 font-bold">→</span>
          <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">PostgreSQL Target</span>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 gap-1 flex-wrap">
          <button
            onClick={() => setViewMode('diff')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === 'diff' ? 'bg-primary text-primary-foreground shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <Activity className="w-3 h-3" /> Live Diff
          </button>
          <button
            onClick={() => setViewMode('rollback')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === 'rollback' ? 'bg-amber-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <Zap className="w-3 h-3" /> Rollback (down.sql)
          </button>
          <button
            onClick={() => setViewMode('laravel')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === 'laravel' ? 'bg-emerald-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <Database className="w-3 h-3" /> Laravel
          </button>
          <button
            onClick={() => setViewMode('prisma' as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === ('prisma' as any) ? 'bg-teal-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <Zap className="w-3 h-3" /> Prisma
          </button>
          <button
            onClick={() => setViewMode('drizzle' as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === ('drizzle' as any) ? 'bg-cyan-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <Zap className="w-3 h-3" /> Drizzle ORM
          </button>
          <button
            onClick={() => setViewMode('docker' as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === ('docker' as any) ? 'bg-blue-500 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <Database className="w-3 h-3" /> Docker
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {viewMode === 'diff' ? (
        <div className="flex-1 overflow-hidden grid grid-cols-2 relative bg-[#0d1117]">
          {/* LEFT COLUMN: MySQL */}
          <div 
            ref={leftRef} 
            className="overflow-auto border-r border-white/5 custom-scrollbar"
          >
            <div className="p-6">
               {diffParts.map((part, i) => {
                   if (part.added) return null;
                   return (
                      <div key={i} className={`${part.removed ? 'bg-red-500/10 border-l-2 border-red-500 animate-in fade-in slide-in-from-left-2 duration-500' : 'opacity-40'} whitespace-pre-wrap font-mono text-[12px] leading-relaxed px-3 py-1 rounded-sm mb-1`}>
                          <SyntaxHighlighter
                              language="sql"
                              style={vscDarkPlus}
                              customStyle={{ background: 'transparent', padding: 0, margin: 0, fontSize: 'inherit' }}
                          >
                              {part.value}
                          </SyntaxHighlighter>
                      </div>
                   );
               })}
            </div>
          </div>

          {/* RIGHT COLUMN: PostgreSQL */}
          <div 
            ref={rightRef} 
            className="overflow-auto custom-scrollbar"
          >
            <div className="p-6">
              {diffParts.map((part, i) => {
                   if (part.removed) return null;
                   return (
                      <div key={i} className={`${part.added ? 'bg-green-500/10 border-l-2 border-green-500 animate-in fade-in slide-in-from-right-2 duration-500' : 'opacity-40'} whitespace-pre-wrap font-mono text-[12px] leading-relaxed px-3 py-1 rounded-sm mb-1`}>
                          <SyntaxHighlighter
                              language="sql"
                              style={vscDarkPlus}
                              customStyle={{ background: 'transparent', padding: 0, margin: 0, fontSize: 'inherit' }}
                          >
                              {part.value}
                          </SyntaxHighlighter>
                      </div>
                   );
               })}
            </div>
          </div>
        </div>
      ) : viewMode === 'rollback' ? (
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117] custom-scrollbar font-mono text-[13px]">
          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl mb-4 text-amber-300 text-xs font-sans">
            <strong>Reversible Migration:</strong> Execute this transactional script on PostgreSQL if you need to cleanly revert or drop transpiled target tables.
          </div>
          <SyntaxHighlighter language="sql" style={vscDarkPlus} customStyle={{ background: 'transparent', padding: 0 }}>
            {generateRollbackSql(newCode)}
          </SyntaxHighlighter>
        </div>
      ) : viewMode === 'laravel' ? (
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117] custom-scrollbar font-mono text-[13px]">
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl mb-4 text-emerald-300 text-xs font-sans">
            <strong>Laravel Migration:</strong> Copy & paste this class directly into `database/migrations/` in your Laravel project.
          </div>
          <SyntaxHighlighter language="php" style={vscDarkPlus} customStyle={{ background: 'transparent', padding: 0 }}>
            {generateLaravelMigration(newCode)}
          </SyntaxHighlighter>
        </div>
      ) : viewMode === ('prisma' as any) ? (
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117] custom-scrollbar font-mono text-[13px]">
          <div className="bg-teal-500/5 border border-teal-500/20 p-4 rounded-xl mb-4 text-teal-300 text-xs font-sans">
            <strong>Prisma ORM Schema:</strong> Paste this schema into `prisma/schema.prisma`.
          </div>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ background: 'transparent', padding: 0 }}>
            {generatePrismaSchema(newCode)}
          </SyntaxHighlighter>
        </div>
      ) : viewMode === ('drizzle' as any) ? (
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117] custom-scrollbar font-mono text-[13px]">
          <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl mb-4 text-cyan-300 text-xs font-sans">
            <strong>Drizzle ORM Schema:</strong> Paste this schema into your Drizzle model file `src/db/schema.ts`.
          </div>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ background: 'transparent', padding: 0 }}>
            {generateDrizzleSchema(newCode)}
          </SyntaxHighlighter>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117] custom-scrollbar font-mono text-[13px]">
          <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl mb-4 text-blue-300 text-xs font-sans">
            <strong>Docker Compose Stack:</strong> Run `docker compose up -d` to launch a PostgreSQL 16 + pgAdmin4 cluster initialized with your target schema.
          </div>
          <SyntaxHighlighter language="yaml" style={vscDarkPlus} customStyle={{ background: 'transparent', padding: 0 }}>
            {generateDockerCompose()}
          </SyntaxHighlighter>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
};
