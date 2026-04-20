const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

app.post('/webhook', async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body));

    const dealId = req.body?.data?.FIELDS?.ID || req.body?.data?.ID;

    if (!dealId) {
      console.log("No Deal ID found");
      return res.sendStatus(200);
    }

    // Fetch deal details
    const dealResponse = await axios.get(
      `${process.env.BITRIX_WEBHOOK}/crm.deal.get?id=${dealId}`
    );

    const deal = dealResponse.data.result;

    console.log("Deal data:", deal);

    const stageId = deal.STAGE_ID;
    console.log("Stage ID:", stageId);

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
