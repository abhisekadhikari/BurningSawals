import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // from Google console
            callbackURL: "/auth/google/callback",
        },
        function (
            accessToken: string,
            refreshToken: string,
            profile: Profile,
            done: Function
        ) {
            return done(null, profile);
        }
    )
);
