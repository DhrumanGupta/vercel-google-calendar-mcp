import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!process.env.MCP_AUTH_SECRET) return undefined;

  if (bearerToken === process.env.MCP_AUTH_SECRET) {
    return {
      token: bearerToken,
      scopes: [],
      clientId: "self",
    };
  }

  return undefined;
}
