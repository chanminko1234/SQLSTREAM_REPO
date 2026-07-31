<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'SQL-STREAM') }}</title>

    <!-- SEO & Social Sharing Hub -->
    <meta name="description" content="Premium MySQL to PostgreSQL Transpiler & Migration Orchestrator. Engineering speed, Predictive AI, and real-time streaming built for high-availability systems.">
    <meta name="keywords" content="SQL, MySQL, PostgreSQL, Transpiler, Database Migration, Zero Downtime, Laravel">
    <meta name="author" content="Chan Min Ko">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:title" content="SQL-STREAM | Premium MySQL to PostgreSQL Converter">
    <meta property="og:description" content="The ultimate bridge from MySQL to PostgreSQL. Engineering speed, Predictive AI, and real-time streaming built for high-availability systems.">
    <meta property="og:image" content="{{ asset('images/share-card.png') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url('/') }}">
    <meta property="twitter:title" content="SQL-STREAM | Premium MySQL to PostgreSQL Converter">
    <meta property="twitter:description" content="The ultimate bridge from MySQL to PostgreSQL. Engineering speed, Predictive AI, and real-time streaming built for high-availability systems.">
    <meta property="twitter:image" content="{{ asset('images/share-card.png') }}">

    <!-- Inter Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%2310b981%22/><path d=%22M30 30L70 70M70 30L30 70%22 stroke=%22white%22 stroke-width=%2212%22 stroke-linecap=%22round%22/></svg>">

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
    @inertia
</body>

</html>
