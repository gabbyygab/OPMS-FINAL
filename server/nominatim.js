// server/nominatim.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();
    res.json(data); // ✅ your backend adds CORS automatically
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

export default router;
