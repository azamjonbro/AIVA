require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5003;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const { router: authRoutes } = require('./routes/auth');
const productRoutes = require('./routes/products');
const leadRoutes = require('./routes/leads');
const conversationRoutes = require('./routes/conversations');
const analyticsRoutes = require('./routes/analytics');
const integrationsRoutes = require('./routes/integrations');
const knowledgeRoutes = require('./routes/knowledge');
const employeesRoutes = require('./routes/employees');
const notificationsRoutes = require('./routes/notifications');
const metaWebhookRoutes = require('./routes/metaWebhook');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Meta Webhook endpoints (Mount at both /webhook/meta and /api/webhook/meta for Nginx reverse proxy compatibility)
app.use('/webhook/meta', metaWebhookRoutes);
app.use('/api/webhook/meta', metaWebhookRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'AIVA AI Sales Agent API',
    time: new Date().toISOString()
  });
});

// Start Database and Express Server
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize connected Telegram Bots
    const { initAllBots } = require('./services/telegram');
    await initAllBots();

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(` AIVA Backend running on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
