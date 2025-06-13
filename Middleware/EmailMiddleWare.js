import validator from 'validator';
import axios from "axios";

let requestCount = {};
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

// Enhanced spam keywords with more patterns
const spamKeywords = [
  'viagra', 'buy now', 'free money', 'click here', 'win big', 'make money fast',
  'get rich quick', 'guaranteed income', 'work from home', 'lose weight fast',
  'miracle cure', 'limited time offer', 'act now', 'call now', 'order now',
  'risk free', '100% free', 'no questions asked', 'satisfaction guaranteed',
  'double your income', 'eliminate debt', 'refinance', 'weight loss',
  'as seen on tv', 'congratulations', 'you have won', 'claim your prize'
];

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

  // 3. Enhanced phone validation
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid mobile number (basic validation)
  if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format.',
    });
  }

  // Additional phone checks
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return res.status(400).json({
      success: false,
      message: 'Phone number must be between 10-15 digits.',
    });
  }

  // Check for obviously fake numbers (all same digits, sequential)
  if (/^(\d)\1{9,}$/.test(cleanPhone) || /^(0123456789|1234567890)/.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number.',
    });
  }

  // 4. Enhanced spam detection
  const textToCheck = `${name} ${email} ${message} ${collegeName} ${domain}`.toLowerCase();
  
  // Check for spam keywords
  const isSpamKeyword = spamKeywords.some(keyword => textToCheck.includes(keyword.toLowerCase()));
  
  if (isSpamKeyword) {
    return res.status(403).json({
      success: false,
      message: 'Message contains inappropriate content.',
    });
  }

  // 5. Check for excessive URLs
  const urlMatches = message.match(/https?:\/\/[^\s]+/g);
  if (urlMatches && urlMatches.length > 2) {
    return res.status(403).json({
      success: false,
      message: 'Too many links in the message.',
    });
  }

  // 6. Check for excessive capitalization (SPAM INDICATOR)
  const capsPercentage = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsPercentage > 0.7 && message.length > 10) {
    return res.status(403).json({
      success: false,
      message: 'Please avoid excessive capitalization.',
    });
  }

  // 7. Check for repeated characters (!!!! or aaaa)
  if (/(.)\1{4,}/.test(message)) {
    return res.status(403).json({
      success: false,
      message: 'Please avoid excessive repeated characters.',
    });
  }

  // 8. Check message length (too short might be spam)
  if (message.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Message must be at least 10 characters long.',
    });
  }

  // 9. Check for email addresses in message (often spam)
  const emailsInMessage = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
  if (emailsInMessage && emailsInMessage.length > 0) {
    return res.status(403).json({
      success: false,
      message: 'Please do not include email addresses in the message.',
    });
  }

  // 10. Check for phone numbers in message (often spam)
  const phonesInMessage = message.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
  if (phonesInMessage && phonesInMessage.length > 0) {
    return res.status(403).json({
      success: false,
      message: 'Please do not include phone numbers in the message.',
    });
  }

  // If all checks pass, proceed
  next();
};

export const honeypotCheck = (req, res, next) => {
  const { honeypot } = req.body; // Changed from 'company' to 'honeypot' to match your frontend

  // If honeypot field is filled => likely a bot
  if (honeypot && honeypot.trim() !== "") {
    return res.status(400).json({
      success: false,
      message: "Please try again.", // Generic message to not reveal the honeypot
    });
  }

  next();
};

// Additional middleware for content analysis
export const advancedSpamDetection = (req, res, next) => {
  const { name, email, message, collegeName, domain } = req.body;

  let spamScore = 0;
  const reasons = [];

  // More comprehensive suspicious patterns
  const suspiciousPatterns = [
    { pattern: /\$\d+|\d+\s*dollars?|\d+\s*USD/gi, score: 3, reason: "Money amounts detected" },
    { pattern: /earn.*\$.*daily|daily.*income|passive.*income/gi, score: 4, reason: "Money earning claims" },
    { pattern: /make.*money.*online|online.*money|money.*making/gi, score: 4, reason: "Online money making" },
    { pattern: /work.*from.*home|home.*based.*work|remote.*work.*\$/gi, score: 3, reason: "Work from home with money" },
    { pattern: /guaranteed.*income|guaranteed.*money|guaranteed.*profit/gi, score: 5, reason: "Guaranteed income claims" },
    { pattern: /no.*experience.*required|no.*skills.*needed/gi, score: 3, reason: "No experience required" },
    { pattern: /click.*here|visit.*now|act.*now|limited.*time/gi, score: 2, reason: "Urgent action words" },
    { pattern: /free.*money|free.*cash|free.*gift/gi, score: 4, reason: "Free money claims" },
    { pattern: /investment.*opportunity|business.*opportunity/gi, score: 3, reason: "Investment opportunities" },
    { pattern: /lose.*weight.*fast|miracle.*cure|amazing.*results/gi, score: 3, reason: "Health/miracle claims" },
    { pattern: /congratulations.*won|you.*have.*won|claim.*prize/gi, score: 5, reason: "Fake prize claims" },
    { pattern: /urgent.*response|immediate.*action|respond.*immediately/gi, score: 3, reason: "Urgency tactics" },
    { pattern: /call.*now|order.*now|buy.*now/gi, score: 2, reason: "Sales pressure" },
    { pattern: /risk.*free|no.*risk|100%.*guarantee/gi, score: 2, reason: "Risk-free claims" },
    { pattern: /multi.*level.*marketing|MLM|pyramid.*scheme/gi, score: 5, reason: "MLM/Pyramid schemes" }
  ];

  const allText = `${name} ${message} ${collegeName} ${domain}`;
  
  // Check each pattern and accumulate score
  suspiciousPatterns.forEach(({ pattern, score, reason }) => {
    if (pattern.test(allText)) {
      spamScore += score;
      reasons.push(reason);
    }
  });

  // Check for excessive special characters
  const specialCharCount = (message.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\?]/g) || []).length;
  const specialCharRatio = specialCharCount / message.length;
  if (specialCharRatio > 0.15) {
    spamScore += 2;
    reasons.push("Excessive special characters");
  }

  // Check for excessive capitalization
  const capsCount = (message.match(/[A-Z]/g) || []).length;
  const capsRatio = capsCount / message.length;
  if (capsRatio > 0.5 && message.length > 10) {
    spamScore += 3;
    reasons.push("Excessive capitalization");
  }

  // Check for repeated characters or words
  if (/(.)\1{4,}/.test(message)) {
    spamScore += 2;
    reasons.push("Repeated characters");
  }

  // Check for multiple URLs
  const urlMatches = message.match(/https?:\/\/[^\s]+/g) || [];
  if (urlMatches.length > 1) {
    spamScore += urlMatches.length * 2;
    reasons.push(`Multiple URLs (${urlMatches.length})`);
  }

  // Check for email addresses in message
  const emailMatches = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  if (emailMatches.length > 0) {
    spamScore += 3;
    reasons.push("Email addresses in message");
  }

  // Check for phone numbers in message
  const phoneMatches = message.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
  if (phoneMatches.length > 0) {
    spamScore += 2;
    reasons.push("Phone numbers in message");
  }

  // Enhanced gibberish detection
  const words = message.split(/\s+/);
  let gibberishScore = 0;
  const gibberishWords = [];

  words.forEach(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleanWord.length < 3) return; // Skip very short words
    
    const vowelCount = (cleanWord.match(/[aeiou]/g) || []).length;
    const consonantCount = cleanWord.length - vowelCount;
    
    // Multiple gibberish checks
    let wordScore = 0;
    let wordReasons = [];
    
    // 1. Very long words (likely gibberish)
    if (cleanWord.length > 15) {
      wordScore += 3;
      wordReasons.push("very long");
    }
    
    // 2. Long words with no vowels
    if (cleanWord.length > 6 && vowelCount === 0) {
      wordScore += 4;
      wordReasons.push("no vowels");
    }
    
    // 3. Too many consonants ratio
    if (cleanWord.length > 5 && consonantCount > vowelCount * 2.5) {
      wordScore += 2;
      wordReasons.push("consonant heavy");
    }
    
    // 4. Keyboard patterns (qwerty, asdf, etc.)
    const keyboardPatterns = [
      /qwerty|asdf|zxcv|hjkl|uiop|dfgh|cvbn|tyui|fghj|vbnm/,
      /abcdef|fedcba|123456|654321/
    ];
    
    if (keyboardPatterns.some(pattern => pattern.test(cleanWord))) {
      wordScore += 3;
      wordReasons.push("keyboard pattern");
    }
    
    // 5. Repeating patterns (abcabc, xyxyxy)
    if (/(.{2,4})\1{2,}/.test(cleanWord)) {
      wordScore += 3;
      wordReasons.push("repeating pattern");
    }
    
    // 6. Random character sequences (lack of common letter combinations)
    const commonBigrams = ['th', 'he', 'in', 'er', 'an', 're', 'ed', 'nd', 'on', 'en'];
    const wordBigrams = [];
    for (let i = 0; i < cleanWord.length - 1; i++) {
      wordBigrams.push(cleanWord.substring(i, i + 2));
    }
    
    const commonBigramCount = wordBigrams.filter(bigram => 
      commonBigrams.includes(bigram)
    ).length;
    
    if (cleanWord.length > 8 && commonBigramCount === 0) {
      wordScore += 2;
      wordReasons.push("no common patterns");
    }
    
    if (wordScore > 0) {
      gibberishScore += wordScore;
      gibberishWords.push(`${word}(${wordReasons.join(',')})`);
    }
  });

  if (gibberishScore > 0) {
    spamScore += gibberishScore;
    reasons.push(`Gibberish detected: ${gibberishWords.join(', ')}`);
  }

  // Check for very short messages (likely spam)
  if (message.trim().length < 5) {
    spamScore += 3;
    reasons.push("Message too short");
  }

  // Check for domain-related spam patterns
  const domainSpamPatterns = [
    /cryptocurrency|crypto|bitcoin|ethereum|trading/gi,
    /loan|credit|debt|finance.*help/gi,
    /casino|gambling|poker|bet/gi
  ];

  domainSpamPatterns.forEach(pattern => {
    if (pattern.test(allText)) {
      spamScore += 2;
      reasons.push("Suspicious domain content");
    }
  });

  // Log the final score and decision

  // Threshold for blocking (you can adjust this)
  const SPAM_THRESHOLD = 5;

  if (spamScore >= SPAM_THRESHOLD) {
    return res.status(403).json({
      success: false,
      message: 'Message detected as spam or inappropriate content.',
      // Include this only in development for debugging
      ...(process.env.NODE_ENV === 'development' && { 
        debug: { score: spamScore, reasons } 
      })
    });
  }

  next();
};

export const apiKeyMiddleware = (req, res, next) => {
  const clientKey = req.headers['x-api-key'];

  if (!clientKey) {
    return res.status(401).json({ success: false, message: 'API key missing' });
  }

  if (clientKey !== process.env.API_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid API key' });
  }

  next();
};