import bcrypt from "bcryptjs";

export type ChecklistItem = { id: number; label: string; done: boolean };
export type WhoopMetric = { recovery: number; strain: number; sleepPerformance: number; capturedAt: string };

export type User = {
  id: number;
  email: string;
  passwordHash: string;
  summitDate: string;
  whoop?: { accessToken: string; refreshToken: string; expiresAt: number };
};

export const store = {
  users: [
    {
      id: 1,
      email: "athlete@example.com",
      passwordHash: bcrypt.hashSync("rainier123", 10),
      summitDate: "2026-07-05"
    }
  ] as User[],
  checklistByUser: new Map<number, ChecklistItem[]>([[1, [
    { id: 1, label: "Complete aerobic endurance session", done: false },
    { id: 2, label: "Ruck with progression weight", done: false },
    { id: 3, label: "Mobility and recovery block", done: true },
    { id: 4, label: "Hydration target met", done: false },
    { id: 5, label: "Sleep 7.5h+", done: true }
  ]]]),
  whoopMetricsByUser: new Map<number, WhoopMetric[]>([[1, [{ recovery: 78, strain: 12, sleepPerformance: 84, capturedAt: new Date().toISOString() }]]])
};
