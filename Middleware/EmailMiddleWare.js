import validator from 'validator';
import axios from "axios";

let requestCount = {};
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

const spamKeywords = ['viagra', 'buy now', 'free money', 'click here', 'win big'];
export const rateLimiter = (req, res, next) => {
  const ip = req.ip;

  if (!requestCount[ip]) {
    requestCount[ip] = { count: 1, time: Date.now() };
    return next();
  }

  const elapsed = Date.now() - requestCount[ip].time;

  if (elapsed > TIME_WINDOW) {
    requestCount[ip] = { count: 1, time: Date.now() };
    return next();
  }

  if (requestCount[ip].count >= MAX_REQUESTS) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  requestCount[ip].count++;
  next();
};
export const validateEmailRequest = async (req, res, next) => {
  const { name, email, phone, collegeName, domain, message } = req.body;

  // 1. Check all fields are filled
  if (!name || !email || !phone || !collegeName || !domain || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.',
    });
  }

  // 2. Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.',
    });
  }

  // 3. Check if email exists using validator (ping/mx DNS check)
  const isValid = await validator.isEmail(email, { allow_utf8_local_part: false });
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Email validation failed.',
    });
  }

  // 4. Basic spam check: presence of spammy keywords
  const lowerMessage = message.toLowerCase();
  const isSpam = spamKeywords.some(keyword => lowerMessage.includes(keyword));

  if (isSpam) {
    return res.status(403).json({
      success: false,
      message: 'Message detected as spam.',
    });
  }

  // 5. Check for excessive URLs (e.g., more than 2)
  const urlMatches = message.match(/https?:\/\/[^\s]+/g);
  if (urlMatches && urlMatches.length > 2) {
    return res.status(403).json({
      success: false,
      message: 'Too many links in the message. Possible spam.',
    });
  }

  // If all checks pass, proceed
  next();
};

export const honeypotCheck = (req, res, next) => {
  const { company } = req.body;

  // If honeypot field is filled => likely a bot
  if (company && company.trim() !== "") {
    return res.status(400).json({
      success: false,
      message: "Bot activity detected. Submission blocked.",
    });
  }

  next();
};