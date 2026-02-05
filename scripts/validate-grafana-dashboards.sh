#!/bin/bash

# Validates that dashboards are properly linted.
# This script will mutate the dashboards if anything needs linting,
# then check git diff — if anything changed, dashboards need fixing.
#
# Usage: scripts/validate-grafana-dashboards.sh

node scripts/lint-grafana-dashboards.mjs ./grafana/dashboards

if [[ $? -ne 0 ]]; then
  echo 'linting dashboards failed'
  exit 1
fi

if [[ $(git diff --stat ./grafana/dashboards) != '' ]]; then
  git --no-pager diff ./grafana/dashboards
  echo ''
  echo 'dashboards need fixing — run: npm run lint-dashboards'
  exit 1
else
  echo 'dashboards clean'
fi
