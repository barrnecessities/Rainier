"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checklistRouter = void 0;
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const store_1 = require("../lib/store");
exports.checklistRouter = (0, express_1.Router)();
exports.checklistRouter.use(requireAuth_1.requireAuth);
exports.checklistRouter.post("/:id/toggle", (req, res) => {
    const userId = req.userId;
    const id = Number(req.params.id);
    const list = store_1.store.checklistByUser.get(userId) ?? [];
    const item = list.find((it) => it.id === id);
    if (!item)
        return res.status(404).json({ error: "Checklist item not found" });
    item.done = !item.done;
    return res.json({ ok: true });
});
