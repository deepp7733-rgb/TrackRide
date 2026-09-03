import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const client = new OAuth2Client(clientId);

export async function verifyGoogleCredential(credential) {
  if (!clientId) throw new Error("Google authentication is not configured on the server.");
  if (!credential) throw new Error("Missing Google credential.");

  const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) throw new Error("Invalid Google account payload.");

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || null,
  };
}

export function requireBearer(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Sign-in required." });
  }
  // Demo: the frontend stores the Google credential only for the request layer.
  // Production: issue and verify your own short-lived session/JWT here.
  req.googleCredential = header.slice(7);
  next();
}
