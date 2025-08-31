export default function generateOtp(length = 6) {
    return String(Math.floor(Math.random() * Math.pow(10, length))).padStart(
        length,
        "0"
    );
}
