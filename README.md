# Zeam Dashboards

This repository contains Grafana dashboards and monitoring infrastructure for the Zeam blockchain node.

## Overview

This repository provides:
- **Grafana Dashboards**: Pre-configured dashboards for monitoring Zeam node performance
- **Docker Compose Setup**: Complete monitoring stack with Prometheus and Grafana
- **Prometheus Configuration**: Templates and examples for Prometheus setup

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- A running Zeam node with metrics enabled

### 1. Prometheus Configuration

A basic Prometheus configuration is included in `prometheus/prometheus.yml` that will work out of the box.

**Option A: Use the included configuration (Recommended for quick start)**
The repository includes a basic `prometheus/prometheus.yml` that will start monitoring:
- Prometheus itself (localhost:9090)
- A Zeam node running on the host (host.docker.internal:8081 using [lean-quickstart](https://github.com/blockblaz/lean-quickstart))
- Node exporter (host.docker.internal:9100, will show as "down" if not running)

**Option B: Generate custom configuration (Advanced users)**
If you have access to the main Zeam repository, you can generate a custom configuration:

```bash
# From your Zeam repository
./zig-out/bin/zeam generate_prometheus_config --output /path/to/zeam-dashboards/prometheus/prometheus.yml
```

### 2. Start the Monitoring Stack

```bash
# Clone this repository
git clone https://github.com/blockblaz/zeam-dashboards.git
cd zeam-dashboards

# Start Prometheus and Grafana (uses included configuration)
docker-compose up -d
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

Data sources (Prometheus and Infinity) are automatically provisioned — no manual configuration needed.

## Dashboard Features

### Main Dashboard

The main dashboard (`grafana/dashboards/zeam_main.json`) monitors:

- **P95 Block Processing Time**: 95th percentile of block processing duration (`chain_onblock_duration_seconds`)

### Fork Choice Tree Dashboard

The fork choice tree dashboard (`grafana/dashboards/zeam_forkchoice.json`) provides real-time visualization of the consensus fork choice:

- **Interactive Node Graph**: Visual representation of the fork choice tree showing blocks and their relationships
- **Color-Coded Arc Borders**:
  - 🟣 **Purple**: Finalized blocks (immutable canonical chain)
  - 🔵 **Blue**: Justified blocks (2/3 supermajority checkpoint)
  - 🟠 **Orange**: Current chain head
  - 🟢 **Green**: Timely blocks (normal blocks)
  - ⚫ **Gray**: Orphaned blocks (historical forks that diverged before finalization)
- **Arc Border Completeness**: Represents validator weight (larger border = more validator support)
- **Best Child Path**: Edges showing parent-child relationships in the fork tree
- **Chain Progress**: Time series showing head, justified, and finalized slot progression
- **Slots Parameter**: Shows last 50 slots by default (editable in the panel query URL `?slots=N`)

### State Transition & Cache Performance Dashboard

The state transition dashboard (`grafana/dashboards/zeam_state_transition.json`) monitors state transition performance and justifications cache:

- **Get Justification Time (P50/P95)**: Latency percentiles for the justification retrieval path
- **State Transition Time by Phase**: Stacked breakdown of slots, blocks, attestations, justifications processing
- **SSZ Hashing Performance**: Merkleization timings for state root, validation, and block header hash
- **Get Justification Time (Avg)**: Gauge with green/yellow/red thresholds
- **Chain Progress**: Current head, justified, and finalized slot numbers
- **Processing Throughput**: Slots and attestations processed per second
- **Overall State Transition Time**: End-to-end P50/P95/P99 latency
- **Justifications Cache Hit/Miss Rate**: Cache throughput
- **Justifications Cache Hit/Miss Time**: Average latency for cache hits vs misses
- **Justifications Cache Miss/Hit Time Ratio**: Performance penalty for cache misses
- **Justifications Cache Hit Ratio**: Hit percentage with red/yellow/green thresholds
- **Justifications Cache Hits/Misses (Total)**: Cumulative counters since process start

**API Endpoint**: The fork choice dashboard fetches data from `/api/forkchoice/graph` endpoint on your Zeam node

#### Using Fork Choice Dashboard with Custom Grafana Instance

If you have your own Grafana setup and want to import the fork choice dashboard without using the Docker Compose stack:

**Prerequisites:**
1. Install the **yesoreyeram-infinity-datasource** plugin:
   - Official install docs (see for version-specific steps):
     - `https://grafana.com/docs/plugins/yesoreyeram-infinity-datasource/latest/setup/installation/`
   - Via Grafana UI:
     - Open the menu (Grafana icon)
     - Administration → Plugins and data → Plugins
     - Search for "Infinity" (by Grafana Labs)
     - Click **Infinity** → **Install**
   - Via CLI: `grafana-cli plugins install yesoreyeram-infinity-datasource`

2. Configure the Infinity data source:
   - Go to Configuration → Data Sources → Add data source
   - Search for "Infinity" and select it
   - Set a name (e.g., "infinity") and save
   - Note: No need to add a Base URL or params here; set the URL/params in the panel query.

**Import the Dashboard:**
1. Download `grafana/dashboards/zeam_forkchoice.json` from this repository
2. In Grafana: Dashboard → Import Dashboard → Upload JSON file
3. Select your Infinity data source when prompted
4. After import, edit the dashboard panel queries to update the API endpoint URL and split nodes/edges:
   - Edit panel → Query tab
   - Ensure you have **two queries** (nodes and edges). If you only see one, duplicate it.
   - Query A (nodes):
     - URL: `http://YOUR_ZEAM_NODE:8081/api/forkchoice/graph?slots=50`
     - Rows/Root (Parsing options & Result fields): `nodes`
     - Format: **Nodes – Node Graph**
   - Query B (edges):
     - URL: `http://YOUR_ZEAM_NODE:8081/api/forkchoice/graph?slots=50`
     - Rows/Root (Parsing options & Result fields): `edges`
     - Format: **Edges – Node Graph**
   - Adjust `slots` parameter as needed (max: 200)

**Data Source Configuration Details:**
- **Type**: JSON
- **Source**: URL
- **Format**: Table
- **URL**: `http://YOUR_ZEAM_NODE:8081/api/forkchoice/graph?slots=50`
- **Method**: GET
- **Rows/Root (Parsing options & Result fields)**:
  - For nodes query: `nodes`
  - For edges query: `edges`
  - Do not leave Rows/Root empty; otherwise Grafana will treat `nodes` and `edges` as string fields in one frame and the Node Graph panel won't render.

**Docker on macOS note:**
- If Grafana runs in Docker and your Zeam node runs on the host, use `http://host.docker.internal:8081/...` in the query URL instead of `http://localhost:8081/...`.

**Visualization note:**
- The panel visualization must be set to **Node Graph**.

**Node Circle Numbers Explained:**
- **First number (mainStat)**: Validator weight/votes supporting that block
- **Second number (secondaryStat)**: Slot number

## Configuration

### Prometheus Configuration

The repository includes a basic `prometheus/prometheus.yml` configuration that works out of the box. You can customize it for your specific setup:

**Basic Configuration Includes:**
- Prometheus self-monitoring (localhost:9090)
- Zeam node monitoring (host.docker.internal:8081)
- Node exporter (host.docker.internal:9100)

**Customizing the Configuration:**
- Edit `prometheus/prometheus.yml` to add your specific targets
- Update scrape intervals as needed
- Add alert rules and retention policies

**For Advanced Users:**
If you have access to the main Zeam repository, you can generate a custom configuration using the Zeam CLI:
```bash
./zig-out/bin/zeam generate_prometheus_config --output prometheus/prometheus.yml
```

## Development

### Prerequisites

- Node.js (for dashboard scripts)

```bash
npm install
```

### Editing Dashboards

To edit or extend an existing Grafana dashboard with minimal diff:

1. Grab the `.json` dashboard file from the current branch
2. Import the file to Grafana via the web UI at `/dashboard/import` (keep the same UID)
3. Visually edit the dashboard in the Grafana UI
4. Once done, make sure to leave the exact same visual aspect as before: same refresh interval, time range, etc.
5. Save the dashboard (CTRL+S)
6. Run `npm run download` (see below)
7. Check `git diff` of updated dashboards, commit, push and open your PR

### Using the Download Script

1. Generate a Grafana API token:
   - Open Grafana → Administration → Service accounts
   - Create a new service account with **Editor** role
   - Generate a token and copy it

2. Create a file `.secrets.env` in the project root:

```bash
GRAFANA_API_KEY=your_token_here
GRAFANA_URL=http://localhost:3001
```

3. Run the download script:

```bash
npm run download
```

The script will:
- Fetch all dashboards with `zeam_` UID prefix from the Grafana API
- Only update dashboards that already exist locally (ignores test duplicates)
- Run each dashboard through the lint/normalize pipeline
- Write deterministic JSON output (`JSON.stringify` with 2-space indent)
- Preserve the version number to minimize diff noise

### Linting Dashboards

Lint all dashboards in place (normalizes formatting, datasource UIDs, tags, timezone, etc.):

```bash
npm run lint-dashboards
```

### Validating Dashboards (CI)

Checks that all dashboards are properly linted — fails if any changes are needed:

```bash
npm run validate-dashboards
```

### Adding New Dashboards

1. Create the dashboard in the Grafana UI
2. Before saving, set the dashboard UID to start with `zeam_` (e.g., `zeam_networking`):
   - Dashboard Settings (gear icon) → JSON Model → change the `uid` field
3. Save the dashboard in Grafana (CTRL+S)
4. Create a local placeholder file so the download script picks it up:
   ```bash
   echo '{}' > grafana/dashboards/zeam_networking.json
   ```
5. Run the download script to fetch and lint:
   ```bash
   npm run download
   ```
6. Verify with `git diff`, commit and open a PR

### Dashboard UID Convention

All dashboard UIDs must start with `zeam_` and files must be named `{uid}.json`:

| Dashboard | UID | File |
|-----------|-----|------|
| Main | `zeam_main` | `grafana/dashboards/zeam_main.json` |
| Fork Choice | `zeam_forkchoice` | `grafana/dashboards/zeam_forkchoice.json` |
| State Transition | `zeam_state_transition` | `grafana/dashboards/zeam_state_transition.json` |

## Troubleshooting

### Common Issues

1. **Prometheus can't scrape Zeam node**:
   - Verify Zeam node is running with `--metricsPort` flag
   - Check firewall settings
   - Ensure Prometheus config targets match Zeam metrics port
   - If your Zeam node is not on the default port 8081, edit `prometheus/prometheus.yml` and update the target

2. **Grafana can't connect to Prometheus**:
   - Verify Prometheus is running: `docker-compose ps`
   - Check data source URL in Grafana
   - Ensure both services are on the same Docker network

3. **No metrics appearing**:
   - Verify Zeam node is generating metrics
   - Check Prometheus targets page
   - Review Prometheus logs: `docker-compose logs prometheus`

### Logs

View logs for troubleshooting:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs prometheus
docker-compose logs grafana
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with a local Zeam node
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
