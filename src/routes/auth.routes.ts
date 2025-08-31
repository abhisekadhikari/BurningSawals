import { Router } from "express";
import passport from "passport";

const authRouter = Router();

/**
 * Step 1: Start Google OAuth
 *   - Scopes: profile + email
 */
authRouter.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * Step 2: Handle Google callback
 *   - If success: create JWT, encrypt it, and send to client
 *   - If failure: redirect to home (or error page)
 */
authRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    async (req, res) => {
        try {
            const user = req.user as any; // passport attaches user from verify()

            // --- return as JSON ---
            return res.json({ token: user.token });

            // redirect into your SPA/dashboard
            // res.redirect("/app");
        } catch (err) {
            console.error("Google callback error:", err);
            res.redirect("/?error=auth_failed");
        }
    }
);

authRouter.route("/auth/signin");

export default authRouter;
