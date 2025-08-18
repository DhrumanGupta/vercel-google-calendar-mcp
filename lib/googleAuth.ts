import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export function getOAuth2Client(): OAuth2Client {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth environment variables");
  }

  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  if (GOOGLE_REFRESH_TOKEN) {
    client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  }

  return client;
}

export function getCalendarClient() {
  const auth = getOAuth2Client();
  return google.calendar({ version: "v3", auth });
}
