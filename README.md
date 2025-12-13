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
- A Zeam node running on the host (host.docker.internal:9667 or localhost:8080 using [lean-quickstart](https://github.com/blockblaz/lean-quickstart))
- Node exporter if available (host.docker.internal:9100)

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

### 4. Configure Grafana Data Source

1. Open Grafana at http://localhost:3001
2. Go to Configuration → Data Sources
3. Add Prometheus data source:
   - **URL**: `http://prometheus:9090`
   - **Access**: Server (default)

## Dashboard Features

### Main Dashboard

The main dashboard (`grafana/dashboards/main.json`) includes:

- **P95 Block Processing Time**: 95th percentile of block processing duration
- **Block Processing Rate**: Number of blocks processed per second
- **System Health**: Overall node health indicators

### Fork Choice Tree Dashboard

The fork choice tree dashboard (`grafana/dashboards/forkchoice-graph.json`) provides real-time visualization of the consensus fork choice:

- **Interactive Node Graph**: Visual representation of the fork choice tree showing blocks and their relationships
- **Color-Coded Arc Borders**:
  - 🟣 **Purple**: Finalized blocks (immutable)
  - 🔵 **Blue**: Justified blocks (2/3 supermajority)
  - 🟠 **Orange**: Current chain head
  - 🟢 **Green**: Timely blocks (normal blocks)
- **Arc Border Completeness**: Represents validator weight (larger border = more validator support)
- **Best Child Path**: Edges showing parent-child relationships in the fork tree
- **Chain Progress**: Time series showing head, justified, and finalized slot progression
- **Configurable**: Default shows last 50 slots (can be configured for lesser data, larger fetching would also require configuring actual zeam's api_server)

**API Endpoint**: The dashboard fetches data from `/api/forkchoice/graph` endpoint on your Zeam node

## Configuration

### Environment Variables

You can customize the setup using environment variables:

```bash
# Custom ports
export PROMETHEUS_PORT=9090
export GRAFANA_PORT=3001

# Start with custom configuration
docker-compose up -d
```

### Prometheus Configuration

The repository includes a basic `prometheus/prometheus.yml` configuration that works out of the box. You can customize it for your specific setup:

**Basic Configuration Includes:**
- Prometheus self-monitoring (localhost:9090)
- Zeam node monitoring (localhost:8080)
- Node exporter monitoring (host.docker.internal:9100)

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

### Adding New Dashboards

1. Create dashboard JSON in `grafana/dashboards/`
2. Update `grafana/provisioning/dashboards/dashboards.yml` if needed
3. Restart Grafana: `docker-compose restart grafana`

### Customizing Dashboards

Dashboards are stored in `grafana/dashboards/` and can be:
- Modified directly in JSON format
- Exported from Grafana UI
- Version controlled with Git

## Troubleshooting

### Common Issues

1. **Prometheus can't scrape Zeam node**:
   - Verify Zeam node is running with `--metricsPort` flag
   - Check firewall settings
   - Ensure Prometheus config targets match Zeam metrics port
   - If your Zeam node is not on the default port 8080, edit `prometheus/prometheus.yml` and update the target

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
