import crypto from "node:crypto";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyGoogleCredential } from "./auth.js";
import { searchRoutes, getVehicles, getTracking, getAlerts } from "./providers/demoProvider.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "trackride-api" }));

app.post("/api/auth/google", async (req, res) => {
  try {
    const user = await verifyGoogleCredential(req.body?.credential);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: error.message || "Google sign-in failed." });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const type = ["bus", "train", "both"].includes(req.query.type) ? req.query.type : "both";
    const results = await searchRoutes({
      from: req.query.from,
      to: req.query.to,
      type,
      date: req.query.date
    });
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/vehicles", async (req, res) => {
  try {
    const type = ["bus", "train", "both"].includes(req.query.type) ? req.query.type : "both";
    res.json({ vehicles: await getVehicles(type) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/tracking/:id", async (req, res) => {
  try {
    const vehicle = await getTracking(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    res.json({ vehicle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/alerts", async (_req, res) => {
  try {
    res.json({ alerts: await getAlerts() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Temporary in-memory saved journey API.
// Replace with a database table/collection once Google sessions are persisted.
const savedByUser = new Map();

app.get("/api/users/saved", (req, res) => {
  const email = req.headers["x-demo-user-email"];
  res.json({ journeys: savedByUser.get(email) || [] });
});

app.post("/api/users/saved", (req, res) => {
  const email = req.headers["x-demo-user-email"];
  if (!email) return res.status(401).json({ message: "x-demo-user-email required for demo." });
  const list = savedByUser.get(email) || [];
  const journey = { ...req.body, id: req.body.id || crypto.randomUUID() };
  savedByUser.set(email, [journey, ...list.filter(x => x.id !== journey.id)]);
  res.status(201).json({ journey });
});

app.delete("/api/users/saved/:id", (req, res) => {
  const email = req.headers["x-demo-user-email"];
  const list = savedByUser.get(email) || [];
  savedByUser.set(email, list.filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(port, () => console.log(`TrackRide API running on http://localhost:${port}`));
