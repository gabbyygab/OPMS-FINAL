// server/index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import paypalRoutes from "./paypal.js";
import nominatimRoutes from "./nominatim.js";
dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://bookingnest.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false,
  })
);
app.use(express.json());
app.use("/api/nominatim", nominatimRoutes);

// register PayPal routes
app.use("/api/paypal", paypalRoutes);

app.get("/", (req, res) => {
  res.send("✅ PayPal backend running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
