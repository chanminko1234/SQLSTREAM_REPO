import React, { useState, useEffect } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Copy, Download, Upload, Settings,
  Github, Rocket, Eraser, Activity, Zap, Terminal, Search,
  Database, Server, Maximize2, Check, ShieldCheck, AlertOctagon, X,
  Menu, User, LogOut, ChevronDown
} from 'lucide-react';
import Dropdown from '@/components/Dropdown';
import { ConversionReport } from '@/lib/sqlConverter';
import { CodeHighlighter } from '@/components/ui/syntax-highlighter';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ERDVisualizer } from '@/components/ERDVisualizer';
import { DiffExplorer } from '@/components/DiffExplorer';
import { MigrationMapper } from '@/components/MigrationMapper';
import { LiveMigrationDashboard } from '@/components/LiveMigrationDashboard';

type TargetFormat = 'postgresql' | 'csv' | 'xlsx' | 'xls' | 'sqlite' | 'psql';

interface ConversionOptions {
  preserveIdentity: boolean;
  handleEnums: 'varchar' | 'check_constraint' | 'enum_table';
  handleSets: 'varchar' | 'array' | 'separate_table';
  timezoneHandling: 'utc' | 'local' | 'preserve';
  triggerHandling: 'convert' | 'comment' | 'skip';
  replaceHandling: 'upsert' | 'insert_ignore' | 'error';
  ignoreHandling: 'on_conflict_ignore' | 'skip' | 'error';
  schemaOnly: boolean;
  csvDelimiter: string;
  csvEnclosure: string;
  csvIncludeHeaders: boolean;
  excelSheetPerTable: boolean;
  excelIncludeMetadata: boolean;
  sqliteForeignKeys: boolean;
  sqliteWalMode: boolean;
  predictiveRefactoring: boolean;
  applyAiRefactoring: boolean;
  autoCleaning: boolean;
  incrementalSync: boolean;
  dataMasking: boolean;
  frameworkPreset: 'none' | 'wordpress' | 'laravel' | 'magento';
}

const Welcome: React.FC = () => {
  const { auth } = usePage<PageProps>().props;
  const [mysqlInput, setMysqlInput] = useState('');
  const [output, setOutput] = useState('');
  const [fullOutput, setFullOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionReport, setConversionReport] = useState<ConversionReport[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('postgresql');
  const [activeTab, setActiveTab] = useState('output');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rollbackScript, setRollbackScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [schemaData, setSchemaData] = useState<any[] | null>(null);
  const [isFullScreenERD, setIsFullScreenERD] = useState(false);
  const [isFullScreenMapper, setIsFullScreenMapper] = useState(false);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    preserveIdentity: true,
    handleEnums: 'check_constraint',
    handleSets: 'array',
    timezoneHandling: 'utc',
    triggerHandling: 'convert',
    replaceHandling: 'upsert',
    ignoreHandling: 'on_conflict_ignore',
    schemaOnly: false,
    csvDelimiter: ',',
    csvEnclosure: '"',
    csvIncludeHeaders: true,
    excelSheetPerTable: true,
    excelIncludeMetadata: false,
    sqliteForeignKeys: true,
    sqliteWalMode: true,
    predictiveRefactoring: true,
    applyAiRefactoring: false,
    autoCleaning: true,
    incrementalSync: false,
    dataMasking: false,
    frameworkPreset: 'none',
  });
  const [mode, setMode] = useState<'sql' | 'stream' | 'tuning'>('sql');
  const [inputMethod, setInputMethod] = useState<'manual' | 'live'>('manual');
  const [sourceConn, setSourceConn] = useState({ host: 'localhost', port: '3306', user: '', pass: '', db: '' });
  const [targetConn, setTargetConn] = useState({ host: 'localhost', port: '5432', user: '', pass: '', db: '' });
  const [queryInput, setQueryInput] = useState('');
  const [queryOutput, setQueryOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [tuningInput, setTuningInput] = useState({
    slow_query_log: '',
    ram_gb: 16,
    cpu_cores: 4,
    storage_type: 'ssd',
    connection_count: 100,
    data_volume_gb: 10
  });
  const [tuningResult, setTuningResult] = useState<any>(null);
  const [isTuning, setIsTuning] = useState(false);
  const [cdcResult, setCdcResult] = useState<{ replayed_count: number; errors: any[] } | null>(null);
  const [isReplayingCdc, setIsReplayingCdc] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isConverting && mysqlInput.trim()) handleConvert();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConverting, mysqlInput]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth.user) {
      toast.error('Mission Clearance Required', {
        description: 'Please sign in to your engineering node to perform artifact-based migrations.'
      });
      window.location.href = '/login';
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Frontend validation: 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100MB limit');
      return;
    }

    setIsConverting(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_format', targetFormat);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await axios.post('/convert/upload', formData, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });

      const result = response.data;
      if (!result.success) throw new Error(result.error);

      // Also update the input field for visual feedback if it's small enough to display
      if (file.size < 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => setMysqlInput(e.target?.result as string);
        reader.readAsText(file);
      } else {
        setMysqlInput(`-- File ${file.name} uploaded (${(file.size / 1024 / 1024).toFixed(2)} MB)\n-- Content too large to display preview.`);
      }

      processResult(result);
      if (result.rollback) setRollbackScript(result.rollback);
      toast.success(`Converted ${file.name} to ${targetFormat.toUpperCase()}`);
    } catch (err: any) {
      const msg = err.response?.status === 413 ? 'File too large for server (Check php.ini upload_max_filesize)' : (err.response?.data?.error || err.message || 'File conversion failed');
      toast.error(msg);
    } finally {
      setIsConverting(false);
      setUploadProgress(0);
      event.target.value = ''; // Reset input
    }
  };

  const runSandbox = async () => {
    if (!auth.user) {
      toast.error('Access Denied', {
        description: 'Sanctum clearance required to execute sandbox routines.'
      });
      window.location.href = '/login';
      return;
    }

    if (!fullOutput) {
      toast.error('Generate SQL first before running sandbox validation');
      return;
    }

    setIsSandboxRunning(true);
    setSandboxResult(null);

    try {
      const response = await axios.post('/convert/sandbox', { sql: fullOutput });
      setSandboxResult({ success: true, message: response.data.message });
      toast.success('Sandbox validation successful!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Execution failed in the sandbox';
      setSandboxResult({ success: false, error: errMsg });
      toast.error('Sandbox execution error');
    } finally {
      setIsSandboxRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadSql = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processResult = (result: any) => {
    const data = result.data;
    if (data.schema_meta) {
      setSchemaData(data.schema_meta);
    }

    if (targetFormat === 'xlsx' || targetFormat === 'xls') {
      setOutput(`Excel file generated: ${data.filename}`);
      setConversionReport([{ type: 'info', message: `Excel file ready for download` }]);
    } else if (targetFormat === 'csv') {
      const csvContent = Object.entries(data.files).map(([p, c]) => `-- Table: ${p}\n${c}`).join('\n\n');
      if (csvContent.length > 1024 * 1024) {
        setOutput(`-- Result is too large for editor preview (${(csvContent.length / 1024 / 1024).toFixed(2)} MB)\n-- Please use "Download" for the full content.\n\n` + csvContent.substring(0, 5000) + "\n\n... (rest of file truncated) ...");
        toast.info("Result is large! Editor preview truncated for performance. Please download the full file.");
      } else {
        setOutput(csvContent);
      }
    } else {
      const sql = data.sql || data.script || '';
      setFullOutput(sql);

      if (data.orchestrator_link) {
        setOutput(`-- Zero-Downtime Migration Engaged\n-- Mission Control: ${window.location.origin}${data.orchestrator_link}\n\nBackground job dispatched successfully.`);
        toast.success('Migration Started! Redirecting to Orchestrator...', {
          action: {
            label: 'Open Dashboard',
            onClick: () => window.location.href = data.orchestrator_link
          },
          duration: 10000
        });
      } else if (sql.length > 1024 * 1024) {
        setOutput(`-- Result is too large for editor preview (${(sql.length / 1024 / 1024).toFixed(2)} MB)\n-- Please use "Download" for the full SQL file.\n\n` + sql.substring(0, 5000) + "\n\n... (rest of file truncated) ...");
        toast.info("Result is large! Editor preview truncated for performance. Please download the full file.");
      } else {
        setOutput(sql);
      }
      setConversionReport(data.report || result.report || []);
    }
  };

  const handleAnalyze = async () => {
    if (!auth.user) {
      toast.error('Identity Verification Required', {
        description: 'Authenticate to access the neural structural analyzer.'
      });
      window.location.href = '/login';
      return;
    }

    if (mode === 'sql' && inputMethod === 'manual' && !mysqlInput.trim()) return toast.error('Please enter MySQL code to analyze');
    if ((mode === 'stream' || (mode === 'sql' && inputMethod === 'live')) && !sourceConn.db) return toast.error('Please provide source database details');

    setIsAnalyzing(true);
    try {
      const payload = mode === 'sql'
        ? (inputMethod === 'manual' ? { mysql_dump: mysqlInput, options } : { source: sourceConn, options })
        : { source: sourceConn, options };

      const response = await fetch('/convert/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      if (response.redirected || responseText.includes('<!DOCTYPE html>') || responseText.includes('/login')) {
        toast.error('Authentication Required', {
          description: 'Please sign in to analyze schemas and run cluster migrations.'
        });
        window.location.href = '/login';
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Server returned invalid JSON format. Please verify your input query syntax.');
      }
      if (!result.success) throw new Error(result.error || 'Schema analysis failed');
      const rawTables = result.data.tables || result.data.schema_meta || [];
      const tablesArray = Array.isArray(rawTables) ? rawTables : Object.values(rawTables);
      setSchemaData(tablesArray);
      setActiveTab('visualization');
      toast.success('Interactive ERD generated');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (!auth.user) {
      toast.error('Port Access Restricted', {
        description: 'Signed-in clearance is required for live cluster transformations.'
      });
      window.location.href = '/login';
      return;
    }

    if (mode === 'sql' && !mysqlInput.trim()) return toast.error('Please enter MySQL code');
    if (mode === 'stream' && (!sourceConn.db || !targetConn.db)) return toast.error('Please provide database details');

    setIsConverting(true);
    try {
      const endpoint = mode === 'sql' ? '/convert' : '/convert/stream';
      const payload = mode === 'sql'
        ? (inputMethod === 'manual'
          ? { mysql_dump: mysqlInput, target_format: targetFormat, options }
          : { source: sourceConn, target_format: targetFormat, options })
        : { source: sourceConn, target: targetConn, options };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      if (response.redirected || responseText.includes('<!DOCTYPE html>') || responseText.includes('/login')) {
        toast.error('Authentication Required', {
          description: 'Session expired. Please sign in again to run transformations.'
        });
        window.location.href = '/login';
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Server returned invalid response syntax. Please check your SQL input.');
      }
      if (!result.success) throw new Error(result.error || 'Conversion failed');
      processResult(result);
      if (result.rollback) setRollbackScript(result.rollback);
      toast.success(mode === 'sql' ? `Converted to ${targetFormat.toUpperCase()}` : 'Live Migration Completed');
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleTranslateQuery = async () => {
    if (!auth.user) {
      toast.error('Cipher Clearance Required', {
        description: 'Please login to translate ciphered queries.'
      });
      window.location.href = '/login';
      return;
    }

    if (!queryInput.trim()) return toast.error('Please enter a query to translate');
    setIsTranslating(true);
    try {
      const response = await axios.post('/translate-query', {
        query: queryInput
      }, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      if (response.data.success) {
        setQueryOutput(response.data.translated);
        toast.success('MySQL Query translated to PostgreSQL');
      } else {
        throw new Error(response.data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Query translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTune = async () => {
    if (!auth.user) {
      toast.error('Architectural Access Required', {
        description: 'Login to generate high-fidelity architecture reports.'
      });
      window.location.href = '/login';
      return;
    }

    setIsTuning(true);
    try {
      const response = await axios.post('/convert/tune', tuningInput, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      if (response.data.success) {
        setTuningResult(response.data);
        setActiveTab('tuning_advisor');
        toast.success('PostgreSQL tuning recommendation generated');
      } else {
        throw new Error(response.data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Tuning analysis failed');
    } finally {
      setIsTuning(false);
    }
  };

  const handleCdcReplay = async () => {
    if (!sourceConn.db || !targetConn.db) return toast.error('Source and Target DB are required for CDC replay');

    setIsReplayingCdc(true);
    try {
      const response = await axios.post('/cdc/replay', {
        source_db: sourceConn.db,
        target_db: targetConn.db
      }, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });

      if (response.data.success) {
        setCdcResult(response.data);
        toast.success(`CDC Replay: ${response.data.replayed_count} changes applied successfully`);
      } else {
        throw new Error(response.data.errors?.[0]?.error || 'CDC Replay failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'CDC Replay failed');
    } finally {
      setIsReplayingCdc(false);
    }
  };

  const clearInput = () => {
    setMysqlInput('');
    setFullOutput('');
    toast.info('Input cleared');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">
      <Head>
        <title>SQL STREAM | Modern MySQL to PostgreSQL Migration</title>
        <meta name="description" content="The ultimate ecosystem for high-fidelity database migration. Automated transpilation, AI tuning, and zero-downtime streaming from MySQL to PostgreSQL." />
        <meta name="keywords" content="mysql to postgresql, database converter, sql migration tool, automate mysql migration, postgres transpiler, mysql to csv export, free sql tools" />
      </Head>
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.05]" />
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-primary/15 dark:bg-primary/25 blur-[130px] rounded-full animate-blob mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-100" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[130px] rounded-full animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-100" />
        <div className="absolute top-[20%] left-[50%] w-[50%] h-[50%] bg-teal-500/10 dark:bg-teal-500/15 blur-[130px] rounded-full animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between backdrop-blur-3xl shadow-2xl shadow-black/10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="bg-primary/20 p-3 rounded-2xl ring-1 ring-primary/40 group-hover:bg-primary/30 transition-all duration-700 shadow-lg shadow-primary/20">
            <Rocket className="h-7 w-7 text-primary fill-primary/30 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter leading-none bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              SQL<span className="text-primary italic">STREAM</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70 mt-1">High Performance Migration</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-foreground/[0.03] dark:bg-foreground/5 rounded-full border border-foreground/10 ring-1 ring-foreground/5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/70 dark:text-foreground/50">Core Engine Online</span>
          </div>

          <div className="h-6 w-[1px] bg-foreground/10 hidden md:block" />

          <div className="hidden md:flex items-center gap-1">
            <Link href="/orchestrator">
              <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4 h-9 text-foreground/70 dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all">Orchestrator</Button>
            </Link>
            <Link href="/validation">
              <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4 h-9 text-foreground/70 dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all">Validation</Button>
            </Link>
            <Link href="/index-advisor">
              <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4 h-9 text-foreground/70 dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all">Index Advisor</Button>
            </Link>
            <Link href="/support">
              <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4 h-9 text-foreground/70 dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all">Support</Button>
            </Link>
          </div>

          <div className="h-6 w-[1px] bg-foreground/10 hidden md:block" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {auth.user ? (
                <div className="flex items-center gap-2">
                  <Dropdown>
                    <Dropdown.Trigger>
                      <Button variant="ghost" className="rounded-full h-9 px-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 flex items-center gap-2 hover:bg-foreground/5 transition-all">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="max-w-[100px] truncate">{auth.user.name}</span>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </Button>
                    </Dropdown.Trigger>

                    <Dropdown.Content contentClasses="py-2 bg-background/95 backdrop-blur-xl border border-foreground/10 shadow-2xl rounded-2xl min-w-[180px]">
                      <div className="px-4 py-2 mb-2 border-b border-foreground/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Node Identity</p>
                        <p className="text-[11px] font-bold truncate text-foreground/80">{auth.user.email}</p>
                      </div>

                      <Dropdown.Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all outline-none">
                        <User className="w-3.5 h-3.5" />
                        Access Profile
                      </Dropdown.Link>

                      <Dropdown.Link href="/logout" method="post" as="button" className="flex items-center gap-3 w-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-red-500 hover:bg-red-500/5 transition-all outline-none">
                        <LogOut className="w-3.5 h-3.5" />
                        Terminate Node
                      </Dropdown.Link>
                    </Dropdown.Content>
                  </Dropdown>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4 h-9 text-foreground/70 dark:text-foreground/40 hover:text-foreground transition-colors">Sign In</Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button className="rounded-full font-black text-[10px] px-6 h-9 uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground ring-1 ring-foreground/20">Join Port</Button>
                  </Link>
                </>
              )}
            </div>

            <div className="h-6 w-[1px] bg-foreground/10" />

            <ThemeToggle />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass border-l-foreground/10 w-[300px]">
                <div className="flex flex-col gap-6 pt-10">
                  <div className="flex flex-col mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Navigation Port</span>
                    <div className="h-[1px] w-full bg-foreground/10" />
                  </div>
                  <Link href="/orchestrator" className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-foreground flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-foreground/5 border border-foreground/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"><Zap className="h-4 w-4" /></div>
                    Orchestrator
                  </Link>
                  <Link href="/validation" className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-foreground flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-foreground/5 border border-foreground/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"><Check className="h-4 w-4" /></div>
                    Validation
                  </Link>
                  <Link href="/index-advisor" className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-foreground flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-foreground/5 border border-foreground/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"><Database className="h-4 w-4" /></div>
                    Index Advisor
                  </Link>
                  <Link href="/docs" className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-foreground flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-foreground/5 border border-foreground/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"><Terminal className="h-4 w-4" /></div>
                    Documentation
                  </Link>
                  <Link href="/status" className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-foreground flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-foreground/5 border border-foreground/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"><Activity className="h-4 w-4" /></div>
                    System Status
                  </Link>
                  <Link href="/support" className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-foreground flex items-center gap-3 group">
                    <div className="p-2 rounded-lg bg-foreground/5 border border-foreground/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"><Server className="h-4 w-4" /></div>
                    Technical Support
                  </Link>

                  <div className="mt-8 pt-8 border-t border-foreground/5 space-y-4">
                    {auth.user ? (
                      <div className="space-y-3">
                        <Link href="/overview">
                          <Button className="w-full rounded-2xl font-black text-xs h-12 uppercase tracking-[0.2em] shadow-lg shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground">Access Overview</Button>
                        </Link>
                        <div className="grid grid-cols-2 gap-3">
                          <Link href="/profile">
                            <Button variant="outline" className="w-full rounded-2xl font-black text-[10px] h-12 uppercase tracking-widest border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all flex items-center justify-center gap-2">
                              <User className="w-3.5 h-3.5" />
                              Profile
                            </Button>
                          </Link>
                          <Link href="/logout" method="post" as="button">
                            <Button variant="outline" className="w-full rounded-2xl font-black text-[10px] h-12 uppercase tracking-widest border-foreground/10 text-foreground/60 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2">
                              <LogOut className="w-3.5 h-3.5" />
                              Logout
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="outline" className="w-full rounded-2xl font-black text-xs h-12 uppercase tracking-[0.2em] border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all">Sign In</Button>
                        </Link>
                        <Link href="/register">
                          <Button className="w-full rounded-2xl font-black text-xs h-12 uppercase tracking-[0.2em] shadow-lg shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground">Initialize Port</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex items-center justify-center">
              <a href="https://github.com/chanminko1234/SQLSTREAM_REPO" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24 space-y-6"
        >
          <Badge variant="outline" className="px-5 py-1.5 rounded-full border-primary/30 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-[0_0_20px_rgba(109,40,217,0.3)] border-2">
            Engineering Preview v2.0
          </Badge>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none text-foreground overflow-visible drop-shadow-sm">
            Migrate <span className="text-primary italic">Better.</span>
          </h1>
          <p className="text-xl text-foreground/50 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed font-sans">
            The ultimate bridge from MySQL to PostgreSQL. Engineering speed,
            <span className="text-foreground dark:text-white font-black mx-1 inline-flex items-center gap-1 group cursor-help transition-all hover:text-primary">
              Predictive AI <Zap className="inline-block w-4 h-4 text-primary fill-primary group-hover:scale-125 transition-transform" />
            </span>, and real-time streaming built for
            high-availability systems.
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <div className="bg-white/80 dark:bg-slate-900/60 p-1.5 rounded-[1.5rem] border border-emerald-950/10 dark:border-white/10 flex gap-2 backdrop-blur-xl shadow-md">
              <Button
                variant={mode === 'sql' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('sql')}
                className={`rounded-xl flex px-6 font-bold text-[10px] uppercase tracking-widest ${mode === 'sql' ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground/70 dark:text-white/70 hover:text-foreground'}`}
              >
                <Terminal className="w-3 h-3 mr-2" />
                SQL Dump
              </Button>
              <Button
                variant={mode === 'stream' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('stream')}
                className={`rounded-xl flex px-6 font-bold text-[10px] uppercase tracking-widest ${mode === 'stream' ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground/70 dark:text-white/70 hover:text-foreground'}`}
              >
                <Server className="w-3 h-3 mr-2" />
                Live Stream
              </Button>
              <Button
                variant={mode === 'tuning' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('tuning')}
                className={`rounded-xl flex px-6 font-bold text-[10px] uppercase tracking-widest ${mode === 'tuning' ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground/70 dark:text-white/70 hover:text-foreground'}`}
              >
                <Activity className="w-3 h-3 mr-2" />
                Tuning Advisor
              </Button>
            </div>
          </div>

          {mode !== 'tuning' && (
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="flex items-center glass border px-4 py-1.5 rounded-2xl shadow-2xl">
                <Label className="text-xs font-bold uppercase opacity-40 mr-4 tracking-tighter">Target Format</Label>
                <Select value={targetFormat} onValueChange={(v: any) => setTargetFormat(v)}>
                  <SelectTrigger className="w-[160px] bg-transparent border-none text-base font-bold focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="postgresql" className="font-bold">PostgreSQL</SelectItem>
                    <SelectItem value="sqlite" className="font-bold">SQLite</SelectItem>
                    <SelectItem value="csv" className="font-bold">CSV Dump</SelectItem>
                    <SelectItem value="xlsx" className="font-bold">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-2xl justify-center items-center px-6 flex border-foreground/10 dark:border-white/10 hover:bg-foreground/5 dark:hover:bg-white/5 transition-all font-black text-[10px] uppercase tracking-widest">
                    <Settings className="w-4 mr-2" />
                    Options
                  </Button>
                </SheetTrigger>
                <SheetContent className="glass border-l-foreground/10 dark:border-l-white/10 shadow-2xl overflow-y-auto custom-scrollbar">
                  <SheetHeader className="pb-6 border-b border-foreground/5 dark:border-white/5">
                    <SheetTitle className="text-2xl font-bold">Conversion Rules</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 py-6 overflow-x-hidden">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-white/40">Framework Optimization</Label>
                      <Select
                        value={options.frameworkPreset}
                        onValueChange={(v: any) => setOptions(p => ({ ...p, frameworkPreset: v }))}
                      >
                        <SelectTrigger className="w-full bg-background dark:bg-white/5 border-foreground/10 dark:border-white/10 rounded-xl focus:ring-primary h-12 shadow-sm">
                          <SelectValue placeholder="Select Framework" />
                        </SelectTrigger>
                        <SelectContent className="bg-background dark:glass border-foreground/10 dark:border-white/10 text-foreground dark:text-white rounded-xl overflow-hidden shadow-2xl">
                          <SelectItem value="none" className="hover:bg-foreground/5 dark:hover:bg-white/5 py-3 transition-colors">General (Standard SQL)</SelectItem>
                          <SelectItem value="wordpress" className="hover:bg-foreground/5 dark:hover:bg-white/5 py-3 transition-colors font-medium">WordPress Presets</SelectItem>
                          <SelectItem value="laravel" className="hover:bg-foreground/5 dark:hover:bg-white/5 py-3 transition-colors font-medium text-amber-500">Laravel Optimization</SelectItem>
                          <SelectItem value="magento" className="hover:bg-foreground/5 dark:hover:bg-white/5 py-3 transition-colors font-medium text-orange-500">Magento Ecosystem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-5 border border-foreground/10 dark:border-white/5 bg-background dark:bg-white/[0.02] rounded-[1.5rem] shadow-sm">
                      <Label className="font-bold text-sm tracking-tight text-foreground dark:text-white">Preserve Identity Keys</Label>
                      <Checkbox checked={options.preserveIdentity} onCheckedChange={(c) => setOptions(p => ({ ...p, preserveIdentity: !!c }))} />
                    </div>
                    <div className="flex items-center justify-between p-5 border border-foreground/10 dark:border-white/5 bg-background dark:bg-white/[0.02] rounded-[1.5rem] shadow-sm">
                      <Label className="font-bold text-sm tracking-tight text-foreground dark:text-white">Relational Schema Only</Label>
                      <Checkbox checked={options.schemaOnly} onCheckedChange={(c) => setOptions(p => ({ ...p, schemaOnly: !!c }))} />
                    </div>

                    <div className="space-y-4">
                      <div
                        onClick={() => setOptions(p => ({ ...p, predictiveRefactoring: !p.predictiveRefactoring }))}
                        className={`cursor-pointer group relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${options.predictiveRefactoring
                          ? 'bg-primary/5 border-primary/40 shadow-[0_10px_40px_rgba(var(--primary),0.1)]'
                          : 'bg-background border-foreground/10 dark:bg-white/5 dark:border-white/10 hover:border-primary/30 hover:bg-foreground/5 dark:hover:bg-white/[0.07] shadow-sm'
                          }`}
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap className={`w-16 h-16 ${options.predictiveRefactoring ? 'text-primary' : 'text-foreground dark:text-white'}`} />
                        </div>
                        <div className="flex items-start gap-5 relative z-10">
                          <div className={`p-4 rounded-2xl transition-all duration-500 ${options.predictiveRefactoring ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-foreground/5 dark:bg-white/10'}`}>
                            <Zap className={`h-5 w-5 ${options.predictiveRefactoring ? 'text-white fill-white' : 'text-foreground/60 dark:text-white/40'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-xs uppercase tracking-widest text-foreground dark:text-white">Predictive Refactoring</h3>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${options.predictiveRefactoring ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-foreground/5 dark:bg-white/5 border-foreground/10 dark:border-white/10 text-foreground/30 dark:text-white/30'}`}>AI Enabled</Badge>
                            </div>
                            <p className="text-[10px] font-medium leading-relaxed opacity-40 max-w-[200px] text-foreground dark:text-white">Uses advanced heuristics to suggest modern PostgreSQL types and optimizations.</p>
                          </div>
                        </div>
                        <div className={`absolute bottom-6 right-6 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500 ${options.predictiveRefactoring ? 'bg-primary scale-100 opacity-100 shadow-lg shadow-primary/40' : 'bg-foreground/5 dark:bg-white/10 scale-50 opacity-0'}`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      {options.predictiveRefactoring && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          onClick={() => setOptions(p => ({ ...p, applyAiRefactoring: !p.applyAiRefactoring }))}
                          className={`cursor-pointer group relative p-5 rounded-[2rem] border transition-all duration-300 ml-4 mb-2 ${options.applyAiRefactoring
                            ? 'bg-primary/5 border-primary/40 shadow-lg shadow-primary/5'
                            : 'bg-background border-foreground/10 dark:bg-white/5 dark:border-white/10 hover:bg-foreground/2 hover:border-primary/20 shadow-sm'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${options.applyAiRefactoring ? 'bg-primary text-white' : 'bg-foreground/10 dark:bg-white/10 text-foreground/40 dark:text-white/40'}`}>
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white">Apply Modernization</span>
                            </div>
                            <Checkbox checked={options.applyAiRefactoring} />
                          </div>
                           <p className="text-[9px] mt-3 font-medium leading-relaxed opacity-60 ml-1 text-foreground dark:text-white">Automatically commit AI-driven structural improvements. If disabled, changes will be provided for manual review in the report.</p>
                        </motion.div>
                      )}

                      <div
                        onClick={() => setOptions(p => ({ ...p, autoCleaning: !p.autoCleaning }))}
                        className={`cursor-pointer group relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${options.autoCleaning
                          ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_10px_40px_rgba(245,158,11,0.1)]'
                          : 'bg-background border-foreground/10 dark:bg-white/5 dark:border-white/10 hover:border-amber-500/30 hover:bg-foreground/5 dark:hover:bg-white/[0.07] shadow-sm'
                          }`}
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Eraser className={`w-16 h-16 ${options.autoCleaning ? 'text-amber-500' : 'text-foreground dark:text-white'}`} />
                        </div>
                        <div className="flex items-start gap-5 relative z-10">
                          <div className={`p-4 rounded-2xl transition-all duration-500 ${options.autoCleaning ? 'bg-amber-500 shadow-lg shadow-amber-500/40' : 'bg-foreground/5 dark:bg-white/10'}`}>
                            <Eraser className={`h-5 w-5 ${options.autoCleaning ? 'text-white fill-white' : 'text-foreground/60 dark:text-white/40'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-xs uppercase tracking-widest text-foreground dark:text-white">Auto-Cleaning</h3>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${options.autoCleaning ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-background border-foreground/10 dark:border-white/10 text-foreground/40 dark:text-white/30 shadow-sm'}`}>Optimization</Badge>
                            </div>
                            <p className="text-[10px] font-medium leading-relaxed opacity-60 max-w-[200px] text-foreground dark:text-white">Detects inconsistent naming conventions and redundant structural patterns.</p>
                          </div>
                        </div>
                        <div className={`absolute bottom-6 right-6 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500 ${options.autoCleaning ? 'bg-amber-500 scale-100 opacity-100 shadow-lg shadow-amber-500/40' : 'bg-foreground/5 dark:bg-white/10 scale-50 opacity-0'}`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      <div
                        onClick={() => setOptions(p => ({ ...p, incrementalSync: !p.incrementalSync }))}
                        className={`cursor-pointer group relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${options.incrementalSync
                          ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_10px_40px_rgba(16,185,129,0.1)]'
                          : 'bg-background border-foreground/10 dark:bg-white/5 dark:border-white/10 hover:border-emerald-500/30 hover:bg-foreground/5 dark:hover:bg-white/[0.07] shadow-sm'
                          }`}
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Activity className={`w-16 h-16 ${options.incrementalSync ? 'text-emerald-500' : 'text-foreground dark:text-white'}`} />
                        </div>
                        <div className="flex items-start gap-5 relative z-10">
                          <div className={`p-4 rounded-2xl transition-all duration-500 ${options.incrementalSync ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-foreground/5 dark:bg-white/10'}`}>
                            <Activity className={`h-5 w-5 ${options.incrementalSync ? 'text-white' : 'text-foreground/60 dark:text-white/40'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-xs uppercase tracking-widest text-foreground dark:text-white">Incremental Sync</h3>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${options.incrementalSync ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-background border-foreground/10 dark:bg-white/10 text-foreground/40 dark:text-white/30 shadow-sm'}`}>Zero Downtime</Badge>
                            </div>
                            <p className="text-[10px] font-medium leading-relaxed opacity-60 max-w-[200px] text-foreground dark:text-white">Tracks the high-water mark of your data to migrate only delta records.</p>
                          </div>
                        </div>
                        <div className={`absolute bottom-6 right-6 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500 ${options.incrementalSync ? 'bg-emerald-500 scale-100 opacity-100 shadow-lg shadow-emerald-500/40' : 'bg-foreground/5 dark:bg-white/10 scale-50 opacity-0'}`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      <div
                        onClick={() => setOptions(p => ({ ...p, dataMasking: !p.dataMasking }))}
                        className={`cursor-pointer group relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${options.dataMasking
                          ? 'bg-blue-500/5 border-blue-500/40 shadow-[0_10px_40px_rgba(59,130,246,0.1)]'
                          : 'bg-background border-foreground/10 dark:bg-white/5 dark:border-white/10 hover:border-blue-500/30 hover:bg-foreground/5 dark:hover:bg-white/[0.07] shadow-sm'
                          }`}
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Search className={`w-16 h-16 ${options.dataMasking ? 'text-blue-500' : 'text-foreground dark:text-white'}`} />
                        </div>
                        <div className="flex items-start gap-5 relative z-10">
                          <div className={`p-4 rounded-2xl transition-all duration-500 ${options.dataMasking ? 'bg-blue-500 shadow-lg shadow-blue-500/40' : 'bg-foreground/5 dark:bg-white/10'}`}>
                            <Maximize2 className={`h-5 w-5 ${options.dataMasking ? 'text-white' : 'text-foreground/60 dark:text-white/40'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-xs uppercase tracking-widest text-foreground dark:text-white">Staging Masking</h3>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${options.dataMasking ? 'bg-blue-500/20 border-blue-500/40 text-blue-500' : 'bg-background border-foreground/10 dark:bg-white/10 text-foreground/40 dark:text-white/30 shadow-sm'}`}>Privacy Mode</Badge>
                            </div>
                            <p className="text-[10px] font-medium leading-relaxed opacity-60 max-w-[200px] text-foreground dark:text-white">Automatically obfuscates PII data like emails and phones using FakerPHP.</p>
                          </div>
                        </div>
                        <div className={`absolute bottom-6 right-6 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500 ${options.dataMasking ? 'bg-blue-500 scale-100 opacity-100 shadow-lg shadow-blue-500/40' : 'bg-foreground/5 dark:bg-white/10 scale-50 opacity-0'}`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                size="lg"
                variant="outline"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isConverting || (mode === 'sql' && !mysqlInput.trim()) || (mode === 'stream' && !sourceConn.db)}
                className="rounded-2xl flex px-8 border-2 border-emerald-600/30 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-md transition-all active:scale-95"
              >
                {isAnalyzing ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 w-4" />}
                Analyze Schema
              </Button>

              <Button
                size="lg"
                onClick={handleConvert}
                disabled={isConverting || (mode === 'sql' && !mysqlInput.trim()) || (mode === 'stream' && (!sourceConn.db || !targetConn.db))}
                className={`rounded-2xl px-10 flex shadow-xl font-bold transition-all active:scale-95 ${mode === 'stream' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/40 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
              >
                {isConverting ? <Activity className="animate-spin h-5 w-5 mr-2" /> : !auth.user ? <ShieldCheck className="w-5 mr-2 opacity-50" /> : mode === 'stream' ? <Server className="w-5 mr-2" /> : <Rocket className="w-5 mr-2" />}
                {isConverting ? 'Processing...' : !auth.user ? 'Login to Migrate' : mode === 'stream' ? 'Start Live Stream' : 'Run Transformation'}
              </Button>
            </div>
          )}

          <AnimatePresence>
            {mode === 'stream' && isConverting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-12 w-full"
              >
                <LiveMigrationDashboard
                  sourceDb={sourceConn.db}
                  targetDb={targetConn.db}
                  isSyncing={isConverting}
                  onCompleted={() => setIsConverting(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card rounded-[2.5rem] overflow-hidden border-foreground/10 dark:border-white/10 shadow-2xl group min-h-[500px] flex flex-col">
              <div className="px-8 py-5 border-b border-foreground/5 dark:border-white/5 bg-foreground/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                </div>
                {mode === 'sql' && (
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-white/5 px-2 py-1 rounded-xl border border-foreground/10 dark:border-white/10">
                      <span className="text-[9px] font-black uppercase tracking-wider text-foreground/40 dark:text-white/40 mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setInputMethod('manual');
                          setMysqlInput(`CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`);
                        }}
                        className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                      >
                        E-Commerce
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputMethod('manual');
                          setMysqlInput(`CREATE TABLE tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  settings JSON,
  is_enterprise TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  plan_code VARCHAR(50) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);`);
                        }}
                        className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-md hover:bg-teal-500/20 transition-all border border-teal-500/20"
                      >
                        SaaS Multi-Tenant
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputMethod('manual');
                          setMysqlInput(`CREATE TABLE events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  payload JSON,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);
                        }}
                        className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md hover:bg-amber-500/20 transition-all border border-amber-500/20"
                      >
                        Analytics
                      </button>
                    </div>

                    <div className="bg-foreground/5 dark:bg-white/5 p-1 rounded-xl flex gap-1 border border-foreground/5 dark:border-white/5 ring-1 ring-foreground/10 dark:ring-white/10">
                      <Button
                        variant={inputMethod === 'manual' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setInputMethod('manual')}
                        className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-4"
                      >
                        Manual SQL
                      </Button>
                      <Button
                        variant={inputMethod === 'live' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setInputMethod('live')}
                        className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-4"
                      >
                        Live Node
                      </Button>
                    </div>
                    <div className="h-4 w-[1px] bg-foreground/10 dark:bg-white/10" />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={clearInput} className="text-[10px] font-black uppercase tracking-tighter opacity-40 hover:opacity-100 flex items-center gap-1">
                        <Eraser className="h-3 w-3" /> Clear
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black tracking-widest text-primary/40 uppercase">Max 100MB</span>
                        <Button variant="ghost" size="sm" onClick={() => document.getElementById('f')?.click()} disabled={isConverting} className="text-[10px] font-black uppercase tracking-tighter opacity-40 hover:opacity-100 flex items-center gap-1">
                          {isConverting ? <Activity className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                        </Button>
                        <input id="f" type="file" accept=".sql" className="hidden" onChange={handleFileUpload} disabled={isConverting} />
                      </div>
                    </div>
                  </div>
                )}
                {mode === 'stream' && (
                  <Badge variant="outline" className="text-[8px] border-primary/40 text-primary font-black uppercase tracking-tighter">Direct Streaming</Badge>
                )}
              </div>

              {/* Context Switch */}
              <div className="flex-1 overflow-auto bg-slate-50/60 dark:bg-slate-950/30 backdrop-blur-3xl">
                {mode === 'sql' && inputMethod === 'manual' ? (
                  <>
                    <AnimatePresence>
                      {isConverting && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-8 pb-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                              {uploadProgress < 100 ? 'Uploading...' : 'Processing Engine...'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                              {uploadProgress}%
                            </span>
                          </div>
                          <Progress value={uploadProgress} className="h-1 bg-primary/5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Textarea
                      value={mysqlInput}
                      onChange={(e) => setMysqlInput(e.target.value)}
                      placeholder="-- Paste MySQL here..."
                      className="min-h-[500px] p-8 bg-transparent border-none focus-visible:ring-0 font-mono text-base resize-none leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </>
                ) : mode === 'sql' && inputMethod === 'live' ? (
                  <div className="p-10 space-y-12">
                    <div className="flex items-center gap-6 mb-2">
                      <Badge variant="outline" className="px-6 py-1.5 rounded-full border-primary/40 bg-primary/20 dark:bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest shadow-2xl">Source Logic Cluster</Badge>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground/30 dark:text-white/30 italic">Target a live MySQL instance to extract structural patterns and object relationships.</p>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Node Host</Label>
                          <input
                            placeholder="e.g. cluster-01.db.local"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.host}
                            onChange={e => setSourceConn(p => ({ ...p, host: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Cluster Port</Label>
                          <input
                            placeholder="3306"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.port}
                            onChange={e => setSourceConn(p => ({ ...p, port: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Access Token / User</Label>
                          <input
                            placeholder="admin"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.user}
                            onChange={e => setSourceConn(p => ({ ...p, user: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Secure Secret / Pass</Label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.pass}
                            onChange={e => setSourceConn(p => ({ ...p, pass: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Database Namespace</Label>
                        <input
                          placeholder="primary_db"
                          className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                          value={sourceConn.db}
                          onChange={e => setSourceConn(p => ({ ...p, db: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                ) : mode === 'tuning' ? (
                  <div className="p-10 space-y-12">
                    <div className="flex items-center gap-6 mb-2">
                      <Badge variant="outline" className="px-6 py-1.5 rounded-full border-amber-500/40 bg-amber-500/20 dark:bg-amber-500/10 text-amber-500 font-black uppercase text-[10px] tracking-widest shadow-2xl">Architecture Optimizer</Badge>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground/30 dark:text-white/30 italic">Provide your target server specifications and MySQL slow logs to generate a high-performance PostgreSQL configuration.</p>

                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Total System RAM (GB)</Label>
                          <input
                            type="number"
                            className="w-full bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-amber-500/40 outline-none transition-all shadow-inner"
                            value={tuningInput.ram_gb}
                            onChange={e => setTuningInput(p => ({ ...p, ram_gb: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">CPU Cores</Label>
                          <input
                            type="number"
                            className="w-full bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-amber-500/40 outline-none transition-all shadow-inner"
                            value={tuningInput.cpu_cores}
                            onChange={e => setTuningInput(p => ({ ...p, cpu_cores: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Max Connections</Label>
                          <input
                            type="number"
                            className="w-full bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-amber-500/40 outline-none transition-all shadow-inner"
                            value={tuningInput.connection_count}
                            onChange={e => setTuningInput(p => ({ ...p, connection_count: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Estimated Data Volume (GB)</Label>
                          <input
                            type="number"
                            className="w-full bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-amber-500/40 outline-none transition-all shadow-inner"
                            value={tuningInput.data_volume_gb}
                            onChange={e => setTuningInput(p => ({ ...p, data_volume_gb: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Storage Substrate</Label>
                        <Select
                          value={tuningInput.storage_type}
                          onValueChange={(v: any) => setTuningInput(p => ({ ...p, storage_type: v }))}
                        >
                          <SelectTrigger className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] h-16 px-8 font-black text-sm shadow-sm dark:shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="ssd" className="font-bold">Solid State Drive (SSD / NVMe)</SelectItem>
                            <SelectItem value="hdd" className="font-bold">Hard Disk Drive (HDD / SAN)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">MySQL Slow Query Log (optional)</Label>
                        <Textarea
                          className="min-h-[160px] bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[2rem] p-8 text-xs font-mono placeholder:opacity-20 shadow-sm dark:shadow-inner"
                          placeholder="# Time: 2026-04-06T12:00:00.000000Z... Query_time: 10.5..."
                          value={tuningInput.slow_query_log}
                          onChange={e => setTuningInput(p => ({ ...p, slow_query_log: e.target.value }))}
                        />
                      </div>

                      <Button
                        className="w-full justify-center flex py-4 rounded-[2rem] bg-amber-500 hover:bg-amber-600 font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-amber-500/40 active:scale-95 transition-all mt-4"
                        onClick={handleTune}
                        disabled={isTuning}
                      >
                        {isTuning ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                        Generate Architecture Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 space-y-12">
                    <div className="flex items-center gap-6 mb-2">
                      <Badge variant="outline" className="px-6 py-1.5 rounded-full border-primary/40 bg-primary/20 dark:bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest shadow-2xl">Source Logic Cluster</Badge>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground/30 dark:text-white/30 italic">Connect directly to an external MySQL node to stream schema and data without intermediate artifacts.</p>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Node Host</Label>
                          <input
                            placeholder="e.g. cluster-01.db.local"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.host}
                            onChange={e => setSourceConn(p => ({ ...p, host: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Cluster Port</Label>
                          <input
                            placeholder="3306"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.port}
                            onChange={e => setSourceConn(p => ({ ...p, port: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Access Token / User</Label>
                          <input
                            placeholder="admin"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.user}
                            onChange={e => setSourceConn(p => ({ ...p, user: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Secure Secret / Pass</Label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                            value={sourceConn.pass}
                            onChange={e => setSourceConn(p => ({ ...p, pass: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Database Namespace</Label>
                        <input
                          placeholder="primary_db"
                          className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-4 ring-primary/40 outline-none transition-all shadow-sm dark:shadow-inner"
                          value={sourceConn.db}
                          onChange={e => setSourceConn(p => ({ ...p, db: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-foreground/5 dark:border-white/5 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2.5 rounded-xl">
                          <Database className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-primary italic">Target Synchronization Node</h3>
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-foreground/30 dark:text-white/30 italic">Highly optimized for live production clusters. Ensure SSL/TLS is active for direct migration.</p>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Target Host</Label>
                          <input
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-1 ring-primary/40 outline-none shadow-sm dark:shadow-inner"
                            value={targetConn.host}
                            onChange={e => setTargetConn(p => ({ ...p, host: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Target Port</Label>
                          <input
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-1 ring-primary/40 outline-none shadow-sm dark:shadow-inner"
                            value={targetConn.port}
                            onChange={e => setTargetConn(p => ({ ...p, port: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Target User</Label>
                          <input
                            className="w-full bg-background dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-1 ring-primary/40 outline-none shadow-sm dark:shadow-inner"
                            value={targetConn.user}
                            onChange={e => setTargetConn(p => ({ ...p, user: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Target Pass</Label>
                          <input
                            type="password"
                            className="w-full bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-1 ring-primary/40 outline-none"
                            value={targetConn.pass}
                            onChange={e => setTargetConn(p => ({ ...p, pass: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 dark:opacity-40 ml-2">Target DB Name</Label>
                        <input
                          className="w-full bg-foreground/[0.04] dark:bg-white/[0.04] border border-foreground/10 dark:border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:ring-1 ring-primary/40 outline-none"
                          value={targetConn.db}
                          onChange={e => setTargetConn(p => ({ ...p, db: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card rounded-[2.5rem] overflow-hidden border-foreground/10 dark:border-white/10 shadow-2xl h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 py-4 border-b border-foreground/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <TabsList className="bg-foreground/5 dark:bg-white/5 rounded-full p-1 ring-1 ring-foreground/10 dark:ring-white/10 flex-shrink-0 w-max min-w-full">
                      <TabsTrigger value="output" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary flex items-center gap-2">
                        <Rocket className="h-3 w-3" /> Output
                      </TabsTrigger>
                      <TabsTrigger value="translator" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-amber-500 flex items-center gap-2">
                        <Zap className="h-3 w-3" /> Translator
                      </TabsTrigger>
                      <TabsTrigger value="rollback" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-red-500 flex items-center gap-2">
                        <Eraser className="h-3 w-3" /> Rollback
                      </TabsTrigger>
                      <TabsTrigger value="visualization" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-emerald-600 flex items-center gap-2">
                        <Database className="h-3 w-3" /> ERD
                      </TabsTrigger>
                      {schemaData && (
                        <TabsTrigger value="mapper" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-teal-600 flex items-center gap-2">
                          <Zap className="h-3 w-3" /> Mapper
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="diff" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary flex items-center gap-2">
                        <Activity className="h-3 w-3" /> Diff
                      </TabsTrigger>
                      <TabsTrigger value="report" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary flex items-center gap-2">
                        <Terminal className="h-3 w-3" /> Log
                      </TabsTrigger>
                      <TabsTrigger value="tuning_advisor" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-amber-600 flex items-center gap-2">
                        <Zap className="h-3 w-3" /> PG Architect
                      </TabsTrigger>
                      <TabsTrigger value="cdc_sync" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-emerald-600 flex items-center gap-2">
                        <Activity className="h-3 w-3" /> CDC Stream
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <div className="flex-1 min-h-[440px]">
                  <AnimatePresence mode="wait">
                    <TabsContent key={activeTab} value={activeTab} className="m-0 p-0 h-full">
                      {activeTab === 'tuning_advisor' && (
                        <div className="p-8 space-y-8 max-h-[600px] overflow-auto custom-scrollbar">
                          {!tuningResult ? (
                            <div className="flex flex-col items-center justify-center opacity-20 p-20 text-center h-80 gap-4">
                              <Activity className="h-16 w-16 mb-4 animate-pulse" />
                              <p className="font-bold text-sm uppercase tracking-[0.2em]">Run Tuning Analysis to see recommendations</p>
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                  <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 italic">
                                    <Settings className="text-primary w-6 h-6" />
                                    Recommended postgresql.conf
                                  </h3>
                                  <Card className="glass border-foreground/10 dark:border-white/5 p-6 rounded-[2rem] bg-foreground/[0.04] dark:bg-black/40 overflow-hidden relative shadow-sm">
                                    <div className="absolute top-0 right-0 p-6 opacity-5"><Database className="w-20 h-20 text-foreground dark:text-white" /></div>
                                    <div className="font-mono text-[11px] text-foreground/80 dark:text-white/80 space-y-2 relative z-10">
                                      {Object.entries(tuningResult.config).map(([key, value]) => (
                                        <div key={key} className="flex justify-between border-b border-foreground/5 dark:border-white/5 py-2">
                                          <span className="opacity-50">{key}</span>
                                          <span className="text-primary font-bold">{value as string}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="w-full mt-6 rounded-xl border-white/5 bg-white/5 font-black uppercase text-[10px] tracking-widest"
                                      onClick={() => {
                                        const cfg = Object.entries(tuningResult.config).map(([k, v]) => `${k} = ${v}`).join('\n');
                                        copyToClipboard(cfg);
                                      }}
                                    >
                                      Copy config block
                                    </Button>
                                  </Card>
                                </div>

                                {tuningResult.analysis && (
                                  <div className="space-y-6">
                                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 italic">
                                      <Zap className="text-amber-500 w-6 h-6" />
                                      AI Efficiency Insights
                                    </h3>
                                    <div className="space-y-4">
                                      {tuningResult.analysis.parameter_tweaks?.map((t: any, i: number) => (
                                        <div key={i} className="p-5 rounded-2xl glass border-l-4 border-amber-500 bg-amber-500/5">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">{t.parameter}: {t.suggested_value}</p>
                                          <p className="text-xs font-medium opacity-70">{t.reason}</p>
                                        </div>
                                      ))}
                                      {tuningResult.analysis.indexing_insights?.map((idx: any, i: number) => (
                                        <div key={i} className="p-5 rounded-2xl glass border-l-4 border-emerald-500 bg-emerald-500/5 space-y-2">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{idx.table} Optimization</p>
                                          <p className="text-xs font-medium opacity-70">{idx.reason}</p>
                                          <div className="p-3 bg-black/40 rounded-xl font-mono text-[10px] text-emerald-400/80 break-all">{idx.sql}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                      {activeTab === 'output' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full p-6">
                          <div className="space-y-6">
                            <AnimatePresence>
                              {sandboxResult && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  className={`p-6 rounded-[2rem] border backdrop-blur-xl ${sandboxResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                                    }`}
                                >
                                  <div className="flex items-start gap-5">
                                    <div className={`p-4 rounded-2xl shadow-2xl ${sandboxResult.success ? 'bg-emerald-600 shadow-emerald-500/40' : 'bg-red-600 shadow-red-500/40'
                                      }`}>
                                      {sandboxResult.success ? <ShieldCheck className="h-5 w-5 text-white" /> : <AlertOctagon className="h-5 w-5 text-white" />}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
                                          {sandboxResult.success ? 'Integrity Verified' : 'Execution Failed'}
                                        </h3>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setSandboxResult(null)}
                                          className="h-6 w-6 rounded-lg hover:bg-white/10"
                                        >
                                          <X className="h-3 w-3 text-white/40" />
                                        </Button>
                                      </div>
                                      <p className="text-[11px] font-bold text-white/50 leading-relaxed uppercase tracking-tighter">
                                        {sandboxResult.success ? sandboxResult.message : sandboxResult.error}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="relative group/code rounded-[2.5rem] overflow-hidden border border-emerald-950/10 dark:border-white/10 shadow-lg">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-600 to-emerald-500/50 opacity-30" />
                              <div className="max-h-[400px] overflow-auto custom-scrollbar bg-slate-50/70 dark:bg-slate-950/40 backdrop-blur-md">
                                <CodeHighlighter code={output || '-- Awaiting Execution Data...'} language={targetFormat === 'csv' ? 'text' : 'sql'} />
                              </div>

                              {output && (
                                <div className="absolute bottom-6 right-6 flex items-center gap-3 pointer-events-auto">
                                  <Button
                                    onClick={runSandbox}
                                    disabled={isSandboxRunning}
                                    variant="outline"
                                    className={`rounded-2xl flex border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all font-black text-[10px] uppercase tracking-widest px-6 text-emerald-400 ${isSandboxRunning ? 'animate-pulse' : ''}`}
                                  >
                                    {isSandboxRunning ? (
                                      <Activity className="w-3 h-4 mr-2 animate-spin text-emerald-400" />
                                    ) : (
                                      <ShieldCheck className="w-3 h-4 mr-2 text-emerald-400" />
                                    )}
                                    {isSandboxRunning ? 'Validating...' : 'Dry Run Sandbox'}
                                  </Button>
                                  <Button
                                    onClick={() => copyToClipboard(fullOutput)}
                                    variant="outline"
                                    className="rounded-2xl flex border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all font-black text-[10px] uppercase tracking-widest px-6 text-amber-500"
                                  >
                                    <Copy className="w-3 h-4 mr-2 opacity-100 text-amber-500" />
                                    Copy SQL
                                  </Button>

                                  <Button
                                    onClick={() => downloadSql(fullOutput, 'migration.sql')}
                                    className="rounded-2xl flex shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all font-black text-[10px] uppercase tracking-widest px-8 group/btn"
                                  >
                                    <Download className="w-3 h-4 mr-2 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    Download SQL
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'translator' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col p-6 space-y-6">
                          <div className="flex-1 grid grid-rows-2 gap-6">
                            <div className="relative group">
                              <Badge variant="outline" className="absolute top-4 left-4 z-10 bg-amber-500/10 border-amber-500/30 text-amber-500 font-black uppercase text-[8px] tracking-widest">MySQL Source Query</Badge>
                              <Textarea
                                value={queryInput}
                                onChange={(e) => setQueryInput(e.target.value)}
                                placeholder="SELECT * FROM `users` WHERE `created_at` > DATE_SUB(NOW(), INTERVAL 1 DAY);"
                                className="h-full w-full p-10 pt-14 bg-foreground/[0.04] dark:bg-slate-950/40 border-foreground/10 dark:border-white/5 rounded-[2rem] font-mono text-sm resize-none focus:ring-1 ring-amber-500/40 outline-none placeholder:opacity-20 shadow-sm"
                              />
                              <Button
                                onClick={handleTranslateQuery}
                                disabled={isTranslating || !queryInput.trim()}
                                className="absolute bottom-6 right-6 rounded-xl flex bg-amber-500 hover:bg-amber-600 font-bold px-6 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                              >
                                {isTranslating ? <Activity className="w-4 animate-spin mr-2" /> : <Zap className="w-4 mr-2" />}
                                Transpile SQL
                              </Button>
                            </div>
                            <div className="relative group">
                              <Badge variant="outline" className="absolute top-4 left-4 z-10 bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-black uppercase text-[8px] tracking-widest">PostgreSQL Result</Badge>
                              <div className="h-full w-full p-10 pt-14 bg-foreground/[0.02] dark:bg-slate-950/20 border border-foreground/10 dark:border-white/5 rounded-[2rem] font-mono text-sm overflow-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
                                {queryOutput ? (
                                  <pre className="whitespace-pre-wrap">{queryOutput}</pre>
                                ) : (
                                  <div className="h-full flex items-center justify-center opacity-10">
                                    <Activity className="h-10 w-10 mr-4" />
                                    <span className="font-bold uppercase tracking-widest text-xs">Ready for input</span>
                                  </div>
                                )}
                              </div>
                              {queryOutput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(queryOutput)}
                                  className="absolute bottom-6 right-6 rounded-xl bg-white/5 hover:bg-white/10"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'rollback' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          {rollbackScript ? (
                            <div className="h-[500px] overflow-auto relative group">
                              <div className="absolute top-4 right-4 z-10 flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(rollbackScript)} className="rounded-xl flex font-bold text-[10px] uppercase tracking-widest bg-slate-900/40 backdrop-blur-md border-white/10">
                                  <Copy className="h-4 w-3 mr-2" /> Copy
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => downloadSql(rollbackScript, 'rollback.sql')} className="rounded-xl flex font-bold text-[10px] uppercase tracking-widest bg-red-500/20 text-red-400 border-red-500/20 hover:bg-red-500/30">
                                  <Download className="h-4 w-3 mr-2" /> Download
                                </Button>
                              </div>
                              <CodeHighlighter code={rollbackScript} language="sql" />
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 p-20 text-center gap-4">
                              <Eraser className="h-16 w-16" />
                              <p className="font-bold text-sm uppercase tracking-[0.2em]">Run conversion to generate rollback</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'visualization' && (
                        <div className="p-4 h-[500px] relative group/erd rounded-3xl overflow-hidden border border-foreground/10 dark:border-white/5 bg-foreground/5 dark:bg-slate-950/40 shadow-sm">
                          {schemaData ? (
                            <>
                              <ERDVisualizer tables={schemaData} />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsFullScreenERD(true)}
                                className="absolute top-6 right-6 opacity-0 group-hover/erd:opacity-100 transition-all bg-slate-900/40 backdrop-blur-md border-white/10 rounded-xl hover:bg-primary/20 hover:scale-110"
                              >
                                <Maximize2 className="h-4 w-4 text-primary" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-20 p-20 text-center h-full gap-4">
                              <Search className="h-16 w-16 mb-4" />
                              <p className="font-bold text-sm uppercase tracking-[0.2em]">Click Analyze to generate ERD</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'mapper' && schemaData && (
                        <div className="h-[500px] p-2 relative group/mapper">
                          <MigrationMapper schema={schemaData} />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsFullScreenMapper(true)}
                            className="absolute top-6 right-6 opacity-0 group-hover/mapper:opacity-100 transition-all bg-slate-900/40 backdrop-blur-md border-white/10 rounded-xl hover:bg-primary/20 hover:scale-110 z-50"
                          >
                            <Maximize2 className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      )}

                      {activeTab === 'cdc_sync' && (
                        <div className="p-10 flex flex-col items-center justify-center h-[500px] text-center space-y-8">
                          <div className="relative">
                            <div className="absolute -inset-8 bg-emerald-500/20 blur-[50px] rounded-full animate-pulse" />
                            <Activity className={`h-24 w-24 text-emerald-500 relative z-10 ${isReplayingCdc ? 'animate-spin' : ''}`} />
                          </div>

                          <div className="space-y-3">
                            <h2 className="text-3xl font-black tracking-tighter italic uppercase">Zero-Downtime Replay</h2>
                            <p className="text-foreground/40 dark:text-slate-400 max-w-sm mx-auto text-xs font-bold leading-relaxed uppercase tracking-[0.2em] opacity-60">
                              Capture binlog events during the migration snapshot and replay them to ensure data consistency.
                            </p>
                          </div>

                          <Card className="glass border-emerald-500/20 px-8 py-4 rounded-[2rem] bg-emerald-500/5 flex items-center gap-6">
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-wider">Source Context</p>
                              <p className="font-mono text-sm font-bold">{sourceConn.db || 'Unnamed Source'}</p>
                            </div>
                            <div className="h-8 w-px bg-emerald-500/20" />
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-wider">Target Node</p>
                              <p className="font-mono text-sm font-bold">{targetConn.db || 'None Selected'}</p>
                            </div>
                          </Card>

                          <div className="flex flex-col gap-4 w-full max-w-xs">
                            <Button
                              onClick={handleCdcReplay}
                              disabled={isReplayingCdc}
                              className="w-full flex justify-center bg-emerald-500 hover:bg-emerald-600 rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all"
                            >
                              {isReplayingCdc ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                              Replay Delta Events
                            </Button>

                            {cdcResult && (
                              <Badge variant="outline" className="py-2 px-6 rounded-xl border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                {cdcResult.replayed_count} events synced
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'diff' && (
                        <div className="h-[500px] p-2">
                          <DiffExplorer oldCode={mysqlInput} newCode={output} />
                        </div>
                      )}

                      {activeTab === 'report' && (
                        <div className="p-8 space-y-4 max-h-[500px] overflow-auto custom-scrollbar">
                          {conversionReport.length > 0 ? conversionReport.map((r, i) => {
                            const isAi = r.message.includes('AI Insight:') || r.message.includes('AI Transpiled') || r.message.includes('AI Suggestion');
                            const isCleaning = r.message.includes('Auto-Cleaning:');
                            return (
                              <div key={i} className={`group relative p-5 rounded-3xl glass border-l-4 font-bold text-xs ${r.type === 'error' ? 'border-red-500 bg-red-500/5' :
                                isAi ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.05)]' :
                                  isCleaning ? 'border-amber-500 bg-amber-500/5' :
                                    'border-white/10 bg-white/[0.02]'
                                } transition-all hover:scale-[1.01] duration-300`}>
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-start gap-4">
                                    {isAi && (
                                      <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                                        <Zap className="h-3 w-3 text-white fill-white" />
                                      </div>
                                    )}
                                    {isCleaning && (
                                      <div className="bg-amber-500/20 p-2 rounded-xl">
                                        <Eraser className="h-3 w-3 text-amber-500 fill-amber-500" />
                                      </div>
                                    )}
                                    <div className="flex-1 pt-0.5">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isAi ? 'text-primary' : isCleaning ? 'text-amber-500' : 'opacity-40'}`}>
                                          {isAi ? 'Gemini AI Agent' : isCleaning ? 'Heuristic Cleaner' : r.type}
                                        </span>
                                      </div>
                                      <p className={isAi || isCleaning ? 'text-foreground font-black text-sm' : 'opacity-80'}>
                                        {r.message.replace('AI Insight: ', '').replace('AI Suggestion: ', '').replace('Auto-Cleaning: ', '')}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Render SQL Suggestion if present */}
                                  {(r as any).sql && (
                                    <div className="mt-2 rounded-2xl bg-black/40 border border-white/5 overflow-hidden">
                                      <div className="px-4 py-2 bg-white/5 flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Suggested Optimization</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-md hover:bg-white/10"
                                          onClick={() => {
                                            navigator.clipboard.writeText((r as any).sql);
                                            toast.success('Optimization SQL copied');
                                          }}
                                        >
                                          <Copy className="h-3 w-3 opacity-40 hover:opacity-100" />
                                        </Button>
                                      </div>
                                      <div className="p-4 font-mono text-[10px] text-primary/80 whitespace-pre scrollbar-none overflow-x-auto">
                                        {(r as any).sql}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="opacity-20 text-center p-20 flex flex-col items-center justify-center h-full gap-4">
                              <Activity className="h-12 w-12 opacity-20" />
                              <p className="uppercase tracking-widest font-bold text-xs italic">Clear path. No issues.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </AnimatePresence>
                </div>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        <footer className="mt-20 pt-10 border-t border-foreground/10 dark:border-white/5 flex items-center justify-between opacity-30 text-xs font-bold uppercase tracking-widest text-foreground dark:text-white">
          <div>© 2026 SQL-STREAM Core Ecosystem</div>
          <div className="flex gap-8">
            <Link href="/overview" className="hover:text-primary transition-colors">Overview</Link>
            <Link href="/docs" className="hover:text-primary transition-colors">Docs</Link>
            <a href="https://github.com/chanminko1234/SQLSTREAM_REPO" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
            <Link href="/status" className="hover:text-primary transition-colors">Status</Link>
            <Link href="/support" className="hover:text-primary transition-colors text-amber-500/80">Support</Link>
          </div>
        </footer>
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
      <Dialog open={isFullScreenERD} onOpenChange={setIsFullScreenERD}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 border-none bg-slate-950/90 backdrop-blur-3xl overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(var(--primary),0.1)] focus:outline-none">
          {schemaData && (
            <div className="h-full w-full relative group">
              <ERDVisualizer tables={schemaData} />
              <div className="absolute top-12 left-12 pointer-events-none space-y-4">
                <div className="flex items-center gap-6">
                  <div className="bg-emerald-600 p-4 rounded-[2rem] shadow-2xl shadow-emerald-600/40">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">Architectural View</h2>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Schema Mapping Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isFullScreenMapper} onOpenChange={setIsFullScreenMapper}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 border-none bg-slate-950/90 backdrop-blur-3xl overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(var(--primary),0.1)] focus:outline-none">
          {schemaData && (
            <div className="h-full w-full relative group">
              <MigrationMapper schema={schemaData} />
              <div className="absolute top-12 left-12 pointer-events-none space-y-4">
                <div className="flex items-center gap-6">
                  <div className="bg-teal-600 p-4 rounded-[2rem] shadow-2xl shadow-teal-600/40">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">Architectural Bridge</h2>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Transformation Mapping</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Welcome;
