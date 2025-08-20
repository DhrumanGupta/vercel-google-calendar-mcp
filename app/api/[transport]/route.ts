import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyToken } from "../../../lib/auth";
import {
  createEvent,
  createEventParams,
  currentTimeParams,
  deleteEvent,
  deleteEventParams,
  // Legacy compatibility
  editEvent,
  editEventParams,
  getCurrentTime,
  // Free/busy
  getFreebusy,
  getFreebusyParams,
  // Calendar management
  listCalendars,
  listCalendarsParams,
  // Event management
  listEvents,
  listEventsParams,
  searchEvents,
  searchEventsParams,
  updateEvent,
  updateEventParams,
} from "../../../lib/calendarTools/index";

const baseHandler = createMcpHandler(
  (server) => {
    // Calendar management tools
    server.tool(
      "list_calendars",
      "List all available Google Calendars",
      listCalendarsParams,
      listCalendars
    );

    // Event management tools
    server.tool(
      "list_events",
      "List Google Calendar events from a specific calendar and date range",
      listEventsParams,
      listEvents
    );
    server.tool(
      "search_events",
      "Search for Google Calendar events by text query",
      searchEventsParams,
      searchEvents
    );
    server.tool(
      "create_event",
      "Create a new Google Calendar event",
      createEventParams,
      createEvent
    );
    server.tool(
      "update_event",
      "Update an existing Google Calendar event",
      updateEventParams,
      updateEvent
    );
    server.tool(
      "delete_event",
      "Delete a Google Calendar event",
      deleteEventParams,
      deleteEvent
    );

    // Free/busy tools
    server.tool(
      "get_freebusy",
      "Get free/busy information for one or more calendars",
      getFreebusyParams,
      getFreebusy
    );

    // Utility tools
    server.tool(
      "get_current_time",
      "Get current time and timezone",
      currentTimeParams,
      getCurrentTime
    );

    // Legacy compatibility (keep for existing clients)
    server.tool(
      "edit_event",
      "Edit a Google Calendar event (deprecated - use update_event)",
      editEventParams,
      editEvent
    );
  },
  {
    serverInfo: {
      name: "Google Calendar",
      version: "0.0.2",
    },
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
