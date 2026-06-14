# Downstairs Blinds → Home Assistant (Hunter Douglas PowerView Gen 3 BLE)

Living log of getting the **new downstairs 3 Day Blinds** into Home Assistant so they
join the wake alarm. Updated as we go so we never re-tread dead ends.

## The setup (facts)

- **Bedroom blinds (old):** Motionblinds, "3 Day Blinds 1.0" app → already in HA as
  `cover.topdownbottomup_0001_combined`. Already wired into the wake alarm.
- **Downstairs blinds (new):** Hunter Douglas **PowerView Gen 3**, encrypted **BLE**,
  controlled by the newer **"3 Day Blinds" app v1.3.1 (Build 2735)**. Home ID
  `s9wjegWptJWFp7bOAa06`. **No bridge/gateway** installed (Integrations menu greyed out).
- Real shades seen in nRF Connect as `hny#2488`, `hny#C88A`, `hny#331A`
  (all "Hunter Douglas Inc <0819>").
- HA host: Raspberry Pi 5, HA OS 17.3, IP `10.0.0.78`. Pi 5 has built-in Bluetooth.

## Goal

Control the downstairs BLE shades from HA (no gateway) using the
**`patman15/hdpv_ble`** custom integration. It needs the home's **encryption key**.

## Approach: ESP32 shade emulator to capture the key

Flash a HiLetgo ESP-WROOM-32 with the repo's `emu/PV_BLE_cover` sketch. It pretends to
be a new shade (`myPVcover`). When the 3 Day Blinds app adds it, the app hands over the
home key, which prints over serial. Then put that key in the hdpv_ble integration.

## Dead ends (do NOT retry these)

- ❌ **Motionblinds BLE integration** — incompatible with Gen 3 encrypted protocol.
- ❌ **Official Hunter Douglas PowerView app** — separate account system; would create a
  different home with a different key that won't match these shades.
- ❌ **Native HA "3 Day Blinds" integration** — it's just Motionblinds (old hub system),
  does not cover the new BLE shades.
- ❌ **Buying a PowerView Gen 3 Gateway ($195)** — avoided; going gateway-less via BLE.
- ❌ **"Add bridge / Add remote"** in app Accessories — not the shade-add path.
- ❌ **TYP_ID = 42** (emulator default) — app filtered it out, didn't appear in scan.
- ❌ **TYP_ID = 62** (code's commented alt) — also filtered out.
- ❌ **TYP_ID = 6** (real shade's actual type byte, read via nRF) — still not shown.
- ❌ **Phone region change (US → UK)** — no effect.
- ❌ **Bluetooth permission / proximity / reset** — all confirmed fine; emulator
  advertises correctly ("Device myPVcover ready.").
- ❌ **Apple HomeKit (gateway-less)** — confirmed: PowerView Gen 3 **requires the
  $195 Gen 3 Gateway** for HomeKit / Alexa / any smart-home control. Without a
  gateway, ONLY the app can control shades (direct BLE). So HomeKit is not a free path.

## Why the emulator is likely blocked

After 3 type IDs + region + BT checks, `myPVcover` never appears in the 3 Day Blinds
app's "Manage shades" scan, even though it advertises correctly. The app DOES have an
add-shade scan (it asks "is shade in ship mode?"), but it finds nothing. Most probable
cause: the **dealer-branded 3 Day Blinds app v1.3.1 has stricter/locked shade
provisioning** than the generic PowerView app the emulator author tested against.
The real shade's advertisement also carries extra bytes (`54 FC` at pos 2-3, `E0` at
end) the emulator doesn't reproduce — but those likely reflect a *provisioned* shade,
not a *ship-mode* one, so matching them is not obviously correct.

## Decision point (2026-06-14)

Free DIY emulator path is stuck. Realistic options:
1. **Buy PowerView Gen 3 Gateway (~$195)** → official `hunterdouglas_powerview` HA
   integration. Guaranteed, easiest, also unlocks HomeKit + Alexa. Costs money.
2. **Extract key via Android** → install 3 Day Blinds app on an Android phone, log into
   the home, pull `home_key` from app data (backup/logcat). Free-ish, technical,
   requires an Android device. Then use hdpv_ble (gateway-less).
3. **One more emulator attempt** → reproduce the full manufacturer data
   (`54 FC … E0`) in the sketch. Free, but uncertain; may still be blocked by the
   locked app.

## Progress log

- **2026-06-13/14:** Arduino IDE set up, ESP32 board support + wolfSSL library installed.
- Fixed two compile errors:
  - missing `wolfssl.h` → installed **wolfSSL** library.
  - `LED_BUILTIN` undefined on HiLetgo → added `#define LED_BUILTIN 2` near top.
- Flashed successfully (upload speed **115200**, hold **BOOT** if it stalls).
  Serial confirms **"Device myPVcover ready."** → emulator works.
- App can't find `myPVcover` in **Manage shades** scan ("is shade in ship mode?").
  Tried TYP_ID 42 and 62, region change, BT permission/proximity — no luck.
- **KEY FINDING (nRF Connect):** real shade `hny#2488` Manufacturer Data =
  `19 08 | 54 FC 06 00 00 00 00 00 E0`. Emulator format is
  `19 08 00 00 [TYP_ID] 00 00 00 00 00 A2`. Aligning byte position 4 → the real
  **type ID = `6`**. (Also note real bytes `54 FC` at pos 2-3 and trailing `E0`
  vs emulator `00 00 ... A2` — watch these if type 6 still fails.)

## Next step

Set `TYP_ID = 6` (line 22 of `PV_BLE_cover.ino`), re-flash, re-scan in app.

## Emulator packet reference

```
emulator: { 0x19, 0x08, 0x00, 0x00, TYP_ID, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA2 }
real hny#2488: 0x19, 0x08, 0x54, 0xFC, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE0
```

## Once the key is captured

1. Install `patman15/hdpv_ble` via HACS custom repo → restart HA.
2. Add "Hunter Douglas PowerView (BLE)" integration, paste the key.
3. Shades appear as `cover.*` entities.
4. Wire into `home-assistant/packages/smarthome_alarm.yaml`:
   - T-0: open downstairs to 50%; T+10: open 100%.
   - New 9pm automation: close downstairs for bed.

## Backup plan if emulator never gets discovered

The repo lists 3 ways to get the key: (1) emulator [current], (2) extract from a working
gateway, (3) **grab from the app** (HA community forum method — pulls the key from app
data/traffic, bypasses shade discovery entirely). If type 6 + matching bytes 54/FC/E0
still fail, pivot to method 3.
