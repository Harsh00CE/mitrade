import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import dotenv from "dotenv";

dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://192.168.0.103:5173/dashboard",
      passReqToCallback: true,
    },
    (request, accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);
