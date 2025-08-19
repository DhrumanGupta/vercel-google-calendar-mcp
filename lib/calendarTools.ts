import { z } from "zod";
import { getCalendarClient } from "./googleAuth";

// -------------------- list_events --------------------
export const listEventsParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  start: z
    .string()
    .optional()
    .describe(
      "RFC3339 start datetime (obtain with get_current_time tool if needed)"
    ),
  end: z
    .string()
    .optional()
    .describe(
      "RFC3339 end datetime (obtain with get_current_time tool if needed)"
    ),
  maxResults: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of events to return"),
  timeZone: z
    .string()
    .optional()
    .describe("IANA timezone; defaults to calendar's timezone"),
};

export const listEventsSchema = z.object(listEventsParams);
export type ListEventsInput = z.infer<typeof listEventsSchema>;

export async function listEvents({
  calendarId = "primary",
  start,
  end,
  maxResults,
  timeZone,
}: ListEventsInput): Promise<any> {
  const calendar = getCalendarClient();

  // Determine timezone to use
  let tz = timeZone;
  if (!tz) {
    const calRes = await calendar.calendars.get({ calendarId });
    tz = calRes.data.timeZone;
  }

  const res = await calendar.events.list({
    calendarId,
    singleEvents: true,
    orderBy: "startTime",
    timeMin: start,
    timeMax: end,
    maxResults: maxResults ?? undefined,
    timeZone: tz,
  });

  const events = res.data.items ?? [];
  const text =
    events.length === 0
      ? "No events found."
      : events
          .map((ev) => {
            const start = ev.start?.dateTime || ev.start?.date;
            return `${start} → ${ev.summary}`;
          })
          .join("\n");

  return {
    content: [{ type: "text", text }],
  } as any;
}

// -------------------- create_event --------------------
export const createEventParams = {
  calendarId: z.string().optional(),
  summary: z.string(),
  description: z.string().optional(),
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

export const createEventSchema = z.object(createEventParams);
export type CreateEventInput = z.infer<typeof createEventSchema>;

export async function createEvent({
  calendarId = "primary",
  summary,
  description,
  start,
  end,
  timeZone,
  attendees,
}: CreateEventInput): Promise<any> {
  const calendar = getCalendarClient();

  // Determine timezone to use for the event
  let tz = timeZone;
  if (!tz) {
    const calRes = await calendar.calendars.get({ calendarId });
    tz = calRes.data.timeZone;
  }

  const res = await calendar.events.insert({
    calendarId,
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

  return {
    content: [
      {
        type: "text",
        text: `Event created: ${res.data.htmlLink || res.data.id}`,
      },
    ],
  } as any;
}

// -------------------- edit_event --------------------
export const editEventParams = {
  calendarId: z.string().optional(),
  eventId: z.string().describe("ID of the calendar event to edit"),
  summary: z.string().optional(),
  description: z.string().optional(),
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

export const editEventSchema = z
  .object(editEventParams)
  .refine(
    (data) =>
      data.summary ||
      data.description ||
      data.start ||
      data.end ||
      data.attendees ||
      data.timeZone,
    { message: "At least one field to update must be provided" }
  );

export type EditEventInput = z.infer<typeof editEventSchema>;

export async function editEvent({
  calendarId = "primary",
  eventId,
  summary,
  description,
  start,
  end,
  timeZone,
  attendees,
}: EditEventInput): Promise<any> {
  const calendar = getCalendarClient();

  let tz = timeZone;
  if (!tz && (start || end)) {
    const calRes = await calendar.calendars.get({ calendarId });
    tz = calRes.data.timeZone;
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
    calendarId,
    eventId,
    requestBody,
  });

  return {
    content: [
      {
        type: "text",
        text: `Event updated: ${res.data.htmlLink || res.data.id}`,
      },
    ],
  } as any;
}

// -------------------- get_current_time --------------------
export const currentTimeParams = {};

export async function getCurrentTime(): Promise<any> {
  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    content: [
      {
        type: "text",
        text: `Current time: ${now.toISOString()} (${tz})`,
      },
    ],
  } as any;
}
