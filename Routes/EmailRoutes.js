import express from 'express';
import { sendEmail } from '../Controller/EmailController.js';
import { honeypotCheck, rateLimiter, validateEmailRequest, apiKeyMiddleware, advancedSpamDetection } from '../Middleware/EmailMiddleWare.js';

const router = express.Router();

router.post('/send', rateLimiter, validateEmailRequest, honeypotCheck, apiKeyMiddleware,advancedSpamDetection, sendEmail);

export default router;
