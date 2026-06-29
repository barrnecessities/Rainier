#!/usr/bin/env python3
"""OPTIONAL: fetch your X / Twitter bookmarks into bookmarks/seed.md.

This is off by default and NOT required — the brief works from the seed file you
maintain by hand. Use this only if you want full automation.

The X API v2 bookmarks endpoint (GET /2/users/:id/bookmarks) requires an OAuth 2.0
**user-context** access token (Authorization Code with PKCE) carrying the
`bookmark.read` (and `tweet.read`, `users.read`) scopes. An app-only / bearer token
will NOT work — bookmarks are per-user data.

Obtaining that token is a one-time OAuth dance outside this script (see the X
developer docs). Once you have a user access token, set:

  X_BEARER_TOKEN   the OAuth2 user-context access token
  X_USER_ID        your numeric X user id

then run:  python fetch_bookmarks.py
"""

from __future__ import annotations

import os
import pathlib
import sys

import httpx  # add to requirements.txt if you enable this script

SEED_PATH = pathlib.Path(__file__).resolve().parent / "bookmarks" / "seed.md"


def fetch_bookmarks(user_id: str, token: str) -> list[dict]:
    url = f"https://api.twitter.com/2/users/{user_id}/bookmarks"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"max_results": 100, "tweet.fields": "author_id,created_at,text"}
    out: list[dict] = []
    with httpx.Client(timeout=30) as client:
        while True:
            resp = client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            payload = resp.json()
            out.extend(payload.get("data", []))
            token_next = payload.get("meta", {}).get("next_token")
            if not token_next:
                break
            params["pagination_token"] = token_next
    return out


def main() -> int:
    token = os.environ.get("X_BEARER_TOKEN")
    user_id = os.environ.get("X_USER_ID")
    if not token or not user_id:
        print(
            "Set X_BEARER_TOKEN (OAuth2 user-context token) and X_USER_ID. "
            "See module docstring.",
            file=sys.stderr,
        )
        return 1

    tweets = fetch_bookmarks(user_id, token)
    lines = ["# Bookmark seed (auto-fetched)\n", "## Links"]
    for t in tweets:
        link = f"https://x.com/i/web/status/{t['id']}"
        note = t.get("text", "").replace("\n", " ")[:120]
        lines.append(f"- {link} — {note}")
    SEED_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(tweets)} bookmarks to {SEED_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
