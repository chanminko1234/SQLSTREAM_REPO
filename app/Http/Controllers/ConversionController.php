<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiService;
use App\Services\BinlogListener;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Faker\Factory as Faker;
use PHPSQLParser\PHPSQLParser;
use App\Services\SQL\SQLParserService;
use App\Services\AuditLogger;
use App\Traits\ValidatesDatabaseHost;

class ConversionController extends Controller
{
    use ValidatesDatabaseHost;
    protected GeminiService $gemini;
    protected BinlogListener $binlog;
    protected SQLParserService $sqlParser;
    protected \App\Services\ConversionOrchestrator $orchestrator;

    public function __construct(
        GeminiService $gemini, 
        BinlogListener $binlog, 
        SQLParserService $sqlParser,
        \App\Services\ConversionOrchestrator $orchestrator
    ) {
        $this->gemini = $gemini;
        $this->binlog = $binlog;
        $this->sqlParser = $sqlParser;
        $this->orchestrator = $orchestrator;
    }

    /**
     * Convert MySQL dump to specified format (Streaming)
     */
    public function convert(Request $request): StreamedResponse|JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mysql_dump' => 'required_without:source|string|max:102400000',
            'source_type' => 'sometimes|string|in:mysql,postgresql,sqlite,oracle,sqlserver,sqlsrv,sql_server',
            'source' => 'sometimes|array',
            'source.host' => 'required_with:source|string',
            'source.port' => 'required_with:source|string',
            'source.user' => 'required_with:source|string',
            'source.pass' => 'present_with:source|string|nullable',
            'source.db' => 'required_with:source|string',
            'target_format' => 'required|string|in:postgresql,csv,xlsx,xls,sqlite,psql',
            'options' => 'sometimes|array',
            'options.schema_only' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $validated = $validator->validated();
        $targetFormat = $validated['target_format'];
        $options = $request->input('options', []);
        $sourceType = $request->input('source_type', 'mysql');
        $mysqlDump = $request->input('mysql_dump');
        $source = $request->input('source');
        if ($source && isset($source['host'])) {
            $this->validateHost($source['host']);
        }

        AuditLogger::log('convert', 'database', $targetFormat, [
            'options' => $options,
            'source_type' => $sourceType,
            'has_dump' => !empty($mysqlDump),
        ]);

        $wantsJson = $request->wantsJson() || $request->ajax() || $request->has('json');
 
        return $this->orchestrator->convertToResponse(
            $mysqlDump ?: $source, 
            $targetFormat, 
            $options, 
            $sourceType,
            $wantsJson
        );
    }

    /**
     * Handle file upload and convert (Streaming)
     */
    public function upload(Request $request): StreamedResponse|JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:sql,txt|max:102400',
            'source_type' => 'sometimes|string|in:mysql,postgresql,sqlite,oracle,sqlserver',
            'target_format' => 'required|string|in:postgresql,csv,xlsx,sqlite,psql',
        ]);
 
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
 
        $file = $request->file('file');
        $targetFormat = $request->input('target_format');
        
        $optionsRaw = $request->input('options', []);
        $options = is_string($optionsRaw) ? json_decode($optionsRaw, true) : $optionsRaw;
        if (!is_array($options)) $options = [];
        
        $sourceType = $request->input('source_type', 'mysql');
        $wantsJson = $request->wantsJson() || $request->ajax() || $request->has('json');
 
        return $this->orchestrator->convertToResponse(
            $file, 
            $targetFormat, 
            $options, 
            $sourceType,
            $wantsJson
        );
    }

    /**
     * Stream data directly between MySQL and PostgreSQL
     */
    public function stream(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|array',
            'source_type' => 'sometimes|string|in:mysql,postgresql,sqlite,oracle,sqlserver,sqlsrv,sql_server',
            'source.host' => 'required|string',
            'source.port' => 'required|string',
            'source.user' => 'required|string',
            'source.pass' => 'present|string|nullable',
            'source.db' => 'required|string',
            'target' => 'required|array',
            'target.host' => 'required|string',
            'target.port' => 'required|string',
            'target.user' => 'required|string',
            'target.pass' => 'present|string|nullable',
            'target.db' => 'required|string',
            'options' => 'sometimes|array',
            'options.incremental_sync' => 'sometimes|boolean',
            'options.incrementalSync' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $source = $request->input('source');
        $target = $request->input('target');
        $options = $request->input('options', []);
        
        $this->validateHost($source['host']);
        $this->validateHost($target['host']);

        AuditLogger::log('stream_migration', 'database', $source['db'], [
            'source' => $source,
            'target' => $target,
            'options' => $options
        ]);

        try {
            $sourceType = $request->input('source_type', 'mysql');
            
            // Dispatch to background queue for Zero-Downtime orchestration
            \App\Jobs\SyncDatabaseJob::dispatch($source, $target, $options, $sourceType);

            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Zero-Downtime Migration Engaged in background.',
                    'orchestrator_link' => '/orchestrator?source='.$source['db'].'&target='.$target['db'],
                    'report' => [['type' => 'info', 'message' => "Production-grade streaming has been dispatched. Transition to Mission Control to monitor live telemetry."]]
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Migration dispatch failed: '.$e->getMessage(),
            ], 422);
        }
    }



    /**
     * Get real-time migration status for dashboard
     */
    public function getStatus(Request $request): JsonResponse
    {
        $sourceDb = $request->input('source_db');
        $targetDb = $request->input('target_db');

        $stats = DB::table('migration_checkpoints')
            ->where('source_db', $sourceDb)
            ->where('target_db', $targetDb)
            ->get();

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }    /**
     * Run SQL in a temporary sandbox schema for validation
     */
    public function sandboxRun(Request $request): JsonResponse
    {
        $sql = $request->input('sql');
        if (empty($sql)) {
            return response()->json(['success' => false, 'error' => 'No SQL provided for sandbox run'], 422);
        }

        try {
            $this->sqlParser->validateSQLForSandbox($sql);
        } catch (\Throwable $e) {
            AuditLogger::log('sandbox_blocked', 'sql', null, [
                'sql_preview' => Str::limit($sql, 200),
                'error' => $e->getMessage()
            ]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 403);
        }

        AuditLogger::log('sandbox_run', 'sql', null, [
            'sql_preview' => Str::limit($sql, 500)
        ]);

        $schemaId = 'sandbox_'.Str::random(8);

        try {
            DB::connection('temp_pgsql')->beginTransaction();

            // 1. Create a temporary schema
            DB::connection('temp_pgsql')->unprepared("CREATE SCHEMA \"{$schemaId}\"");
            
            // 2. Set search path to this schema so we don't affect public
            DB::connection('temp_pgsql')->unprepared("SET search_path TO \"{$schemaId}\", public");
            
            // 3. Enforce strict timeouts for the current session
            DB::connection('temp_pgsql')->unprepared("SET statement_timeout = '10s'");
            DB::connection('temp_pgsql')->unprepared("SET lock_timeout = '5s'");

            // 4. Run the SQL
            DB::connection('temp_pgsql')->unprepared($sql);

            // 4. If we reached here, success!
            DB::connection('temp_pgsql')->rollBack(); // Always rollback
            
            DB::connection('temp_pgsql')->unprepared("DROP SCHEMA IF EXISTS \"{$schemaId}\" CASCADE");

            return response()->json([
                'success' => true,
                'message' => 'Sandbox validation successful. Your SQL is verified and structurally sound.',
                'schema' => $schemaId
            ]);

        } catch (\Throwable $e) {
            DB::connection('temp_pgsql')->rollBack();
            DB::connection('temp_pgsql')->unprepared("DROP SCHEMA IF EXISTS \"{$schemaId}\" CASCADE");

            return response()->json([
                'success' => false,
                'error' => 'Sandbox execution failed: '.$e->getMessage(),
            ], 422);
        }
    }


    /**
     * Analyze MySQL schema for visualization
     */
    public function analyze(Request $request): JsonResponse
    {
        $mysqlDump = $request->input('mysql_dump', '');
        $source = $request->input('source');
        $options = $request->input('options', []);
        
        $sourceType = $request->input('source_type', 'mysql');
        $adapter = app(SourceAdapterFactory::class)->create($sourceType);

        if ($mysqlDump) {
            $data = $adapter->parseDump($mysqlDump);
        } elseif ($source) {
            $adapter->setupConnection($source);
            $data = $adapter->fetchSchema($options);
        } else {
            return response()->json(['success' => false, 'error' => 'No analysis input provided'], 422);
        }

        $converted = [
            'sql' => "-- Use streaming endpoints for full conversion\n",
            'report' => [],
            'schema_meta' => []
        ];
        
        return response()->json([
            'success' => true,
            'data' => [
                'tables' => $data['tables'] ?? [],
                'schema_meta' => $data['tables'] ?? []
            ]
        ]);
    }


    /**
     * Translate a MySQL query string to PostgreSQL
     */
    public function translateQuery(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|max:1024000',
        ]);
        
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
        
        $query = $request->input('query');
        
        try {
            $translated = $this->sqlParser->transpileQuery($query);
            return response()->json([
                'success' => true,
                'translated' => $translated
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Query translation failed: '.$e->getMessage()
            ], 422);
        }
    }

    /**
     * Generate PostgreSQL tuning recommendations based on schema and logs
     */
    public function recommendTuning(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'slow_query_log' => 'sometimes|nullable|string|max:1024000',
            'ram_gb' => 'required|numeric|min:1',
            'cpu_cores' => 'required|integer|min:1',
            'storage_type' => 'required|string|in:ssd,hdd',
            'connection_count' => 'required|integer|min:10',
            'data_volume_gb' => 'sometimes|numeric|min:0',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $validated = $validator->validated();
        $ram = $validated['ram_gb'];
        $cores = $validated['cpu_cores'];
        $storage = $validated['storage_type'];
        $connections = $validated['connection_count'];
        $volume = $validated['data_volume_gb'] ?? 0;
        $logs = $validated['slow_query_log'] ?? '';

        try {
            // Tuning logic is now handled by the factory/orchestrator pattern
            $converter = app(\App\Services\Converters\ConverterFactory::class)->create('postgresql');
            $recommendations = $converter->calculatePgConfig($ram, $cores, $storage, $connections, $volume);
            
            $logAnalysis = null;
            if (!empty($logs)) {
                $logAnalysis = $this->gemini->analyzeSlowLogs($logs, (float)$volume);
            }

            return response()->json([
                'success' => true,
                'config' => $recommendations,
                'analysis' => $logAnalysis,
                'metadata' => [
                    'source_ram' => $ram . 'GB',
                    'source_cores' => $cores,
                    'generated_at' => now()->toDateTimeString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Tuning calculation failed: '.$e->getMessage()
            ], 422);
        }
    }

    /**
     * Capture a data change during migration (Simulated CDC/Binlog)
     */
    public function captureCdcChange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_db' => 'required|string',
            'target_db' => 'required|string',
            'table' => 'required|string',
            'data' => 'required|array',
            'operation' => 'required|string|in:INSERT,UPDATE,DELETE'
        ]);

        $change = $this->binlog->captureChange(
            $validated['source_db'],
            $validated['target_db'],
            $validated['table'],
            $validated['data'],
            $validated['operation']
        );

        AuditLogger::log('cdc_capture', 'table', $validated['table'], [
            'operation' => $validated['operation'],
            'source' => $validated['source_db']
        ]);

        return response()->json([
            'success' => true,
            'captured_id' => $change->id,
            'message' => 'Change captured for replay'
        ]);
    }

    /**
     * Replay pending CDC changes to target database
     */
    public function replayCdcChanges(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_db' => 'required|string',
            'target_db' => 'required|string'
        ]);

        $result = $this->binlog->replayPendingChanges(
            $validated['source_db'],
            $validated['target_db']
        );

        AuditLogger::log('cdc_replay', 'database', $validated['target_db'], [
            'replayed_count' => $result['replayed_count'],
            'source_db' => $validated['source_db']
        ]);

        return response()->json([
            'success' => true,
            'replayed_count' => $result['replayed_count'],
            'errors' => $result['errors']
        ]);
    }
}