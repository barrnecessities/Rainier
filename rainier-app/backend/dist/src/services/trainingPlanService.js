"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeekPlan = getWeekPlan;
exports.readinessFromWhoop = readinessFromWhoop;
function getWeekPlan(summitDateIso, today = new Date()) {
    const summitDate = new Date(`${summitDateIso}T00:00:00`);
    const daysRemaining = Math.max(0, Math.ceil((summitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    const weekIndex = Math.max(1, 13 - weeksRemaining);
    const totalTargetHours = Math.min(10, 8 + Math.floor(weekIndex / 4));
    const completedHours = Math.min(totalTargetHours, 4 + Math.floor(weekIndex / 3));
    const ruckWeight = 20 + weekIndex * 2;
    const longDayHours = Math.min(7, 3 + Math.floor(weekIndex / 2));
    const weeklyElevation = 1800 + weekIndex * 250;
    return {
        weekLabel: `Week ${weekIndex} to Rainier`,
        totalTargetHours,
        completedHours,
        goals: [
            `${longDayHours}h long trail day`,
            `Ruck progress to ${ruckWeight} lb`,
            `${weeklyElevation} ft total elevation gain`
        ],
        progressFeet: Math.min(14410, weekIndex * 950)
    };
}
function readinessFromWhoop(recovery, strain, sleepPerformance) {
    const score = Math.max(1, Math.min(100, Math.round(recovery * 0.45 + (100 - Math.min(100, strain * 3.5)) * 0.25 + sleepPerformance * 0.3)));
    const status = score >= 75 ? "green" : score >= 55 ? "yellow" : "red";
    return { score, status };
}
