const http = require('http');
const https = require('https');

/**
 * Custom Promise-wrapped HTTP/HTTPS client to avoid third-party dependencies.
 * @param {string} urlStr - Target URL
 * @param {string} method - HTTP Method (GET, POST, etc.)
 * @param {Object} [headers] - HTTP Headers
 * @param {Object|string} [data] - Request body payload
 * @returns {Promise<{ status: number, data: any, raw: string }>}
 */
const makeRequest = (urlStr, method, headers = {}, data = null) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(urlStr);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const payloadString = data && typeof data === 'object' ? JSON.stringify(data) : data;
      
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

      if (payloadString) {
        options.headers['Content-Length'] = Buffer.byteLength(payloadString);
      }

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed, raw: body });
          } catch (e) {
            resolve({ status: res.statusCode, error: 'Failed to parse JSON response', raw: body });
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      if (payloadString) {
        req.write(payloadString);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { makeRequest };
