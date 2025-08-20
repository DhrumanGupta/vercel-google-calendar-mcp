import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyToken } from "../../../lib/auth";
import {
  createEvent,
  createEventParams,
  currentTimeParams,
  editEvent,
  editEventParams,
  getCurrentTime,
  listEvents,
  listEventsParams,
} from "../../../lib/calendarTools";

const baseHandler = createMcpHandler(
  (server) => {
    server.tool(
      "list_events",
      "List Google Calendar events",
      listEventsParams,
      listEvents
    );
    server.tool(
      "create_event",
      "Create a Google Calendar event",
      createEventParams,
      createEvent
    );
    server.tool(
      "edit_event",
      "Edit a Google Calendar event",
      editEventParams,
      editEvent
    );
    server.tool(
      "get_current_time",
      "Get current time and timezone",
      currentTimeParams,
      getCurrentTime
    );
  },
  {
    // Optional server options can be placed here
  },
  {
    // Adapter options
    basePath: "/api",
    redisUrl: process.env.REDIS_URL,
    verboseLogs: true,
    maxDuration: 60,
  }
);

// Require Bearer token matching MCP_AUTH_SECRET
const handler = withMcpAuth(baseHandler, verifyToken, { required: true });

export { handler as GET, handler as POST };
