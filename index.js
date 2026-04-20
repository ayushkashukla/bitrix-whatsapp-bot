require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body));

    const dealId = req.body.data.FIELDS.ID;
    const stageId = req.body.data.FIELDS.STAGE_ID;

    console.log("Deal ID:", dealId);
    console.log("Stage:", stageId);

    // ⚠️ Temporary (we will fix this later)
    if (!stageId) {
      return res.send("No stage");
    }

    // Get deal details
    const dealRes = await axios.get(
      `${BITRIX_WEBHOOK}crm.deal.get?id=${dealId}`
    );

    const deal = dealRes.data.result;
    const contactId = deal.CONTACT_ID;

    if (!contactId) {
      return res.send("No contact linked");
    }

    // Get contact
    const contactRes = await axios.get(
      `${BITRIX_WEBHOOK}crm.contact.get?id=${contactId}`
    );

    const contact = contactRes.data.result;

    if (!contact.PHONE || contact.PHONE.length === 0) {
      return res.send("No phone found");
    }

    const phone = contact.PHONE[0].VALUE;

    console.log("Phone:", phone);

    // Send WhatsApp via Twilio
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      new URLSearchParams({
        From: process.env.TWILIO_WHATSAPP_FROM,
        To: `whatsapp:${phone}`,
        Body: "Hello from Bitrix24 🚀",
      }),
      {
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN,
        },
      }
    );

    console.log("Message sent:", response.data.sid);

    res.send("Message sent");
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
