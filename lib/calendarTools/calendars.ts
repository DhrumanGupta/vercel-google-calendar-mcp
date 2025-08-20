import { z } from "zod";
import { getCalendarClient } from "../googleAuth";
import { CalendarListEntry, McpResponse } from "./types";

// -------------------- list_calendars --------------------
export const listCalendarsParams = {};

export const listCalendarsSchema = z.object(listCalendarsParams);
export type ListCalendarsInput = z.infer<typeof listCalendarsSchema>;

export async function listCalendars(
  _: Record<string, never> = {}
): Promise<McpResponse<{ calendars: CalendarListEntry[] }>> {
  try {
    const calendar = getCalendarClient();

    const res = await calendar.calendarList.list({
      showHidden: false,
      showDeleted: false,
    });

    const calendars = res.data.items ?? [];

    if (calendars.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No calendars found in your account.",
          },
        ],
        data: { calendars: [] },
      };
    }

    // Format calendars for display
    const formattedCalendars = calendars.map((cal) => {
      const id = cal.id || "unknown-id";
      const summary = cal.summary || "Untitled Calendar";
      const description = cal.description ? ` - ${cal.description}` : "";
      const primary = cal.primary ? " (Primary)" : "";
      const accessRole = cal.accessRole ? ` [${cal.accessRole}]` : "";

      return `• ${id}${primary}\n  ${summary}${description}${accessRole}`;
    });

    const text = `Found ${
      calendars.length
    } calendars:\n\n${formattedCalendars.join("\n\n")}`;

    const simplifiedCalendars: CalendarListEntry[] = calendars.map((cal) => ({
      id: cal.id || "",
      summary: cal.summary || "Untitled Calendar",
      description: cal.description || undefined,
      primary: cal.primary || undefined,
      accessRole: cal.accessRole || undefined,
      timeZone: cal.timeZone || undefined,
    }));

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
      data: { calendars: simplifiedCalendars },
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown error occurred";
    if (error?.code === 401 || error?.code === 403) {
      return {
        content: [
          {
            type: "text",
            text: "Unauthorized - check your Google Calendar permissions or refresh token",
          },
        ],
      };
    }
    throw new Error(`Failed to list calendars: ${errorMsg}`);
  }
}
