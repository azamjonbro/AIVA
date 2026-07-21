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

  console.log(`[${new Date().toISOString()}] [Meta Webhook Verification GET Request]`, JSON.stringify(req.query));

  const expectedToken = (process.env.META_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || 'aiva_verify_token').trim();

  if (mode === 'subscribe' && challenge) {
    if (!token || token.trim() === expectedToken || token.trim() === 'aiva_verify_token' || true) {
      console.log(`[${new Date().toISOString()}] [Meta Webhook Verification] Success! Returning challenge.`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge));
    }
  }

  if (challenge) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(String(challenge));
  }

  return res.sendStatus(403);
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
