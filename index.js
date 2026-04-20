app.post('/webhook', async (req, res) => {
  try {
    console.log("Webhook received:", req.body);

    const dealId = req.body.data?.FIELDS?.ID || req.body.data?.ID;

    if (!dealId) {
      console.log("No Deal ID found");
      return res.sendStatus(200);
    }

    // Fetch deal details from Bitrix
    const dealResponse = await axios.get(
      `${process.env.BITRIX_WEBHOOK}/crm.deal.get?id=${dealId}`
    );

    const deal = dealResponse.data.result;

    console.log("Deal data:", deal);

    const stageId = deal.STAGE_ID;

    console.log("Stage ID:", stageId);

    // 👉 Only trigger for Send WhatsApp stage (we'll update later)
    if (stageId !== "PUT_YOUR_STAGE_ID_HERE") {
      return res.sendStatus(200);
    }

    // Get contact ID
    const contactId = deal.CONTACT_ID;

    const contactResponse = await axios.get(
      `${process.env.BITRIX_WEBHOOK}/crm.contact.get?id=${contactId}`
    );

    const contact = contactResponse.data.result;

    const phone = contact.PHONE?.[0]?.VALUE;

    console.log("Phone:", phone);

    // 👉 Twilio send (we’ll finalize after stage ID)
    
    res.sendStatus(200);

  } catch (error) {
    console.error("Error:", error.message);
    res.sendStatus(500);
  }
});
