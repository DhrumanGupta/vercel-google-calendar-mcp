import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";

const handler = protectedResourceHandler({ authServerUrls: [] });

export { handler as GET, metadataCorsOptionsRequestHandler as OPTIONS };
