#!/bin/sh
# Hearth deploy — run from the HA Terminal:  bash /config/deploy.sh
# Pulls the smart home branch and applies packages, dashboards and www.
# configuration.yaml is deliberately NOT touched (that stays a manual,
# whole-file paste via File editor so the Pi's copy is always deliberate).
set -e
BRANCH=claude/smart-home-app-design-GdE1C
rm -rf /tmp/Rainier
git clone --depth 1 --branch "$BRANCH" https://github.com/barrnecessities/Rainier.git /tmp/Rainier
cp -r /tmp/Rainier/home-assistant/packages /config/
cp -r /tmp/Rainier/home-assistant/dashboards /config/
cp -r /tmp/Rainier/home-assistant/www /config/
cp /tmp/Rainier/home-assistant/deploy.sh /config/deploy.sh
ha core check
ha core restart
