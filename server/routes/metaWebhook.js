const express = require('express');
const router = express.Router();

/**
 * GET /webhook/meta (and /api/webhook/meta)
 * Meta Webhook Verification Endpoint
 * 
 * Query Parameters sent by Meta Developer Console:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: token configured in Meta App
 * - hub.challenge: challenge code to return back as plain text
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || 'aiva_meta_verify_token_2026_prod';

  console.log(`[${new Date().toISOString()}] [Meta Webhook Verification] Received mode: ${mode}, token: ${token}`);

  if (mode === 'subscribe' && token && token === expectedToken) {
    console.log(`[${new Date().toISOString()}] [Meta Webhook Verification] Success! Returning challenge.`);
    return res.status(200).send(challenge);
  } else {
    console.warn(`[${new Date().toISOString()}] [Meta Webhook Verification] Failed! Expected token: ${expectedToken}, received: ${token}`);
    return res.sendStatus(403);
  }
});

/**
 * POST /webhook/meta (and /api/webhook/meta)
 * Meta Webhook Event Receiver (Facebook Pages / Instagram Direct Messages / Messenger)
 */
router.post('/', (req, res) => {
  try {
    const body = req.body;
    console.log(`[${new Date().toISOString()}] [Meta Webhook Event Received]:`, JSON.stringify(body, null, 2));

    if (body.object === 'page' || body.object === 'instagram') {
      if (Array.isArray(body.entry)) {
        body.entry.forEach(entry => {
          console.log(`[Meta Webhook Event] Entry ID: ${entry.id}, Time: ${entry.time}`);
        });
      }
    }

    // Always respond immediately with 200 OK to acknowledge receipt to Meta
    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [Meta Webhook POST Error]:`, error.message);
    return res.status(200).send('EVENT_RECEIVED');
  }
});

module.exports = router;
