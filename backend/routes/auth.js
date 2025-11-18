import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, organizationName, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (!organizationName) {
      return res.status(400).json({ error: "Organization name is required" });
    }

    // Handle circular dependency: Organization requires ownerId, User requires organizationId
    // Solution: Create organization with a temporary ObjectId, then update it after user creation
    const tempUserId = new mongoose.Types.ObjectId();
    
    // Create organization with temporary userId (will be updated after user creation)
    const org = await Organization.create({
      name: organizationName,
      ownerId: tempUserId,
      members: []
    });
    
    // Create user with the organizationId
    const user = await User.create({
      name,
      email,
      passwordHash,
      organizationId: org._id,
      department: department || undefined
    });
    
    // Update organization with actual user ID and add to members
    await Organization.findByIdAndUpdate(org._id, {
      ownerId: user._id,
      $push: { members: user._id }
    });
    
    // Generate token for immediate login
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/users/search - Search users by name or email
router.get("/users/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = q.trim();
    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } }
      ]
    })
    .select("name email department title")
    .limit(20);

    res.json(users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      department: u.department,
      title: u.title
    })));
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/users - Get all users (for organization members)
router.get("/users", auth, async (req, res) => {
  try {
    // Get current user's organization
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all users in the same organization
    const users = await User.find({ organizationId: currentUser.organizationId })
      .select("name email department title")
      .limit(100);

    res.json(users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      department: u.department,
      title: u.title
    })));
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;