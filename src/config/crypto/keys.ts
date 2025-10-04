// Dynamic import for jose (ES module)
(async () => {
    const jose = await eval('import("jose")');
    const { generateKeyPair, exportJWK } = jose;

    // Make the keys extractable so exportJWK can serialize them
    const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256", {
        modulusLength: 2048,
        extractable: true,
    });

    const pubJwk = await exportJWK(publicKey);
    const privJwk = await exportJWK(privateKey);

    // optional: add a key id for rotation
    pubJwk.kid = privJwk.kid = "key-2025-08";

    console.log("JWT_ENC_PUBLIC_JWK=" + JSON.stringify(pubJwk));
    console.log("JWT_ENC_PRIVATE_JWK=" + JSON.stringify(privJwk));
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
