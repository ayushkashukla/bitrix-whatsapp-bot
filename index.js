const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

app.post('/webhook', async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body));

    const dealId = req.body?.data?.FIELDS?.ID
      || req.body?.['data[FIELDS][ID]']
      || req.query?.['data[FIELDS][ID]'];

    if (!dealId) {
      console.log("No Deal ID found");
      return res.sendStatus(200);
    }

    console.log("Deal ID:", dealId);

    // Fetch deal
    const dealResponse = await axios.get(
      `${process.env.BITRIX_WEBHOOK}/crm.deal.get?id=${dealId}`
    );
    const deal = dealResponse.data.result;
    console.log("Deal data:", deal);

    const stageId = deal.STAGE_ID;
    console.log("Stage ID:", stageId);

    if (stageId !== process.env.SEND_WHATSAPP_STAGE_ID) {
      console.log("Not the trigger stage, skipping");
      return res.sendStatus(200);
    }

    const contactId = deal.CONTACT_ID;
    if (!contactId) {
      console.log("No contact linked");
      return res.sendStatus(200);
    }

    // Fetch contact
    const contactResponse = await axios.get(
      `${process.env.BITRIX_WEBHOOK}/crm.contact.get?id=${contactId}`
    );
    const contact = contactResponse.data.result;
    const phone = contact.PHONE?.[0]?.VALUE;
    console.log("Phone:", phone);

    if (!phone) {
      console.log("No phone found");
      return res.sendStatus(200);
    }

    // Normalise to E.164 whatsapp format
    const cleaned = phone.replace(/[\s\-().]/g, '');
    const toNumber = cleaned.startsWith('+')
      ? `whatsapp:${cleaned}`
      : `whatsapp:+${cleaned}`;

    // Send WhatsApp template via Twilio
    const message = await client.messages.create({
      from:       process.env.TWILIO_WHATSAPP_FROM,
      to:         toNumber,
      contentSid: process.env.WHATSAPP_TEMPLATE_SID,
    });

    console.log("WhatsApp sent, SID:", message.sid);
    res.sendStatus(200);

  } catch (error) {
    console.error("Error:", error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
