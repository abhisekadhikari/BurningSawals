# Burning Sawals - Node.js Backend

A comprehensive Node.js backend application for a question-answer platform with phone-based authentication, analytics, and monitoring.

## 🚀 **Features**

-   **Phone Authentication**: Indian phone number verification with OTP
-   **Question Management**: CRUD operations for questions and genres
-   **Analytics System**: User interactions tracking (Like, Super Like, Dislike)
-   **Monitoring & Logging**: Comprehensive system health and performance monitoring
-   **Security**: Rate limiting, suspicious activity detection, audit logging

## 📋 **Tech Stack**

-   **Backend**: Node.js, Express.js, TypeScript
-   **Database**: MySQL with Prisma ORM
-   **Authentication**: JWT with JWE encryption
-   **SMS Service**: Fast2SMS (DLT-free OTP)
-   **Validation**: Zod
-   **Testing**: Jest, Supertest
-   **Monitoring**: Custom logging and metrics system

## 🛠 **Installation**

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd burning-sawals-node
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Environment Setup**

    ```bash
    cp .env.example .env
    # Edit .env with your configuration
    ```

4. **Database Setup**

    ```bash
    # Generate Prisma client
    npx prisma generate

    # Run database migrations
    npx prisma db push
    ```

5. **Start the application**

    ```bash
    # Development
    npm run dev

    # Production
    npm run build
    npm start
    ```

## 📱 **Phone Authentication API**

### **Send OTP**

```bash
POST /api/auth/phone/send-otp
Content-Type: application/json

{
  "phone_number": "6296767187"
}
```

**Response:**

```json
{
    "statusCode": 200,
    "message": "OTP sent successfully",
    "data": {
        "phone_number": "6296767187",
        "expires_in": 600
    }
}
```

### **Verify OTP & Create User**

```bash
POST /api/auth/phone/verify-otp
Content-Type: application/json

{
  "phone_number": "6296767187",
  "otp": "123456",
  "user_name": "Final Boss"
}
```

**Response:**

```json
{
    "statusCode": 200,
    "message": "User created and verified successfully",
    "data": {
        "user": {
            "user_id": "1",
            "user_name": "Final Boss",
            "phone_number": "6296767187",
            "is_phone_verified": true
        },
        "token": "encrypted_jwt_token"
    }
}
```

### **Login with Phone & OTP**

```bash
POST /api/auth/phone/login
Content-Type: application/json

{
  "phone_number": "6296767187",
  "otp": "123456"
}
```

**Response:**

```json
{
    "statusCode": 200,
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": "1",
            "user_name": "Final Boss",
            "phone_number": "6296767187",
            "is_phone_verified": true
        },
        "token": "encrypted_jwt_token"
    }
}
```

## 📊 **Analytics API**

### **Add Question Interaction**

```bash
POST /api/analytics/questions/{questionId}/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "interaction_type": "like"
}
```

### **Get Question Analytics**

```bash
GET /api/analytics/questions/{questionId}
Authorization: Bearer <token>
```

### **Get User Analytics**

```bash
GET /api/analytics/users/{userId}/summary
Authorization: Bearer <token>
```

## 📈 **Monitoring API**

### **System Health**

```bash
GET /api/monitoring/health
Authorization: Bearer <token>
```

### **Authentication Metrics**

```bash
GET /api/monitoring/metrics
Authorization: Bearer <token>
```

### **Daily Statistics**

```bash
GET /api/monitoring/daily-stats
Authorization: Bearer <token>
```

## 🔧 **Environment Variables**

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/burning_sawals"

# JWT Configuration
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"

# JWE Configuration
JWE_PUBLIC_KEY="your_public_key"
JWE_PRIVATE_KEY="your_private_key"

# SMS Service
FAST2SMS_API_KEY="your_fast2sms_api_key"
FAST2SMS_SENDER_ID="BURNING"

# Application
NODE_ENV="development"
PORT=8080
```

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 **API Documentation**

-   **[Analytics API](ANALYTICS_API.md)**: Complete analytics endpoints documentation
-   **[Monitoring Setup](MONITORING_SETUP.md)**: Monitoring and logging configuration
-   **[Fast2SMS Setup](FAST2SMS_SETUP.md)**: SMS service configuration

## 🔒 **Security Features**

-   **Rate Limiting**: Max 10 OTP requests per hour per phone
-   **OTP Expiration**: 10-minute expiration time
-   **Attempt Limiting**: Max 5 attempts per OTP
-   **Suspicious Activity Detection**: Automated monitoring and alerting
-   **JWT Encryption**: JWE encryption for secure token storage
-   **Input Validation**: Comprehensive validation using Zod

## 📊 **Monitoring & Logging**

-   **Structured Logging**: JSON format with context
-   **Performance Tracking**: Operation duration monitoring
-   **Health Checks**: Database and service status monitoring
-   **Security Alerts**: Suspicious activity detection
-   **Audit Trail**: Complete authentication event logging

## 🚀 **Deployment**

### **Production Setup**

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/app.ts --name "burning-sawals"

# Set up log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### **Docker Deployment**

```bash
# Build image
docker build -t burning-sawals .

# Run container
docker run -p 8080:8080 --env-file .env burning-sawals
```

## 📝 **Database Schema**

### **Users Table**

-   `user_id`: Primary key
-   `user_name`: User's display name
-   `phone_number`: Unique phone number
-   `is_phone_verified`: Verification status
-   `created_at`: Account creation timestamp

### **OTPs Table**

-   `otp_id`: Primary key
-   `phone_number`: Associated phone number
-   `otp_hash`: Hashed OTP
-   `salt`: Salt for hashing
-   `expires_at`: Expiration timestamp
-   `attempts`: Number of verification attempts
-   `consumed_at`: Verification timestamp

### **Questions Table**

-   `question_id`: Primary key
-   `question_text`: Question content
-   `question_type_id`: Type reference
-   `created_at`: Creation timestamp

### **Analytics Tables**

-   `question_interactions`: User interactions with questions
-   `question_analytics_summary`: Aggregated question metrics
-   `user_analytics_summary`: Aggregated user metrics

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support and questions:

-   Create an issue in the repository
-   Check the documentation files
-   Review the monitoring logs

---

**Built with ❤️ for the Burning Sawals community**
