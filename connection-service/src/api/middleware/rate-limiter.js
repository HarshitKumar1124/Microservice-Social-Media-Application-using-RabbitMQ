const rateLimiter = require('express-rate-limit');

// Define rate limiting rule: Allow 100 requests per 15 minutes
const apiRateLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    headers: true, // Optionally include rate limit info in response headers
});


module.exports =  apiRateLimiter;
  