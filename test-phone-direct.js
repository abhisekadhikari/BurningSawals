/**
 * Direct test of phone authentication without HTTP server
 */

const { PrismaClient } = require("@prisma/client");

async function testPhoneAuthDirect() {
    const prisma = new PrismaClient();

    try {
        console.log("🧪 Testing Phone Authentication Directly...\n");

        // Test phone number validation
        const {
            isValidIndianPhoneNumber,
            generateOTP,
            normalizePhoneNumber,
        } = require("./dist/utils/phoneValidation");

        console.log("1. Testing phone number validation...");
        console.log(
            "Valid phone (9876543210):",
            isValidIndianPhoneNumber("9876543210")
        );
        console.log(
            "Invalid phone (1234567890):",
            isValidIndianPhoneNumber("1234567890")
        );
        console.log(
            "Invalid phone (12345):",
            isValidIndianPhoneNumber("12345")
        );

        console.log("\n2. Testing phone number normalization...");
        console.log(
            "Normalize +919876543210:",
            normalizePhoneNumber("+919876543210")
        );
        console.log(
            "Normalize 09876543210:",
            normalizePhoneNumber("09876543210")
        );
        console.log(
            "Normalize 9876543210:",
            normalizePhoneNumber("9876543210")
        );

        console.log("\n3. Testing OTP generation...");
        const otp = generateOTP();
        console.log("Generated OTP:", otp);
        console.log("OTP length:", otp.length);

        console.log("\n4. Testing database operations...");

        // Test creating a user with phone number
        const testPhone = "9876543210";
        const testUser = await prisma.users.create({
            data: {
                phone_number: testPhone,
                user_name: "Test Phone User",
                auth_provider: "phone",
                is_phone_verified: true,
            },
        });

        console.log("✅ Created test user:", {
            id: testUser.user_id.toString(),
            phone: testUser.phone_number,
            verified: testUser.is_phone_verified,
        });

        // Test creating an OTP record
        const otpRecord = await prisma.otps.create({
            data: {
                phone_number: testPhone,
                otp_hash: Buffer.from("test_hash", "utf8"),
                salt: Buffer.from("test_salt", "utf8"),
                expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                attempts: 0,
                max_attempts: 5,
            },
        });

        console.log("✅ Created OTP record:", {
            id: otpRecord.otp_id.toString(),
            phone: otpRecord.phone_number,
            expires: otpRecord.expires_at,
        });

        // Test querying user by phone
        const foundUser = await prisma.users.findUnique({
            where: { phone_number: testPhone },
        });

        console.log("✅ Found user by phone:", foundUser ? "Yes" : "No");

        // Clean up test data
        await prisma.otps.delete({
            where: { otp_id: otpRecord.otp_id },
        });

        await prisma.users.delete({
            where: { user_id: testUser.user_id },
        });

        console.log("✅ Cleaned up test data");

        console.log(
            "\n🎉 Phone authentication system test completed successfully!"
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testPhoneAuthDirect();
