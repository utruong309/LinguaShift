import express from "express";
import { auth } from "../middleware/auth.js";
import { runJargonDetectionProxy } from "../services/jargonDetector.js";
import { runRewrite } from "../services/rewrite.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/detect-jargon", auth, async (req, res) => {
  const { text } = req.body;
  const user = await User.findById(req.user.id);
  const org = await Organization.findById(user.organizationId).select("glossary");
  const result = await runJargonDetectionProxy({ text, glossary: org?.glossary || [] });
  res.json(result);
});

router.post("/rewrite", auth, async (req, res) => {
  const { text, audience, tone } = req.body;
  const user = await User.findById(req.user.id);
  const org = await Organization.findById(user.organizationId).select("glossary");
  const rewrittenText = await runRewrite({
    text,
    audience,
    tone,
    glossary: org?.glossary || []
  });
  res.json({ rewrittenText });
});

export default router;