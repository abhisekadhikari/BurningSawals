/**
 * Test script for phone authentication system
 */

const axios = require("axios");

const BASE_URL = "http://localhost:8080";

async function testPhoneAuth() {
    console.log("🧪 Testing Phone Authentication System...\n");

    try {
        // Test 1: Send OTP
        console.log("1. Testing OTP sending...");
        const sendOTPResponse = await axios.post(
            `${BASE_URL}/auth/phone/send-otp`,
            {
                phone_number: "9876543210",
            }
        );

        console.log("✅ OTP sent successfully:", sendOTPResponse.data);

        // Wait a moment for OTP to be processed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Test 2: Verify OTP (this will fail since we don't have the actual OTP)
        console.log("\n2. Testing OTP verification with invalid OTP...");
        try {
            const verifyOTPResponse = await axios.post(
                `${BASE_URL}/auth/phone/verify-otp`,
                {
                    phone_number: "9876543210",
                    otp: "123456",
                    user_name: "Test User",
                }
            );
            console.log("✅ OTP verified:", verifyOTPResponse.data);
        } catch (error) {
            console.log(
                "❌ Expected error (invalid OTP):",
                error.response?.data?.message || error.message
            );
        }

        // Test 3: Test invalid phone number
        console.log("\n3. Testing invalid phone number...");
        try {
            await axios.post(`${BASE_URL}/auth/phone/send-otp`, {
                phone_number: "1234567890", // Invalid - doesn't start with 6,7,8,9
            });
        } catch (error) {
            console.log(
                "❌ Expected error (invalid phone):",
                error.response?.data?.message || error.message
            );
        }

        // Test 4: Test invalid OTP format
        console.log("\n4. Testing invalid OTP format...");
        try {
            await axios.post(`${BASE_URL}/auth/phone/verify-otp`, {
                phone_number: "9876543210",
                otp: "12345", // Invalid - not 6 digits
            });
        } catch (error) {
            console.log(
                "❌ Expected error (invalid OTP format):",
                error.response?.data?.message || error.message
            );
        }

        console.log("\n🎉 Phone authentication system test completed!");
        console.log(
            "\nNote: Check the server logs for the actual OTP that was generated."
        );
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message);
    }
}

testPhoneAuth();
