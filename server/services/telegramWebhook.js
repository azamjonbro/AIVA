const http = require('http');
const https = require('https');

/**
 * Custom Promise-wrapped HTTP/HTTPS client to avoid third-party dependencies.
 */
const makeRequest = (urlStr, method, headers = {}, data = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const client = urlObj.protocol === 'https:' ? https : http;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: 'Failed to parse JSON response', raw: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Register the bot's Webhook URL with Telegram API.
 */
const registerTelegramWebhook = async (token) => {
  const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://aiva.example.com';
  const webhookUrl = `${baseUrl}/api/integrations/telegram/webhook/${token}`;
  const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  
  let attempt = 0;
  const maxAttempts = 5;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[${new Date().toISOString()}] Registering Webhook for Token: ${token.substring(0, 10)}... -> URL: ${webhookUrl} (Attempt ${attempt}/${maxAttempts})`);
    try {
      const res = await makeRequest(telegramUrl, 'POST');
      
      if (res.status === 429 || (res.data && res.data.error_code === 429)) {
        const retryAfter = res.data?.parameters?.retry_after || 1;
        console.warn(`[${new Date().toISOString()}] Webhook registration rate limited (429). Retrying after ${retryAfter} second(s)...`);
        await sleep(retryAfter * 1000 + 200); // 200ms extra buffer to be safe
        continue;
      }
      
      console.log(`[${new Date().toISOString()}] Webhook registration response:`, res.data || res.error || res.raw);
      if (res.data) {
        return res.data;
      }
      throw new Error(res.error || 'Failed to register webhook');
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Webhook registration failed on attempt ${attempt}:`, err.message);
      if (attempt >= maxAttempts) {
        throw err;
      }
      await sleep(1500); // generic delay for network/other errors
    }
  }
};

/**
 * Forward update payload to backend /api/integrations/telegram/message with retries & exponential backoff.
 */
const forwardToBackendWithRetry = async (payload, customHeaders = {}, maxRetries = 3) => {
  const port = process.env.PORT || 5003;
  const backendUrl = `http://localhost:${port}/api/integrations/telegram/message`;
  const botSecret = process.env.BOT_SECRET || 'aiva_super_secure_bot_secret_2026';
  
  let attempt = 0;
  let delay = 1000;
  
  while (attempt < maxRetries) {
    try {
      console.log(`[${new Date().toISOString()}] [Telegram Bot] Forwarding update to AIVA Backend (Attempt ${attempt + 1}/${maxRetries})...`);
      const response = await makeRequest(backendUrl, 'POST', {
        'Authorization': `Bearer ${botSecret}`,
        ...customHeaders
      }, payload);
      
      if (response.status >= 200 && response.status < 300 && response.data && response.data.success) {
        console.log(`[${new Date().toISOString()}] [Telegram Bot] Backend processed successfully.`);
        return response.data;
      }
      
      console.warn(`[${new Date().toISOString()}] [Telegram Bot] Backend returned status ${response.status} or success=false. Retrying in ${delay}ms.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Telegram Bot] Backend request failed: ${error.message}. Retrying in ${delay}ms.`);
    }
    
    attempt++;
    if (attempt < maxRetries) {
      await sleep(delay);
      delay *= 2;
    }
  }
  
  throw new Error('Failed to communicate with AIVA backend after 3 attempts');
};

/**
 * Send 'typing' chat action indicator.
 */
const sendChatAction = async (token, chatId, action = 'typing', businessConnectionId = null) => {
  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  const body = { chat_id: chatId, action };
  if (businessConnectionId) {
    body.business_connection_id = businessConnectionId;
  }
  try {
    await makeRequest(url, 'POST', {}, body);
  } catch (err) {
    console.error(`[Telegram Action] Failed to send action:`, err.message);
  }
};

/**
 * Send individual text message chunk to Telegram.
 */
const sendTelegramMessage = async (token, chatId, text, businessConnectionId = null) => {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };
  if (businessConnectionId) {
    body.business_connection_id = businessConnectionId;
  }
  try {
    const res = await makeRequest(url, 'POST', {}, body);
    return res.data;
  } catch (err) {
    console.error(`[Telegram Send] Failed to send:`, err.message);
    throw err;
  }
};

/**
 * Split text message naturally into smaller parts by paragraphs or sentences.
 */
const splitMessage = (text, maxLength = 400) => {
  if (text.length <= maxLength) return [text];
  const parts = [];
  const paragraphs = text.split('\n\n');
  let currentPart = '';
  
  for (const para of paragraphs) {
    if (currentPart.length + para.length + 2 > maxLength) {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = '';
      }
      if (para.length > maxLength) {
        const lines = para.split('\n');
        for (const line of lines) {
          if (currentPart.length + line.length + 1 > maxLength) {
            if (currentPart) {
              parts.push(currentPart.trim());
              currentPart = '';
            }
            currentPart = line;
          } else {
            currentPart = currentPart ? currentPart + '\n' + line : line;
          }
        }
      } else {
        currentPart = para;
      }
    } else {
      currentPart = currentPart ? currentPart + '\n\n' + para : para;
    }
  }
  if (currentPart) {
    parts.push(currentPart.trim());
  }
  return parts;
};

/**
 * Run outgoing human-like delay, send typing indicators, split and deliver messages.
 */
const sendBotReply = async (token, chatId, replyText, typingDelay = 1000, businessConnectionId = null) => {
  console.log(`[${new Date().toISOString()}] Outgoing message flow started for chat: ${chatId} (Business Conn: ${businessConnectionId})`);
  
  // 1. Send 'typing'
  await sendChatAction(token, chatId, 'typing', businessConnectionId);
  
  // 2. Delay
  await sleep(typingDelay);
  
  // 3. Split response
  const chunks = splitMessage(replyText);
  
  // 4. Deliver split message blocks
  for (const chunk of chunks) {
    await sendTelegramMessage(token, chatId, chunk, businessConnectionId);
    if (chunks.length > 1) {
      await sleep(600);
    }
  }
  console.log(`[${new Date().toISOString()}] Outgoing message flow completed.`);
};

module.exports = {
  makeRequest,
  registerTelegramWebhook,
  forwardToBackendWithRetry,
  sendBotReply
};
