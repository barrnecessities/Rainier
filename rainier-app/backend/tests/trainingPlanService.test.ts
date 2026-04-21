import { describe, expect, it } from "vitest";
import { getWeekPlan, readinessFromWhoop } from "../src/services/trainingPlanService";

describe("trainingPlanService", () => {
  it("builds progressive weekly goals", () => {
    const week = getWeekPlan("2026-07-05", new Date("2026-05-01T00:00:00"));
    expect(week.totalTargetHours).toBeGreaterThanOrEqual(8);
    expect(week.goals.length).toBe(3);
    expect(week.progressFeet).toBeGreaterThan(0);
  });

  it("maps readiness statuses", () => {
    expect(readinessFromWhoop(85, 10, 88).status).toBe("green");
    expect(readinessFromWhoop(58, 14, 60).status).toBe("yellow");
    expect(readinessFromWhoop(30, 18, 42).status).toBe("red");
  });
});
