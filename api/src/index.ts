import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import uploadRouter from './routes/upload';
import { errorHandler } from './middleware/error';

const app = express();

app.use(cors({
  origin: process.env.MINI_APP_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // Allow larger body for base64 uploads

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/upload', uploadRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Yo\'l topilmadi' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ API server running on http://localhost:${PORT}`);
  });
}

export default app;
