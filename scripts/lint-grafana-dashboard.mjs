#!/usr/bin/env node

import fs from "node:fs";

// Logic for linting Zeam Grafana dashboards
//
// >> FOR SCRIPT USE `scripts/lint-grafana-dashboards.mjs`

// Known datasource UIDs matching grafana/provisioning/datasources/datasources.yml
const DATASOURCE_PROMETHEUS_UID = "prometheus";
const DATASOURCE_INFINITY_UID = "infinity";

const ZEAM_TAG = "zeam";
const LINK_TITLE = "Zeam dashboards";

/**
 * @param {object} json - Dashboard JSON object from Grafana API or file
 * @returns {object} - Linted dashboard JSON
 */
export function lintGrafanaDashboard(json) {
  // Drop properties added by "Export for sharing externally" to keep diff consistent
  delete json.__elements;
  delete json.__requires;
  delete json.__inputs;

  // Set to "Shared crosshair" option
  json.graphTooltip = 1;

  // null id to match "Export for sharing externally" format
  if (json.id !== undefined) {
    json.id = null;
  }

  // Remove instance-specific properties that cause noisy diffs
  delete json.fiscalYearStartMonth;

  if (json.panels) {
    assertPanels(json.panels);
  }

  // Force add zeam tag for easy navigation
  if (!json.tags) json.tags = [];
  if (!json.tags.includes(ZEAM_TAG)) json.tags.push(ZEAM_TAG);

  // Add links section for cross-dashboard navigation
  if (!json.links) json.links = [];
  if (!json.links.some((link) => link.title === LINK_TITLE)) {
    json.links.push({
      asDropdown: true,
      icon: "external link",
      includeVars: true,
      keepTime: true,
      tags: [ZEAM_TAG],
      targetBlank: false,
      title: LINK_TITLE,
      tooltip: "",
      type: "dashboards",
      url: "",
    });
  }

  // Force timezone and time settings for consistency
  json.timezone = "utc";
  json.weekStart = "monday";
  if (!json.timepicker) json.timepicker = {};
  json.timepicker.refresh_intervals = ["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"];

  // Ensure templating structure exists
  if (!json.templating) json.templating = {};
  if (!json.templating.list) json.templating.list = [];

  return json;
}

/**
 * @param {object[]} panels
 */
function assertPanels(panels) {
  for (const panel of panels) {
    if (panel.collapsed === true) {
      throw Error(`all panels must be expanded, go to the UI and expand panel with title "${panel.title}"`);
    }

    // Normalize Prometheus datasource UIDs to provisioned value
    if (panel.datasource) {
      normalizeDatasource(panel.datasource);
    }

    if (panel.targets) {
      for (const target of panel.targets) {
        if (target.datasource) {
          normalizeDatasource(target.datasource);
        }

        // Disable exemplar to reduce diff noise
        if (target.exemplar !== undefined) {
          target.exemplar = false;
        }
      }
    }

    // Drop threshold defaults at fieldConfig.defaults.thresholds
    // They are a source of constant diffs since consecutive exports assign null values
    // while others don't. Only drop if thresholds have no meaningful steps.
    if (panel.fieldConfig?.defaults?.thresholds) {
      const steps = panel.fieldConfig.defaults.thresholds.steps;
      if (steps && steps.length === 1 && steps[0].value === null) {
        delete panel.fieldConfig.defaults.thresholds;
      }
    }

    // Recursively check nested panels
    if (panel.panels) {
      assertPanels(panel.panels);
    }
  }
}

/**
 * Normalize datasource UIDs to match provisioned datasource names.
 * This ensures dashboards work with the docker-compose provisioning setup.
 * @param {object} datasource
 */
function normalizeDatasource(datasource) {
  if (!datasource || !datasource.type) return;

  if (datasource.type === "prometheus") {
    datasource.uid = DATASOURCE_PROMETHEUS_UID;
  } else if (datasource.type === "yesoreyeram-infinity-datasource") {
    datasource.uid = DATASOURCE_INFINITY_UID;
  }
  // Leave other types (e.g., "grafana") untouched
}

/**
 * @param {string} filepath
 * @returns {object}
 */
export function readGrafanaDashboard(filepath) {
  const jsonStr = fs.readFileSync(filepath, "utf8");
  return JSON.parse(jsonStr);
}

/**
 * @param {string} filepath
 * @param {object} json
 */
export function writeGrafanaDashboard(filepath, json) {
  const jsonStrOut = JSON.stringify(json, null, 2) + "\n";
  fs.writeFileSync(filepath, jsonStrOut);
}
