"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const trainingPlanService_1 = require("../src/services/trainingPlanService");
(0, vitest_1.describe)("trainingPlanService", () => {
    (0, vitest_1.it)("builds progressive weekly goals", () => {
        const week = (0, trainingPlanService_1.getWeekPlan)("2026-07-05", new Date("2026-05-01T00:00:00"));
        (0, vitest_1.expect)(week.totalTargetHours).toBeGreaterThanOrEqual(8);
        (0, vitest_1.expect)(week.goals.length).toBe(3);
        (0, vitest_1.expect)(week.progressFeet).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("maps readiness statuses", () => {
        (0, vitest_1.expect)((0, trainingPlanService_1.readinessFromWhoop)(85, 10, 88).status).toBe("green");
        (0, vitest_1.expect)((0, trainingPlanService_1.readinessFromWhoop)(58, 14, 60).status).toBe("yellow");
        (0, vitest_1.expect)((0, trainingPlanService_1.readinessFromWhoop)(30, 18, 42).status).toBe("red");
    });
});
