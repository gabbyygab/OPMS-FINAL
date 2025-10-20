import express from "express";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import bodyParser from "body-parser";

const router = express.Router();
router.use(bodyParser.json());

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(
    new checkoutNodeJssdk.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  );
}

// Create order (for deposits)
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "PHP", userId } = req.body;
    if (!amount || parseFloat(amount) <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed ? amount.toFixed(2) : String(amount),
          },
        },
      ],
    });

    const response = await client().execute(request);
    // Store mapping of response.result.id -> userId & amount in DB to validate later (recommended)
    res.json({ orderID: response.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create order" });
  }
});

// Capture order (server-side capture for deposits)
router.post("/capture-order", async (req, res) => {
  try {
    const { orderID, userId } = req.body;
    if (!orderID) return res.status(400).json({ error: "Missing orderID" });

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client().execute(request);

    // Validate capture status
    const status = capture.result.status; // e.g., "COMPLETED"
    if (status === "COMPLETED") {
      // 1) Verify amount matches stored amount
      // 2) Update user wallet in your DB: add funds
      // Example: await addWalletBalance(userId, capturedAmount)
      return res.json({ success: true, capture: capture.result });
    } else {
      return res
        .status(400)
        .json({ error: "Capture not completed", capture: capture.result });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Capture failed" });
  }
});

// Withdraw funds via PayPal Payouts
router.post("/withdraw", async (req, res) => {
  try {
    const { email, amount, userId } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid PayPal email" });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // 🧮 Apply service fee before sending payout
    const serviceFeeRate = 0.05; // 5% fee
    const totalAmount = parseFloat(amount);
    const serviceFee = (totalAmount * serviceFeeRate).toFixed(2);
    const payoutAmount = (totalAmount - serviceFee).toFixed(2);

    console.log(`Service fee: ${serviceFee}, sending: ${payoutAmount}`);

    // (same PayPal auth logic as before...)
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
    ).toString("base64");

    const authRes = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    const { access_token } = await authRes.json();

    // 🧾 Send the payout (with reduced amount)
    const payoutRes = await fetch(
      "https://api-m.sandbox.paypal.com/v1/payments/payouts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `withdraw-${userId}-${Date.now()}`,
            email_subject: "BookingNest Withdrawal",
            email_message: `You have received ₱${payoutAmount}. A service fee of ₱${serviceFee} was deducted.`,
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: payoutAmount,
                currency: "PHP",
              },
              receiver: email,
              note: `Withdrawal after ₱${serviceFee} service fee.`,
              sender_item_id: `item-${userId}-${Date.now()}`,
            },
          ],
        }),
      }
    );

    const result = await payoutRes.json();

    if (result.batch_header) {
      return res.json({
        success: true,
        batch: result.batch_header,
        serviceFee,
        payoutAmount,
      });
    } else {
      console.error("PayPal payout error:", result);
      return res.status(400).json(result);
    }
  } catch (err) {
    console.error("Withdrawal error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Optional: Check payout status
router.get("/payout-status/:payoutBatchId", async (req, res) => {
  try {
    const { payoutBatchId } = req.params;

    // Get Access Token
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
    ).toString("base64");

    const authRes = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    const { access_token } = await authRes.json();

    // Get payout details
    const payoutRes = await fetch(
      `https://api-m.sandbox.paypal.com/v1/payments/payouts/${payoutBatchId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await payoutRes.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get payout status" });
  }
});

export default router;
