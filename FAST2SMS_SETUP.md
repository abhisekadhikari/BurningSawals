# Fast2SMS Integration Setup

## 🚀 **Why Fast2SMS?**

-   **🇮🇳 Indian SMS Service**: Optimized for Indian phone numbers
-   **💰 Cost-Effective**: Much cheaper than Twilio for Indian numbers
-   **⚡ Fast Delivery**: High delivery rates in India
-   **🔧 Easy Integration**: Simple REST API
-   **📱 No Verification Required**: Can send to any valid Indian number
-   **🚫 No DLT Required**: Simple OTP setup without DLT registration

## 📋 **Setup Steps**

### 1. **Create Fast2SMS Account**

1. Go to [Fast2SMS.com](https://www.fast2sms.com/)
2. Sign up for a free account
3. Verify your email and phone number

### 2. **Get API Key**

1. Login to your Fast2SMS dashboard
2. Go to **API** section
3. Copy your **API Key**

### 3. **Environment Variables**

Add these to your `.env` file:

```env
# Fast2SMS Configuration
FAST2SMS_API_KEY=your_api_key_here
FAST2SMS_SENDER_ID=BURNING
```

### 4. **Test the Integration**

```bash
# Test OTP sending
curl -X POST http://localhost:8080/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'
```

## 🚫 **DLT-Free Setup**

This integration uses the **`q` route** which doesn't require DLT (Distributed Ledger Technology) registration:

-   ✅ **No DLT Registration**: Skip the complex DLT process
-   ✅ **Immediate Setup**: Start sending OTPs right away
-   ✅ **Simple Configuration**: Just need API key
-   ✅ **Cost-Effective**: Lower cost per SMS
-   ⚠️ **Note**: Some carriers may have delivery restrictions

## 🔧 **API Configuration**

### **SMS Templates**

The system uses predefined templates:

```typescript
// OTP Template
SMS_TEMPLATES.OTP(otp: string, appName: string)
// Result: "Your OTP for Burning Sawals is: 123456. Valid for 10 minutes."

// Welcome Template
SMS_TEMPLATES.WELCOME(userName: string, appName: string)
// Result: "Welcome to Burning Sawals, John! Your account has been created successfully."

// Login Success Template
SMS_TEMPLATES.LOGIN_SUCCESS(userName: string, appName: string)
// Result: "Login successful! Welcome back to Burning Sawals, John."
```

### **SMS Configuration**

```typescript
{
    apiKey: process.env.FAST2SMS_API_KEY,
    baseUrl: 'https://www.fast2sms.com/dev/bulkV2',
    route: 'q',                      // Simple OTP route (no DLT required)
    senderId: 'BURNING'              // Your sender ID
}
```

### **Route Options**

-   **`q`**: Simple OTP messages (no DLT registration required)
-   **`otp`**: DLT registered OTP messages (requires DLT registration)
-   **`t`**: Transactional messages
-   **`p`**: Promotional messages

## 📊 **Pricing (Fast2SMS)**

| Plan           | Price per SMS | Features      |
| -------------- | ------------- | ------------- |
| **Free Trial** | ₹0.50         | 100 SMS free  |
| **Starter**    | ₹0.35         | 1000 SMS      |
| **Business**   | ₹0.25         | 10,000 SMS    |
| **Enterprise** | ₹0.15         | 1,00,000+ SMS |

## 🔍 **API Response Format**

### **Success Response**

```json
{
    "return": true,
    "request_id": "1234567890",
    "message": "SMS sent successfully"
}
```

### **Error Response**

```json
{
    "return": false,
    "message": "Invalid API key"
}
```

## 🛠️ **Testing Without API Key**

If you don't have a Fast2SMS API key yet, the system will:

1. ✅ Generate and store OTP in database
2. 📱 Log OTP to console for testing
3. ⚠️ Show "Fast2SMS not configured" message
4. 🔄 Continue with normal flow

## 🚨 **Error Handling**

The system gracefully handles:

-   ❌ Invalid API key
-   ❌ Insufficient balance
-   ❌ Invalid phone number
-   ❌ Network errors
-   ❌ API rate limits

## 📱 **Supported Phone Formats**

-   ✅ `9876543210` (10 digits)
-   ✅ `+919876543210` (with country code)
-   ✅ `09876543210` (with leading zero)
-   ❌ `1234567890` (invalid prefix)

## 🔐 **Security Features**

-   🔒 **OTP Hashing**: PBKDF2 with random salt
-   ⏰ **Time-based Expiry**: 10 minutes
-   🚫 **Attempt Limiting**: Max 5 attempts per OTP
-   🗑️ **Auto Cleanup**: Expired OTPs are automatically removed

## 📈 **Monitoring & Logs**

The system logs:

-   ✅ Successful SMS delivery
-   ❌ Failed SMS attempts
-   📱 Console fallback usage
-   🔧 Configuration status

## 🎯 **Next Steps**

1. **Get Fast2SMS API Key** from their dashboard
2. **Add to .env file** with your credentials
3. **Test with real phone number** to verify delivery
4. **Monitor delivery rates** in Fast2SMS dashboard
5. **Scale up plan** as your user base grows

---

**Need Help?** Check the [Fast2SMS Documentation](https://docs.fast2sms.com/) or contact their support.
