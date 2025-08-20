import { z } from "zod";
import { getCalendarClient } from "../googleAuth";

// Common types
export type McpTextResponse = {
  content: Array<{ type: "text"; text: string }>;
};

// -------------------- list_calendars --------------------
export const listCalendarsParams = {};

export const listCalendarsSchema = z.object(listCalendarsParams);
export type ListCalendarsInput = z.infer<typeof listCalendarsSchema>;

export async function listCalendars(): Promise<McpTextResponse> {
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

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
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
