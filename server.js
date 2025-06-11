import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import emailRoutes from './Routes/EmailRoutes.js';

dotenv.config();

const app = express();
console.log('Loaded Email:', process.env.EMAIL_USER);
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
