import { z } from "zod";
import { getCalendarClient } from "./googleAuth";

// -------------------- list_events --------------------
export const listEventsParams = {
  calendarId: z
    .string()
    .optional()
    .describe("Calendar ID, defaults to primary"),
  timeMin: z
    .string()
    .optional()
    .describe(
      "RFC3339 start datetime; events from this time forward are returned"
    ),
  timeMax: z
    .string()
    .optional()
    .describe("RFC3339 end datetime; events before this time are returned"),
  maxResults: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of events to return"),
};

export const listEventsSchema = z.object(listEventsParams);
export type ListEventsInput = z.infer<typeof listEventsSchema>;

export async function listEvents({
  calendarId = "primary",
  timeMin,
  timeMax,
  maxResults,
}: ListEventsInput): Promise<any> {
  const calendar = getCalendarClient();

  const res = await calendar.events.list({
    calendarId,
    singleEvents: true,
    orderBy: "startTime",
    timeMin,
    timeMax,
    maxResults: maxResults ?? undefined,
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
};

export const createEventSchema = z.object(createEventParams);
export type CreateEventInput = z.infer<typeof createEventSchema>;

export async function createEvent({
  calendarId = "primary",
  summary,
  description,
  start,
  end,
}: CreateEventInput): Promise<any> {
  const calendar = getCalendarClient();

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
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
