import express from "express";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/channels for all channels user is in
router.get("/", auth, async (req, res) => {
  try {
    const channels = await Channel.find({ members: req.user.id });
    res.json(channels);
  } catch (err) {
    console.error("Get channels error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/channels/direct
router.post("/direct", auth, async (req, res) => {
  try {
    const { userId } = req.body; // other participant
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Don't allow messaging yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot create direct message with yourself" });
    }

    // Check if direct message already exists
    const existing = await Channel.findOne({ 
      type: "direct", 
      directPair: { $all: [req.user.id, userId] } 
    });
    
    if (existing) {
      return res.json(existing);
    }

    // Create new direct message channel
    const channel = await Channel.create({
      name: "Direct",
      type: "direct",
      members: [req.user.id, userId],
      directPair: [req.user.id, userId]
    });
    
    res.json(channel);
  } catch (err) {
    console.error("Create direct message error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/channels/:channelId/messages/:messageId
router.patch("/:channelId/messages/:messageId", auth, async (req, res) => {
  const { textOriginal, textSimplified, usedSimplified, jargonScore, jargonSpans } = req.body;
  const msg = await Message.findOneAndUpdate(
    { _id: req.params.messageId, senderId: req.user.id, channelId: req.params.channelId },
    {
      textOriginal,
      textSimplified,
      usedSimplified,
      jargonScore,
      jargonSpans,
      editedAt: new Date()
    },
    { new: true }
  ).populate("senderId", "name email");
  res.json(msg);
});

// DELETE (soft) /api/channels/:channelId/messages/:messageId
router.delete("/:channelId/messages/:messageId", auth, async (req, res) => {
  const msg = await Message.findOneAndUpdate(
    { _id: req.params.messageId, senderId: req.user.id, channelId: req.params.channelId },
    { deletedAt: new Date() },
    { new: true }
  );
  res.json(msg);
});

// POST with thread + attachments support
router.post("/:channelId/messages", auth, async (req, res) => {
  const { channelId } = req.params;
  const {
    textOriginal,
    textSimplified,
    usedSimplified,
    jargonScore,
    jargonSpans,
    threadRootId,
    attachments,
    audience,
    tone,
    glossaryTermsUsed
  } = req.body;

  const msg = await Message.create({
    channelId,
    senderId: req.user.id,
    textOriginal,
    textSimplified,
    usedSimplified: !!usedSimplified,
    jargonScore: jargonScore ?? 0,
    jargonSpans: jargonSpans ?? [],
    threadRootId,
    attachments: attachments ?? [],
    audience,
    tone,
    glossaryTermsUsed
  });

  const populated = await msg.populate("senderId", "name email");
  res.json(populated);
});

// POST /api/channels - create channel
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;

    const channel = await Channel.create({
      name,
      type: "group",
      members: [req.user.id]
    });

    res.json(channel);
  } catch (err) {
    console.error("Create channel error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/channels/:channelId - get channel details
router.get("/:channelId", auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findOne({ 
      _id: channelId, 
      members: req.user.id 
    })
    .populate("members", "name email department")
    .populate("directPair", "name email");
    
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }
    
    res.json(channel);
  } catch (err) {
    console.error("Get channel error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/channels/:channelId/messages - list messages in a channel
router.get("/:channelId/messages", auth, async (req, res) => {
  try {
    const { channelId } = req.params;

    const messages = await Message.find({ channelId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email");

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/channels/:channelId/messages - send a message
router.post("/:channelId/messages", auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const {
      textOriginal,
      textSimplified,
      usedSimplified,
      jargonScore,
      jargonSpans
    } = req.body;

    if (!textOriginal) {
      return res.status(400).json({ error: "textOriginal is required" });
    }

    const msg = await Message.create({
      channelId,
      senderId: req.user.id,
      textOriginal,
      textSimplified,
      usedSimplified: !!usedSimplified,
      jargonScore: jargonScore ?? 0,
      jargonSpans: jargonSpans ?? []
    });

    const populated = await msg.populate("senderId", "name email");
    res.json(populated);
  } catch (err) {
    console.error("Create message error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;