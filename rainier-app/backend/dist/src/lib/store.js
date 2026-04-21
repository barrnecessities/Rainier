"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.store = {
    users: [
        {
            id: 1,
            email: "athlete@example.com",
            passwordHash: bcryptjs_1.default.hashSync("rainier123", 10),
            summitDate: "2026-07-05"
        }
    ],
    checklistByUser: new Map([[1, [
                { id: 1, label: "Complete aerobic endurance session", done: false },
                { id: 2, label: "Ruck with progression weight", done: false },
                { id: 3, label: "Mobility and recovery block", done: true },
                { id: 4, label: "Hydration target met", done: false },
                { id: 5, label: "Sleep 7.5h+", done: true }
            ]]]),
    whoopMetricsByUser: new Map([[1, [{ recovery: 78, strain: 12, sleepPerformance: 84, capturedAt: new Date().toISOString() }]]])
};
