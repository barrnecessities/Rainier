# Hearth — Smart Home

Home Assistant configuration for the house in Kirkland, WA. Runs on a
Raspberry Pi 5 (Home Assistant OS) at `http://10.0.0.78:8123`.

**Branch `claude/smart-home-app-design-GdE1C` is the smart home branch** —
this is the one to clone, edit, and deploy from. Other branches in this
repo hold unrelated projects.

## What the house does

- **Wake alarm** — 40-min bed pre-warm (optional), 30-min light sunrise,
  then blinds + whole-house lights + Spotify at wake time. Weekdays-only
  toggle. Time set from the dashboard.
- **Weeknight sleep** — Sun–Thu wind-down: house dark, bedroom candlelight
  fade, blinds closed. Skips itself when nobody is home.
- **Blinds** — sun/weather schedule for three downstairs PowerView Duettes
  and the bedroom Motionblinds: open after sunrise, glare protection on
  sunny middays, wider when overcast, closed after sunset.
- **Voice (Alexa)** — exactly two master commands via a device named
  "Everything": *"turn everything on"* (progressive morning light ramp) and
  *"turn everything off"* (lights out + blinds down). Plus "Travel Mode"
  for trips. Rooms are voiced natively through Hue.
- **Travel Mode** — one switch: all schedules off, lights off, blinds
  closed, AC + 8sleep pod off, and a guard that keeps the pod off nightly
  for the whole trip.
- **Master kill switch** — `Master Automations` gates every automation;
  off = fully manual house. `8sleep Auto` separately gates every automated
  touch of the bed (default off: the pod runs its own Autopilot).

## Repo layout

```
home-assistant/
  configuration.yaml      ← mirror of /config/configuration.yaml on the Pi
  packages/               ← all automations/scripts/helpers (one file per domain)
  dashboards/             ← "Hearth" dashboard (smarthome_mobile.yaml) + Lockly panel
docs/
  blinds-ble-integration.md  ← historical log of the blinds BLE saga (resolved)
```

## Deploying changes to the Pi

Packages and dashboards, from the HA **Terminal** add-on:

```sh
rm -rf /tmp/Rainier && \
git clone --depth 1 --branch claude/smart-home-app-design-GdE1C \
  https://github.com/barrnecessities/Rainier.git /tmp/Rainier && \
cp -r /tmp/Rainier/home-assistant/packages /config/ && \
cp -r /tmp/Rainier/home-assistant/dashboards /config/ && \
ha core check && ha core restart
```

`configuration.yaml` is NOT copied by that command (it holds the Pi's own
`default_config`). To change it: edit `home-assistant/configuration.yaml`
here, then paste the whole file into the Pi via the **File editor** add-on
(`/config/configuration.yaml`), then `ha core check && ha core restart`.
After any `emulated_hue` change, also say "Alexa, discover devices".

## Key integrations

Philips Hue (46 lights, rooms/zones incl. `light.entire_pad`),
Hunter Douglas PowerView Gen 3 (gateway "Bop", `cover.bedroom_shade_1/2/3`),
Motionblinds (bedroom, `cover.topdownbottomup_0001_combined`),
Eight Sleep via HACS (`climate.brandon_s_eight_sleep_side_climate`),
Sonos + Spotify, Met.no weather (`weather.forecast_home`),
Mobile App presence (`person.brandon_barron`), emulated_hue (Alexa bridge).

Known gaps: Midea room AC blocked by Midea closing its cloud token APIs
(`climate.bedroom_ac` is a placeholder; fallback plan is a Broadlink IR
blaster). Lockly lock not integrated (needs the Matter hub).

## House guide

Day-to-day rules, voice commands, and troubleshooting live in the
House Guide (linked from the dashboard's Home tab):
https://claude.ai/code/artifact/73775775-a7ff-44bd-a78f-4272f7fe1ab7
