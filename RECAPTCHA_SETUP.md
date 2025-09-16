# Backend reCAPTCHA v3 Setup

## Environment Variables

Add these to your `.env` file:

```env
# reCAPTCHA v3 Configuration
RECAPTCHA_SECRET_KEY=your-secret-key-here
```

## How It Works

### 1. Score-Based Verification

-   reCAPTCHA v3 returns a score from 0.0 to 1.0
-   0.0 = Very likely a bot
-   1.0 = Very likely a human
-   Current threshold: 0.5 (configurable)

### 2. Rate Limiting + CAPTCHA

-   **OTP Requests**: 3 per 15 minutes + CAPTCHA verification
-   **Username Checks**: 20 per 5 minutes (no CAPTCHA needed)
-   **OTP Verification**: 5 per 10 minutes (no CAPTCHA needed)

### 3. Error Handling

-   Invalid CAPTCHA token
-   Low score (suspicious activity)
-   Network errors
-   Missing configuration

## Testing

1. Set your `RECAPTCHA_SECRET_KEY` in `.env`
2. Start the server: `npm run dev`
3. Test with frontend at `http://localhost:3000`

## Production Considerations

-   Use different keys for production
-   Monitor CAPTCHA scores in logs
-   Adjust score threshold based on your traffic
-   Consider implementing CAPTCHA analytics
