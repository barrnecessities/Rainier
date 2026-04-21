# Lockly-Triggered Hue Presence (Home Assistant)

This bundle gives you:
- Arrival automation: unlock -> Hue lights on
- Departure automation: lock -> Hue lights off
- Mobile dashboard for manual control and status
- Basic health alert if Lockly state stops updating

## 1) Update entity IDs

Edit `packages/lockly_hue_presence.yaml` and replace these placeholders with your real entities:
- `lock.lockly_front_door`
- `light.entryway`
- `light.living_room`

You can find IDs in Home Assistant: **Settings -> Devices & Services -> Entities**.

## 2) Install in Home Assistant config directory

Copy this folder's contents into your Home Assistant config folder so these files exist:
- `configuration.yaml`
- `packages/lockly_hue_presence.yaml`
- `dashboards/lockly_hue_mobile.yaml`

If you already have a `configuration.yaml`, merge only these sections:
- `homeassistant: packages: !include_dir_named packages`
- `lovelace:` dashboard definition for `lockly-hue-mobile`

## 3) Validate integrations (Lockly + Hue)

Before relying on automation, verify:
1. Lockly lock entity changes between `locked` and `unlocked` in real time.
2. Hue light entities respond to manual on/off from Home Assistant.
3. All entities used in this package show as available.

## 4) Reload + restart

In Home Assistant:
1. **Developer Tools -> YAML**: reload automations/helpers if available.
2. Restart Home Assistant.
3. Open the "Lockly Hue Mobile" dashboard in the companion app.

## 5) Test checklist

- Unlock Lockly and keep it unlocked for ~45s: selected Hue lights turn on.
- Lock Lockly and keep it locked for ~45s: selected Hue lights turn off.
- Toggle `input_boolean.lockly_hue_presence_automation_enabled` off:
  lock/unlock no longer triggers lights.
- Manually toggle lights in dashboard to confirm manual override still works.
- Confirm `input_datetime.lockly_last_presence_run` updates after each automation run.

## Optional tuning

- Debounce window is set to 45 seconds (`trigger.for.seconds`).
- To avoid false triggers, add person/home conditions in each automation.
- Change health alert threshold from 6h (`21600` seconds) to your preference.
