export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type LoginResponse = { token: string; user: { id: number; email: string } };

export type DashboardData = {
  readiness: { score: number; status: "green" | "yellow" | "red" };
  weeklyPlan: {
    weekLabel: string;
    totalTargetHours: number;
    completedHours: number;
    goals: string[];
    checklist: { id: number; label: string; done: boolean }[];
  };
  mountain: {
    summitFeet: number;
    currentProgressFeet: number;
    milestones: { id: string; label: string; targetFeet: number; completed: boolean }[];
  };
};

export function getToken() {
  return localStorage.getItem("rainier_token");
}

export function setToken(token: string) {
  localStorage.setItem("rainier_token", token);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  dashboard: () => request<DashboardData>("/dashboard"),
  toggleChecklist: (itemId: number) =>
    request<{ ok: boolean }>(`/checklist/${itemId}/toggle`, { method: "POST" })
};
