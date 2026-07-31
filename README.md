# SQLStream 🚀
> Real-Time MySQL to PostgreSQL Transpiler & High-Performance Migration Orchestrator.

[![Laravel 12](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Theme: Nature Dark](https://img.shields.io/badge/Theme-Nature_Dark-10b981?style=for-the-badge)](https://github.com/chanminko1234/SQLSTREAM_REPO)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

![Protocol Launch Demo](docs/images/dashboard_demo.webp)

**SQLStream** is a high-performance database migration platform that combines real-time **Server-Sent Events (SSE)** result streaming, AST-based MySQL to PostgreSQL translation, automated ORM schema generation, interactive ERD modeling, and zero-downtime cutover orchestration inside a premium **Lush Emerald Nature Dark** UI.

---

## 📸 System Showcase

| Landing Page | Interactive Dashboard |
| :---: | :---: |
| ![Landing](docs/images/landing.png) | ![Dashboard](docs/images/dashboard.png) |

| Infrastructure Health | Engineering Documentation |
| :---: | :---: |
| ![Status](docs/images/status.png) | ![Docs](docs/images/hero.png) |

---

## ✨ Key Features

- 🌿 **Enforced Nature Dark Mode**: High-contrast Lush Emerald, Soft Sage, and Pine Obsidian Dark Mode styling built with glassmorphism and subtle micro-animations.
- ⚡ **Real-Time SSE Streaming**: Instant schema and data streaming powered by Server-Sent Events, PHP Generators, and database cursors.
- 🔄 **Reversible Migrations & Rollback Scripting**:
  - Auto-generated **`down.sql`** transactional rollback scripts.
  - Native **Laravel Migration (PHP)** class generation with `up()` & `down()` schema definitions.
- 🛠️ **Multi-Format Code & ORM Exporters**:
  - **Prisma Schema (`schema.prisma`)**: Model definitions with `@id`, autoincrement, and column mapping (`@@map`).
  - **Drizzle ORM (`schema.ts`)**: Type-safe `drizzle-orm/pg-core` table schemas (`serial`, `text`, `integer`, `timestamp`, `json`).
  - **Production Docker Stack (`docker-compose.yml`)**: Ready-to-run PostgreSQL 16 + pgAdmin4 container infrastructure.
- 📊 **Resilient Interactive ERD & Column Mapper**:
  - Powered by ReactFlow with automatic column normalization, foreign key routing, and PII sensitivity badges.
- 💡 **AI-Driven Index Advisor & PG Architect**:
  - Automatic index recommendations and tailored `postgresql.conf` tuning based on target server RAM and CPU core specs.
- 🛡️ **Hardened Security & SSRF Protection**:
  - Strict host validation, read-only SQL validation sandbox, and identity federation via GitHub and Google SSO.

---

## 🏗️ Project Architecture

```bash
├── app/
│   ├── Http/Controllers/
│   │   ├── ConversionController.php   # MySQL to Postgres DDL & AST Converter
│   │   ├── SseController.php          # Real-Time SSE Streaming Handler
│   │   ├── IndexAdvisorController.php # AI-driven Index Recommendations
│   │   └── OrchestrationController.php# CDC Pipeline & Cutover Manager
│   ├── Services/
│   │   ├── DatabaseAdapters/          # Adapter Strategy (MySQL, Postgres, SQLite, Oracle)
│   │   ├── SQL/
│   │   │   └── SQLParserService.php   # AST Parser & Transpiler Rules
│   │   └── AuditLogger.php            # Security & Compliance Audit Trail
├── resources/js/
│   ├── components/
│   │   ├── ERDVisualizer.tsx          # ReactFlow ERD Node Visualizer
│   │   ├── DiffExplorer.tsx           # Multi-Format Code & ORM Exporter
│   │   ├── MigrationMapper.tsx        # Type Conversion Rule Badges
│   │   ├── SQLStreamer.tsx            # Live Stream Terminal Component
│   │   └── ThemeToggle.tsx            # Nature Dark Mode Indicator
│   └── Pages/
│       ├── Welcome.tsx                # Main Converter Engine & Playground
│       ├── Dashboard.tsx              # Infrastructure Control Center
│       ├── Validation.tsx             # Data Integrity Parity Check
│       └── Orchestrator.tsx           # Zero-Downtime Migration Manager
└── routes/web.php                     # Protocol API & Stream Routes
```

---

## 🚀 Getting Started

Establish your mission-critical SQLStream node with the following engineering protocol.

### 📋 Prerequisites

Before initialization, ensure your infrastructure meets the following specifications:
- **PHP**: ^8.2 (with JSON, PDO, and OpenSSL extensions)
- **Node.js**: ^20.x (LTS recommended)
- **Database**: PostgreSQL 15+ (Sink), MySQL 5.7+/8.0+ (Source)
- **Composer**: ^2.6

### 🛠️ Installation Protocol

1. **Clone the Repository**
   ```bash
   git clone https://github.com/chanminko1234/SQLSTREAM_REPO.git
   cd converter
   ```

2. **Initialize Backend Environment**
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Configure Database & Environment (`.env`)**
   Update your database credentials to connect to your target PostgreSQL engine.
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=sql_stream
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   ```

4. **Run Migrations & Seed Database**
   ```bash
   php artisan migrate --seed
   ```

5. **Deploy Frontend Build**
   ```bash
   npm install
   npm run build
   ```

6. **Start Development Servers**
   ```bash
   # Terminal 1: Laravel Backend
   php artisan serve

   # Terminal 2: Vite Dev Server (optional)
   npm run dev
   ```
   Access application at: `http://localhost:8000`

---

## 🧠 Technical Insight: Why SSE?

SQLStream utilizes **Server-Sent Events (SSE)** for real-time streaming:

1. **Lightweight Protocol**: Operates over standard HTTP/2 without the complex handshake or custom server protocols required by WebSockets.
2. **Automatic Reconnection**: Browsers natively handle network reconnections via `EventSource`.
3. **Memory Optimization**: PHP Generators (`yield`) stream rows with O(1) memory complexity, making it possible to stream millions of rows without memory spikes.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Chan Min Ko**
- GitHub: [@chanminko1234](https://github.com/chanminko1234)
- Twitter: [@chan_min_ko_24](https://x.com/chan_min_ko_24)

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

*Engineered with precision for high-performance database migrations.*
