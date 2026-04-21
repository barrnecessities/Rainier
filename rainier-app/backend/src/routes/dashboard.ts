import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { store } from "../lib/store";
import { getWeekPlan, readinessFromWhoop } from "../services/trainingPlanService";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", (req: AuthedRequest, res) => {
  const user = store.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const week = getWeekPlan(user.summitDate);
  const checklist = store.checklistByUser.get(user.id) ?? [];

  const latestWhoop = store.whoopMetricsByUser.get(user.id)?.[0] ?? { recovery: 78, strain: 12, sleepPerformance: 84 };
  const readiness = readinessFromWhoop(latestWhoop.recovery, latestWhoop.strain, latestWhoop.sleepPerformance);

  res.json({
    readiness,
    weeklyPlan: {
      weekLabel: week.weekLabel,
      totalTargetHours: week.totalTargetHours,
      completedHours: week.completedHours,
      goals: week.goals,
      checklist
    },
    mountain: {
      summitFeet: 14410,
      currentProgressFeet: week.progressFeet,
      milestones: [
        { id: "m1", label: "Base built", targetFeet: 4000, completed: week.progressFeet >= 4000 },
        { id: "m2", label: "Ruck strength", targetFeet: 8000, completed: week.progressFeet >= 8000 },
        { id: "m3", label: "Peak block", targetFeet: 12000, completed: week.progressFeet >= 12000 },
        { id: "m4", label: "Summit ready", targetFeet: 14410, completed: week.progressFeet >= 14410 }
      ]
    }
  });
});
