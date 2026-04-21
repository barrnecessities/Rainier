import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { store } from "../lib/store";

export const checklistRouter = Router();
checklistRouter.use(requireAuth);

checklistRouter.post("/:id/toggle", (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  const list = store.checklistByUser.get(userId) ?? [];
  const item = list.find((it) => it.id === id);
  if (!item) return res.status(404).json({ error: "Checklist item not found" });
  item.done = !item.done;
  return res.json({ ok: true });
});
