"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secret = process.env.JWT_SECRET ?? "dev_secret_change_me";
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, secret, { expiresIn: "7d" });
}
function verifyToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, secret);
    if (typeof payload !== "object" || payload === null || typeof payload.sub !== "number") {
        throw new Error("Invalid token payload");
    }
    return payload.sub;
}
