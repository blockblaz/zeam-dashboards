#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import dotenv from "dotenv";
import {lintGrafanaDashboard, readGrafanaDashboard, writeGrafanaDashboard} from "./lint-grafana-dashboard.mjs";

// Usage:
//
// Create a file `.secrets.env` with envs
// ```
// GRAFANA_API_KEY=$token
// GRAFANA_URL=https://yourgrafanaapi.io
// ```
//
// Run
// ```
// node scripts/download_dashboards.mjs
// ```
//
// Check git diff of resulting files, commit, push and open PR

// load environment variables from .secrets.env file
dotenv.config({path: ".secrets.env"});

const OUTDIR = "./grafana/dashboards";
const UID_PREFIX_WHITELIST = "zeam_";
const {GRAFANA_API_KEY, GRAFANA_URL} = process.env;

if (!GRAFANA_API_KEY) throw Error("GRAFANA_API_KEY not set");
if (!GRAFANA_URL) throw Error("GRAFANA_URL not set");

// Fetch all dashboard uids
const dashboardListRes = await axios.get(`${GRAFANA_URL}/api/search`, {
  headers: {Authorization: `Bearer ${GRAFANA_API_KEY}`},
});

let downloaded = 0;

// Iterate through each dashboard uid and download the dashboard data
for (const dashboardMeta of dashboardListRes.data) {
  if (!dashboardMeta.uid.startsWith(UID_PREFIX_WHITELIST)) {
    continue;
  }

  const dashboardDataRes = await axios.get(`${GRAFANA_URL}/api/dashboards/uid/${dashboardMeta.uid}`, {
    headers: {Authorization: `Bearer ${GRAFANA_API_KEY}`},
  });

  const outpath = path.join(OUTDIR, `${dashboardMeta.uid}.json`);

  // Only update dashboards that exist locally. Sometimes developers duplicate dashboards on the Grafana server
  // to test some new panels, with names like $uid_2.json. This script ignores those duplicates.
  // >> To add a new dashboard touch a file with filename `$uid.json` in grafana/dashboards/
  if (fs.existsSync(outpath)) {
    const prevDashboard = readGrafanaDashboard(outpath);

    // Lint dashboard to match target format
    const newDashboard = lintGrafanaDashboard(dashboardDataRes.data.dashboard);

    // Set version to same to reduce diff
    newDashboard.version = prevDashboard.version;

    // Save dashboard data to a JSON file
    writeGrafanaDashboard(outpath, newDashboard);
    console.log(`saved ${outpath}`);
    downloaded++;
  } else {
    console.log(`skipped ${dashboardMeta.uid} (no local file at ${outpath})`);
  }
}

console.log(`\nDone. Downloaded ${downloaded} dashboard(s).`);
