import express from 'express';
import { sendEmail } from '../Controller/EmailController.js';
import { honeypotCheck, rateLimiter, validateEmailRequest, apiKeyMiddleware } from '../Middleware/EmailMiddleWare.js';

const router = express.Router();

router.post('/send', rateLimiter, validateEmailRequest, honeypotCheck, apiKeyMiddleware, sendEmail);

export default router;
