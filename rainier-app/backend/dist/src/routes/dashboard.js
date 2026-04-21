"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const store_1 = require("../lib/store");
const trainingPlanService_1 = require("../services/trainingPlanService");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.use(requireAuth_1.requireAuth);
exports.dashboardRouter.get("/", (req, res) => {
    const user = store_1.store.users.find((u) => u.id === req.userId);
    if (!user)
        return res.status(404).json({ error: "User not found" });
    const week = (0, trainingPlanService_1.getWeekPlan)(user.summitDate);
    const checklist = store_1.store.checklistByUser.get(user.id) ?? [];
    const latestWhoop = store_1.store.whoopMetricsByUser.get(user.id)?.[0] ?? { recovery: 78, strain: 12, sleepPerformance: 84 };
    const readiness = (0, trainingPlanService_1.readinessFromWhoop)(latestWhoop.recovery, latestWhoop.strain, latestWhoop.sleepPerformance);
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
