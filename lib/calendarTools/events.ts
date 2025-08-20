import { z } from "zod";
import { getCalendarClient } from "../googleAuth";

// Common types
export type McpTextResponse = {
  content: Array<{ type: "text"; text: string }>;
};

// -------------------- Helper functions --------------------

/** Private helper to resolve calendar ID */
function resolveCalendarId(calendarId?: string): string {
  return calendarId || "primary";
}

/** Private helper to resolve timezone for a calendar */
async function resolveTimeZone(
  calendarId: string,
  timeZone?: string
): Promise<string> {
  if (timeZone) return timeZone;

  const calendar = getCalendarClient();
  const calRes = await calendar.calendars.get({ calendarId });
  return calRes.data.timeZone || "UTC";
}

/** Private helper to format event for display */
function formatEventForDisplay(event: any): string {
  const start = event.start?.dateTime || event.start?.date || "No start time";
  const summary = event.summary || "No title";
  const id = event.id || "no-id";
  return `${start} → ${summary} (ID: ${id})`;
}

// -------------------- list_events --------------------
export const listEventsParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  start: z
    .string()
    .optional()
    .describe("RFC3339 start datetime - if omitted, uses current time"),
  end: z
    .string()
    .optional()
    .describe("RFC3339 end datetime - if omitted, uses start + 30 days"),
  maxResults: z
    .number()
    .int()
    .positive()
    .max(2500)
    .optional()
    .describe("Maximum number of events to return (max 2500)"),
  timeZone: z
    .string()
    .optional()
    .describe("IANA timezone; defaults to calendar's timezone"),
};

export const listEventsSchema = z.object(listEventsParams);
export type ListEventsInput = z.infer<typeof listEventsSchema>;

export async function listEvents({
  calendarId,
  start,
  end,
  maxResults,
  timeZone,
}: ListEventsInput): Promise<McpTextResponse> {
  try {
    const resolvedCalendarId = resolveCalendarId(calendarId);
    const calendar = getCalendarClient();

    // Default time range: now to 30 days from now
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const timeMin = start || now.toISOString();
    const timeMax = end || defaultEnd.toISOString();

    // Resolve timezone
    const tz = await resolveTimeZone(resolvedCalendarId, timeZone);

    const res = await calendar.events.list({
      calendarId: resolvedCalendarId,
      singleEvents: true,
      orderBy: "startTime",
      timeMin,
      timeMax,
      maxResults: maxResults ?? undefined,
      timeZone: tz,
    });

    const events = res.data.items ?? [];
    const text =
      events.length === 0
        ? `No events found in calendar '${resolvedCalendarId}' from ${timeMin} to ${timeMax}`
        : `Found ${
            events.length
          } events in calendar '${resolvedCalendarId}':\n\n${events
            .map(formatEventForDisplay)
            .join("\n")}`;

    return { content: [{ type: "text", text }] };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown error occurred";
    if (error?.code === 404) {
      return {
        content: [{ type: "text", text: `Calendar not found: ${calendarId}` }],
      };
    }
    if (error?.code === 401 || error?.code === 403) {
      return {
        content: [
          {
            type: "text",
            text: "Unauthorized - check your Google Calendar permissions",
          },
        ],
      };
    }
    throw new Error(`Failed to list events: ${errorMsg}`);
  }
}

// -------------------- search_events --------------------
export const searchEventsParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  query: z
    .string()
    .min(1)
    .describe("Text to search for in event titles, descriptions, etc."),
  maxResults: z
    .number()
    .int()
    .positive()
    .max(2500)
    .optional()
    .describe("Maximum number of events to return (max 2500)"),
  timeZone: z
    .string()
    .optional()
    .describe("IANA timezone; defaults to calendar's timezone"),
};

export const searchEventsSchema = z.object(searchEventsParams);
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;

export async function searchEvents({
  calendarId,
  query,
  maxResults,
  timeZone,
}: SearchEventsInput): Promise<McpTextResponse> {
  try {
    const resolvedCalendarId = resolveCalendarId(calendarId);
    const calendar = getCalendarClient();

    // Resolve timezone
    const tz = await resolveTimeZone(resolvedCalendarId, timeZone);

    const res = await calendar.events.list({
      calendarId: resolvedCalendarId,
      q: query,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: maxResults ?? undefined,
      timeZone: tz,
    });

    const events = res.data.items ?? [];
    const text =
      events.length === 0
        ? `No events found matching query "${query}" in calendar '${resolvedCalendarId}'`
        : `Found ${
            events.length
          } events matching "${query}" in calendar '${resolvedCalendarId}':\n\n${events
            .map(formatEventForDisplay)
            .join("\n")}`;

    return { content: [{ type: "text", text }] };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown error occurred";
    if (error?.code === 404) {
      return {
        content: [{ type: "text", text: `Calendar not found: ${calendarId}` }],
      };
    }
    if (error?.code === 401 || error?.code === 403) {
      return {
        content: [
          {
            type: "text",
            text: "Unauthorized - check your Google Calendar permissions",
          },
        ],
      };
    }
    throw new Error(`Failed to search events: ${errorMsg}`);
  }
}

// -------------------- create_event --------------------
export const createEventParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  summary: z.string().min(1).describe("Event title/summary"),
  description: z.string().optional().describe("Event description"),
  start: z.string().describe("RFC3339 start datetime"),
  end: z.string().describe("RFC3339 end datetime"),
  timeZone: z
    .string()
    .optional()
    .describe("IANA timezone; defaults to calendar's timezone"),
  attendees: z
    .array(z.string().email())
    .optional()
    .describe("Email addresses to invite to the event"),
};

export const createEventSchema = z.object(createEventParams).refine(
  (data) => {
    // Validate start < end
    const startTime = new Date(data.start);
    const endTime = new Date(data.end);
    return startTime < endTime;
  },
  { message: "Start time must be before end time" }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;

export async function createEvent({
  calendarId,
  summary,
  description,
  start,
  end,
  timeZone,
  attendees,
}: CreateEventInput): Promise<McpTextResponse> {
  try {
    const resolvedCalendarId = resolveCalendarId(calendarId);
    const calendar = getCalendarClient();

    // Resolve timezone
    const tz = await resolveTimeZone(resolvedCalendarId, timeZone);

    const res = await calendar.events.insert({
      calendarId: resolvedCalendarId,
      requestBody: {
        summary,
        description,
        start: { dateTime: start, timeZone: tz },
        end: { dateTime: end, timeZone: tz },
        ...(attendees && attendees.length
          ? { attendees: attendees.map((email) => ({ email })) }
          : {}),
      },
    });

    const eventLink = res.data.htmlLink || res.data.id || "unknown";
    return {
      content: [
        {
          type: "text",
          text: `Event created successfully: "${summary}"\nEvent link: ${eventLink}`,
        },
      ],
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown error occurred";
    if (error?.code === 404) {
      return {
        content: [{ type: "text", text: `Calendar not found: ${calendarId}` }],
      };
    }
    if (error?.code === 401 || error?.code === 403) {
      return {
        content: [
          {
            type: "text",
            text: "Unauthorized - check your Google Calendar permissions",
          },
        ],
      };
    }
    throw new Error(`Failed to create event: ${errorMsg}`);
  }
}

// -------------------- update_event (was edit_event) --------------------
export const updateEventParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  eventId: z.string().min(1).describe("ID of the calendar event to update"),
  summary: z.string().optional().describe("New event title/summary"),
  description: z.string().optional().describe("New event description"),
  start: z.string().optional().describe("RFC3339 start datetime"),
  end: z.string().optional().describe("RFC3339 end datetime"),
  timeZone: z
    .string()
    .optional()
    .describe("IANA timezone; defaults to calendar's timezone"),
  attendees: z
    .array(z.string().email())
    .optional()
    .describe("Email addresses to invite to the event"),
};

export const updateEventSchema = z
  .object(updateEventParams)
  .refine(
    (data) =>
      data.summary ||
      data.description !== undefined ||
      data.start ||
      data.end ||
      data.attendees ||
      data.timeZone,
    { message: "At least one field to update must be provided" }
  )
  .refine(
    (data) => {
      // Validate start < end if both provided
      if (data.start && data.end) {
        const startTime = new Date(data.start);
        const endTime = new Date(data.end);
        return startTime < endTime;
      }
      return true;
    },
    { message: "Start time must be before end time" }
  );

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export async function updateEvent({
  calendarId,
  eventId,
  summary,
  description,
  start,
  end,
  timeZone,
  attendees,
}: UpdateEventInput): Promise<McpTextResponse> {
  try {
    const resolvedCalendarId = resolveCalendarId(calendarId);
    const calendar = getCalendarClient();

    // Resolve timezone if we have start/end times
    let tz = timeZone;
    if (!tz && (start || end)) {
      tz = await resolveTimeZone(resolvedCalendarId, timeZone);
    }

    const requestBody: Record<string, any> = {};
    if (summary !== undefined) requestBody.summary = summary;
    if (description !== undefined) requestBody.description = description;
    if (start !== undefined)
      requestBody.start = { dateTime: start, timeZone: tz };
    if (end !== undefined) requestBody.end = { dateTime: end, timeZone: tz };
    if (attendees !== undefined) {
      requestBody.attendees = attendees.map((email) => ({ email }));
    }

    const res = await calendar.events.patch({
      calendarId: resolvedCalendarId,
      eventId,
      requestBody,
    });

    const eventLink = res.data.htmlLink || res.data.id || eventId;
    return {
      content: [
        {
          type: "text",
          text: `Event updated successfully: "${
            res.data.summary || summary
          }"\nEvent link: ${eventLink}`,
        },
      ],
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown error occurred";
    if (error?.code === 404) {
      return {
        content: [
          {
            type: "text",
            text: `Event or calendar not found: ${eventId} in ${calendarId}`,
          },
        ],
      };
    }
    if (error?.code === 401 || error?.code === 403) {
      return {
        content: [
          {
            type: "text",
            text: "Unauthorized - check your Google Calendar permissions",
          },
        ],
      };
    }
    throw new Error(`Failed to update event: ${errorMsg}`);
  }
}

// -------------------- delete_event --------------------
export const deleteEventParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  eventId: z.string().min(1).describe("ID of the calendar event to delete"),
};

export const deleteEventSchema = z.object(deleteEventParams);
export type DeleteEventInput = z.infer<typeof deleteEventSchema>;

export async function deleteEvent({
  calendarId,
  eventId,
}: DeleteEventInput): Promise<McpTextResponse> {
  try {
    const resolvedCalendarId = resolveCalendarId(calendarId);
    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: resolvedCalendarId,
      eventId,
    });

    return {
      content: [
        {
          type: "text",
          text: `Event deleted successfully: ${eventId} from calendar '${resolvedCalendarId}'`,
        },
      ],
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown error occurred";
    if (error?.code === 404) {
      return {
        content: [
          {
            type: "text",
            text: `Event or calendar not found: ${eventId} in ${calendarId}`,
          },
        ],
      };
    }
    if (error?.code === 401 || error?.code === 403) {
      return {
        content: [
          {
            type: "text",
            text: "Unauthorized - check your Google Calendar permissions",
          },
        ],
      };
    }
    throw new Error(`Failed to delete event: ${errorMsg}`);
  }
}

// -------------------- get_current_time --------------------
export const currentTimeParams = {};

export async function getCurrentTime(): Promise<McpTextResponse> {
  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    content: [
      {
        type: "text",
        text: `Current time: ${now.toISOString()} (${tz})`,
      },
    ],
  };
}
