import fs from "fs";
import path from "path";
import { DigestItem, HistoryEntry } from "./types";

export function writeHistory(items: DigestItem[], date: Date): void {
  const dateStr = date.toISOString().split("T")[0];
  const historyDir = path.join(__dirname, "..", "history");

  const entries: HistoryEntry[] = items.map((item) => ({
    source: item.source,
    title: item.title,
    url: item.url,
    score: item.score ?? 5,
    scoreReason: item.scoreReason ?? "",
    userRating: null,
  }));

  const filePath = path.join(historyDir, `${dateStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
  console.log(`History written to history/${dateStr}.json`);
}
