import { z } from "zod";
import { getCalendarClient } from "../googleAuth";

// Common types
export type McpTextResponse = {
  content: Array<{ type: "text"; text: string }>;
};

// -------------------- get_freebusy --------------------
export const getFreebusyParams = {
  calendarIds: z
    .string()
    .min(1)
    .describe(
      "Comma-separated list of calendar IDs to check for free/busy times"
    ),
  start: z.string().describe("RFC3339 start datetime for the free/busy query"),
  end: z.string().describe("RFC3339 end datetime for the free/busy query"),
  timeZone: z
    .string()
    .optional()
    .describe("IANA timezone for the query; defaults to UTC"),
};

export const getFreebusySchema = z
  .object(getFreebusyParams)
  .refine(
    (data) => {
      // Validate start < end
      const startTime = new Date(data.start);
      const endTime = new Date(data.end);
      return startTime < endTime;
    },
    { message: "Start time must be before end time" }
  )
  .refine(
    (data) => {
      // Validate time range is not too large (max 1 year)
      const startTime = new Date(data.start);
      const endTime = new Date(data.end);
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      return endTime.getTime() - startTime.getTime() <= maxRange;
    },
    { message: "Time range cannot exceed 1 year" }
  );

export type GetFreebusyInput = z.infer<typeof getFreebusySchema>;

/** Private helper to format busy times for display */
function formatBusyTime(busyTime: any): string {
  const start = busyTime.start || "Unknown start";
  const end = busyTime.end || "Unknown end";
  return `  • ${start} → ${end}`;
}

/** Private helper to format a calendar's busy times */
function formatCalendarBusyTimes(calendarId: string, busyTimes: any[]): string {
  if (!busyTimes || busyTimes.length === 0) {
    return `${calendarId}:\n  • Free (no busy times)`;
  }

  const formattedTimes = busyTimes.map(formatBusyTime).join("\n");
  return `${calendarId}:\n${formattedTimes}`;
}

export async function getFreebusy({
  calendarIds,
  start,
  end,
  timeZone = "UTC",
}: GetFreebusyInput): Promise<McpTextResponse> {
  try {
    const calendar = getCalendarClient();

    // Parse calendar IDs from comma-separated string
    const calendarIdList = calendarIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (calendarIdList.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Error: No valid calendar IDs provided. Please provide at least one calendar ID.",
          },
        ],
      };
    }

    // Validate calendar ID count (Google API has limits)
    if (calendarIdList.length > 50) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Too many calendar IDs provided. Maximum is 50 calendars per request.",
          },
        ],
      };
    }

    // Build the request body
    const requestBody = {
      timeMin: start,
      timeMax: end,
      timeZone,
      items: calendarIdList.map((id) => ({ id })),
    };

    const res = await calendar.freebusy.query({
      requestBody,
    });

    const calendars = res.data.calendars || {};

    // Note: Google Calendar API freebusy response doesn't have a top-level errors array
    // Individual calendar errors are handled in the calendar-specific data

    // Format the results
    const calendarResults: string[] = [];

    calendarIdList.forEach((calendarId) => {
      const calendarData = calendars[calendarId];

      if (!calendarData) {
        calendarResults.push(
          `${calendarId}:\n  • Error: Calendar not found or inaccessible`
        );
        return;
      }

      if (calendarData.errors && calendarData.errors.length > 0) {
        const errorMsg = calendarData.errors
          .map((e: any) => e.reason)
          .join(", ");
        calendarResults.push(`${calendarId}:\n  • Error: ${errorMsg}`);
        return;
      }

      const busyTimes = calendarData.busy || [];
      calendarResults.push(formatCalendarBusyTimes(calendarId, busyTimes));
    });

    // Build the final response
    let text = `Free/busy information from ${start} to ${end} (${timeZone}):\n\n`;
    text += calendarResults.join("\n\n");

    // Add summary
    const totalCalendars = calendarIdList.length;
    const successfulCalendars = calendarIdList.filter((id) => {
      const calData = calendars[id];
      return calData && (!calData.errors || calData.errors.length === 0);
    }).length;

    text += `\n\nSummary: Successfully queried ${successfulCalendars}/${totalCalendars} calendars.`;

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
    if (error?.code === 400) {
      return {
        content: [
          {
            type: "text",
            text: `Bad request - check your date formats and calendar IDs: ${errorMsg}`,
          },
        ],
      };
    }
    throw new Error(`Failed to get free/busy information: ${errorMsg}`);
  }
}
