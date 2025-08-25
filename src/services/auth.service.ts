import passport, { DoneCallback } from "passport";
import { prisma } from "../utils/prisma";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, email: user.email });
});

passport.deserializeUser(
    async (payload: { id: string; email: string }, done) => {
        try {
            const user = await prisma.users.findUnique({
                where: { user_id: +payload.id },
            });
            done(null, user);
        } catch (err) {
            done(err);
        }
    }
);

/**
 * Google OAuth Strategy
 */
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: "/auth/google/callback",
        },
        // verify callback
        async (
            accessToken: string,
            refreshToken: string,
            profile: Profile,
            done: DoneCallback
        ) => {
            try {
                // Prefer typed fields; some providers don't always send _json.email
                const email =
                    profile.emails?.[0]?.value ||
                    // fallback (less reliable)
                    (profile as any)?._json?.email ||
                    null;

                if (!email) {
                    // If email scope is missing or user hid email
                    return done(
                        new Error("No email returned from Google"),
                        undefined
                    );
                }

                const name =
                    profile.displayName ||
                    (profile.name
                        ? [profile.name.givenName, profile.name.familyName]
                              .filter(Boolean)
                              .join(" ")
                        : (profile as any)?._json?.name) ||
                    email;

                // Ensure you have a unique constraint on users.email in Prisma schema
                const dbUser = await prisma.users.upsert({
                    where: { email },
                    update: {
                        // update whatever you want on subsequent logins
                        user_name: name,
                        last_login_at: new Date(),
                    },
                    create: {
                        email,
                        auth_provider: "google",
                        user_name: name,
                        // provider_id: profile.id, // optional but useful
                    },
                });

                return done(null, dbUser);
            } catch (err) {
                return done(err as Error);
            }
        }
    )
);
