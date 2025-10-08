import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recipesRouter from './routes/recipes';
import youtubeRouter from './routes/youtube';
import websiteRouter from './routes/website';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (mobile app)
app.use(express.json()); // Parse JSON request bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'InstaDish Mobile Backend is running' });
});

// API routes
app.use('/api/recipes', recipesRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/website', websiteRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server - listen on all interfaces to allow mobile device connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 InstaDish Mobile Backend running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🍽️  Recipe parse: http://localhost:${PORT}/api/recipes/parse`);
  console.log(`🎬 YouTube transcript: http://localhost:${PORT}/api/youtube/transcript`);
  console.log(`🌐 Website content: http://localhost:${PORT}/api/website/content`);
  console.log(`\n📲 For mobile device, use: http://192.168.2.27:${PORT}`);
});
