import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface GoogleUser {
  sub: string; // Google user ID
  email: string;
  name: string;
  email_verified: boolean;
}

export const verifyGoogleToken = async (
  idToken: string,
): Promise<GoogleUser | null> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload?.email_verified ||
      !payload.email ||
      !payload.name ||
      !payload.sub
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      email_verified: payload.email_verified,
    };
  } catch (error) {
    console.error("Google token verification error:", error);
    return null;
  }
};
