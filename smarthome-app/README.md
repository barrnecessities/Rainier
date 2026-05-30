# Hearth — Sleep-Focused Smart Home App

A minimal PWA for iPad that orchestrates Philips Hue, MySmartBlinds, 8sleep Pod 3, and weather from one dark, non-disruptive interface.

## Architecture

```
iPad (PWA, full-screen)
    │
    ▼  HTTPS (LAN or Nabu Casa tunnel)
Next.js app  (Raspberry Pi, port 3000)
    │
    ▼  REST/WS
Home Assistant  (Raspberry Pi, port 8123)
    ├── Philips Hue        ← official integration
    ├── MySmartBlinds      ← HACS: ha-mysmartblinds
    ├── Weather            ← Open-Meteo (built-in, free)
    ├── Presence           ← HA Companion app on phones
    ├── Alexa              ← Nabu Casa ($6.50/mo)
    └── 8sleep Pod 3       ← HACS: ha-eight-sleep
```

---

## Hardware

| Item | Notes |
|------|-------|
| Raspberry Pi 4 (2 GB+) | ~$55; runs HA OS + Next.js |
| MicroSD 32 GB+ (Class 10) | OS boot drive |
| Old iPad | PWA client, keep plugged in |

---

## Setup

### 1. Raspberry Pi — Home Assistant OS

1. Download the [Home Assistant OS image](https://www.home-assistant.io/installation/raspberrypi) for Raspberry Pi 4.
2. Flash to MicroSD with [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
3. Boot Pi, wait ~5 minutes, visit `http://homeassistant.local:8123`.
4. Complete the onboarding wizard (create account, pick timezone/location).

### 2. HACS (community integrations)

```
# SSH into Pi (enable SSH add-on in HA first) or use the Terminal add-on
wget -O - https://get.hacs.xyz | bash -
```

Restart HA, then add HACS integration in **Settings → Integrations → + Add Integration → HACS**.

### 3. Required Integrations

Install each via **HACS → Integrations**:

| Integration | Repo |
|-------------|------|
| MySmartBlinds | `LandonTClipp/ha-mysmartblinds` |
| 8sleep | `geoffreypetri/ha-eight-sleep` |

Then add them in **Settings → Integrations → + Add Integration**.

### 4. Nabu Casa (Alexa + Remote Access)

1. In HA: **Settings → Home Assistant Cloud → Sign up** (~$6.50/mo).
2. In the Alexa app: enable the **Home Assistant** skill.
3. This exposes Hue lights, blinds (as covers), and `input_datetime.wake_alarm` to Alexa.

Alexa routines to create:
- "Good night" → HA scene: lights off, blinds closed, 8sleep cooling
- "Set wake alarm to [time]" → HA service: `input_datetime.set_value`

### 5. HA Packages (automations)

Copy the three YAML files from `../home-assistant/packages/` into your HA config packages directory, then add to `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages/
```

Edit entity IDs in each file to match your actual devices (found in **Settings → Entities**).

### 6. HA Companion App

Install on each phone you want to use for presence detection. Sign in with your HA account. Enable **Location tracking** in the app settings. Each phone creates a `person.<name>` entity automatically.

Add any additional people to `smarthome_away.yaml`:

```yaml
group:
  household_presence:
    entities:
      - person.your_name
      - person.partner_name
```

---

## Next.js App

### Prerequisites

- Node 20+
- npm 9+

### Install

```bash
cd smarthome-app/frontend
npm install
```

### Configure

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
HA_URL=http://homeassistant.local:8123
HA_TOKEN=<long-lived access token from HA user profile>
EIGHT_EMAIL=<8sleep account email>
EIGHT_PASSWORD=<8sleep account password>
APPROVED_EMAILS=brandonbarron52@gmail.com
```

Generate a HA long-lived token: **HA Profile → Long-Lived Access Tokens → Create Token**.

### Run (development)

```bash
npm run dev
```

Open `http://<pi-ip>:3000` on the iPad.

### Run (production)

```bash
npm run build
npm start
```

To auto-start on boot, add a systemd service or use the HA **AppDaemon** add-on.

### Add to iPad Home Screen (PWA)

1. Open `http://<pi-ip>:3000` in Safari.
2. Tap **Share → Add to Home Screen**.
3. Name it "Hearth" and tap Add.

The app opens full-screen with no browser chrome.

---

## Entity ID Reference

Update these in the app if your entity names differ:

| Purpose | Default entity ID |
|---------|------------------|
| Bedroom lights | `light.bedroom` |
| Bedroom blinds | `cover.bedroom_blinds` |
| Living room blinds | `cover.living_room_blinds` |
| Weather | `weather.home` |
| Presence | `person.home_owner` |
| Wake alarm | `input_datetime.wake_alarm` |
| 8sleep left side | `climate.eight_sleep_left_side` |

---

## Security

- HA token is stored server-side in `.env.local` — never exposed to the browser.
- Next.js proxies all HA calls through `/api/ha/` routes.
- Access is limited to `APPROVED_EMAILS` (set in `.env.local`).
- All LAN traffic is plain HTTP; Nabu Casa handles TLS for remote access.
- No router port forwarding needed.
