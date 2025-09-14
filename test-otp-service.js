/**
 * Test OTP service directly
 */

const {
    generateAndSendOTP,
    verifyOTP,
} = require("./dist/services/otp.service");

async function testOTPService() {
    console.log("🧪 Testing OTP Service...\n");

    try {
        // Test 1: Generate and send OTP
        console.log("1. Testing OTP generation...");
        const result = await generateAndSendOTP("9876543210");
        console.log("Result:", result);

        if (result.success) {
            console.log("✅ OTP generated successfully");

            // Test 2: Verify OTP (this will fail since we don't have the actual OTP)
            console.log("\n2. Testing OTP verification...");
            const verifyResult = await verifyOTP(
                "9876543210",
                "123456",
                "Test User"
            );
            console.log("Verify result:", verifyResult);
        } else {
            console.log("❌ OTP generation failed:", result.message);
        }
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

testOTPService();
