import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

//Create org
router.post("/", auth, async (req, res) => {
  const { name } = req.body;
  const org = await Organization.create({ name, ownerId: req.user.id, members: [req.user.id] });
  await User.findByIdAndUpdate(req.user.id, { organizationId: org._id });
  res.json(org);
});

//Get my org with members + glossary
router.get("/me", auth, async (req, res) => {
  const org = await Organization.findOne({ members: req.user.id })
    .populate("members", "name email role department");
  res.json(org);
});

//Glossary CRUD 
router.post("/:orgId/glossary", auth, async (req, res) => {
  const { term, explanation, plainLanguage } = req.body;
  const org = await Organization.findOneAndUpdate(
    { _id: req.params.orgId, members: req.user.id },
    { $push: { glossary: { term, explanation, plainLanguage } } },
    { new: true }
  );
  res.json(org.glossary);
});

router.put("/:orgId/glossary/:term", auth, async (req, res) => {
  const { explanation, plainLanguage } = req.body;
  const org = await Organization.findOneAndUpdate(
    { _id: req.params.orgId, "glossary.term": req.params.term, members: req.user.id },
    {
      $set: {
        "glossary.$.explanation": explanation,
        "glossary.$.plainLanguage": plainLanguage
      }
    },
    { new: true }
  );
  res.json(org.glossary);
});

router.delete("/:orgId/glossary/:term", auth, async (req, res) => {
  const org = await Organization.findOneAndUpdate(
    { _id: req.params.orgId, members: req.user.id },
    { $pull: { glossary: { term: req.params.term } } },
    { new: true }
  );
  res.json(org.glossary);
});

export default router;