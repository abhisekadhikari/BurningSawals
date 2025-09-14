# Monitoring and Logging Setup

## 🎯 **Overview**

This document describes the comprehensive monitoring and logging system implemented for the phone authentication system. The system provides real-time metrics, health monitoring, and structured logging for production use.

## 📊 **Monitoring Features**

### **1. System Health Monitoring**

-   **Database Health**: Connection status and performance
-   **SMS Service Health**: Fast2SMS API status
-   **Memory Usage**: Node.js memory consumption
-   **Uptime**: Application uptime tracking

### **2. Authentication Metrics**

-   **User Statistics**: Total users, verified users
-   **OTP Statistics**: Generated, verified, failed OTPs
-   **SMS Delivery**: Success/failure rates
-   **Performance Metrics**: Average OTP verification time
-   **Top Phone Numbers**: Most active users

### **3. Security Monitoring**

-   **Suspicious Activity Detection**: Rate limiting and anomaly detection
-   **Failed Attempts Tracking**: Brute force protection
-   **Audit Logging**: All authentication events

## 🔧 **API Endpoints**

### **System Health**

```bash
GET /api/monitoring/health
Authorization: Bearer <token>

Response:
{
  "statusCode": 200,
  "message": "System health retrieved successfully",
  "data": {
    "database": "healthy",
    "smsService": "healthy",
    "uptime": 3600000,
    "memoryUsage": {
      "rss": 45678912,
      "heapTotal": 20971520,
      "heapUsed": 12345678,
      "external": 1234567
    },
    "timestamp": "2025-09-14T11:30:00.000Z"
  }
}
```

### **Authentication Metrics**

```bash
GET /api/monitoring/metrics
Authorization: Bearer <token>

Response:
{
  "statusCode": 200,
  "message": "Metrics retrieved successfully",
  "data": {
    "totalUsers": 150,
    "verifiedUsers": 142,
    "totalOTPs": 500,
    "successfulOTPs": 480,
    "failedOTPs": 20,
    "smsDelivered": 480,
    "smsFailed": 20,
    "averageOTPTime": 45,
    "topPhoneNumbers": [
      { "phone": "9876543210", "count": 25 },
      { "phone": "9876543211", "count": 20 }
    ],
    "recentActivity": [...]
  }
}
```

### **Daily Statistics**

```bash
GET /api/monitoring/daily-stats
Authorization: Bearer <token>

Response:
{
  "statusCode": 200,
  "message": "Daily stats retrieved successfully",
  "data": {
    "date": "2025-09-14",
    "otpsGenerated": 50,
    "otpsVerified": 45,
    "usersCreated": 10,
    "smsDelivered": 45
  }
}
```

### **Cleanup Operations**

```bash
POST /api/monitoring/cleanup
Authorization: Bearer <token>

Response:
{
  "statusCode": 200,
  "message": "Cleanup completed successfully",
  "data": {
    "cleanedRecords": 25
  }
}
```

## 📝 **Logging System**

### **Log Levels**

-   **ERROR**: Critical errors requiring immediate attention
-   **WARN**: Warning conditions that should be monitored
-   **INFO**: General information about system operation
-   **DEBUG**: Detailed information for debugging (development only)

### **Structured Logging**

All logs include:

-   **Timestamp**: ISO 8601 format
-   **Log Level**: ERROR, WARN, INFO, DEBUG
-   **Message**: Human-readable description
-   **Context**: Additional structured data

### **Authentication Events**

```typescript
// OTP Generation
logger.otpGenerated(phoneNumber, otpId, { otp: "123456" });

// OTP Sent
logger.otpSent(phoneNumber, "sms", { requestId: "req_123" });

// OTP Verified
logger.otpVerified(phoneNumber, userId, true, { isNewUser: true });

// OTP Failed
logger.otpFailed(phoneNumber, "Invalid OTP format");

// SMS Error
logger.smsError(phoneNumber, "API key invalid");

// User Created
logger.userCreated(userId, phoneNumber, userName);

// Suspicious Activity
logger.suspiciousActivity(phoneNumber, "Too many OTP requests");
```

### **Performance Logging**

```typescript
// Track operation duration
const startTime = Date.now();
// ... operation ...
monitoringService.logPerformance("otp_verification", startTime, {
    phoneNumber,
});
```

## 🚨 **Security Features**

### **Suspicious Activity Detection**

-   **Rate Limiting**: Max 10 OTP requests per hour per phone
-   **Failed Attempts**: Max 3 accounts with 5+ failed attempts per hour
-   **Anomaly Detection**: Unusual patterns in authentication

### **Audit Trail**

-   All authentication events are logged
-   Failed attempts are tracked and monitored
-   Suspicious activities are flagged and logged

## 📈 **Monitoring Dashboard**

### **Key Metrics to Monitor**

1. **OTP Success Rate**: Should be > 90%
2. **SMS Delivery Rate**: Should be > 95%
3. **Average Verification Time**: Should be < 60 seconds
4. **Failed Attempts**: Should be < 5% of total
5. **Suspicious Activities**: Should be 0 in normal operation

### **Alert Thresholds**

-   **OTP Success Rate < 85%**: Investigate SMS delivery issues
-   **SMS Delivery Rate < 90%**: Check Fast2SMS API status
-   **Suspicious Activity > 0**: Review security logs
-   **Memory Usage > 80%**: Scale up or optimize
-   **Database Health = unhealthy**: Immediate attention required

## 🔧 **Configuration**

### **Environment Variables**

```env
# Logging
NODE_ENV=production
LOG_LEVEL=info

# Monitoring
ENABLE_MONITORING=true
MONITORING_CLEANUP_INTERVAL=3600000  # 1 hour in ms

# SMS Service
FAST2SMS_API_KEY=your_api_key
FAST2SMS_SENDER_ID=BURNING
```

### **Log Rotation**

For production, configure log rotation:

```bash
# Using PM2
pm2 install pm2-logrotate

# Using Docker
docker run -d --log-driver=json-file --log-opt max-size=10m --log-opt max-file=3 your-app
```

## 🚀 **Production Deployment**

### **1. Set Up Monitoring**

```bash
# Install monitoring tools
npm install pm2
pm2 start src/app.ts --name "burning-sawals"

# Set up log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### **2. Configure Alerts**

```bash
# Set up health check endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/monitoring/health

# Set up automated cleanup
crontab -e
# Add: 0 */6 * * * curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/monitoring/cleanup
```

### **3. Database Monitoring**

```sql
-- Monitor OTP table size
SELECT COUNT(*) as total_otps FROM otps;

-- Monitor user growth
SELECT DATE(created_at) as date, COUNT(*) as new_users
FROM users
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Monitor failed attempts
SELECT phone_number, COUNT(*) as failed_attempts
FROM otps
WHERE attempts >= 5
GROUP BY phone_number
ORDER BY failed_attempts DESC;
```

## 📊 **Sample Monitoring Queries**

### **Daily Report**

```bash
# Get daily metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/monitoring/daily-stats

# Get system health
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/monitoring/health
```

### **Performance Analysis**

```bash
# Check top phone numbers
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/monitoring/metrics | jq '.data.topPhoneNumbers'
```

## 🎯 **Next Steps**

1. **Set up external monitoring** (e.g., DataDog, New Relic)
2. **Configure alerting** for critical metrics
3. **Set up log aggregation** (e.g., ELK Stack)
4. **Implement custom dashboards** for business metrics
5. **Set up automated scaling** based on metrics

---

**The monitoring and logging system is now fully implemented and ready for production use!** 🚀
