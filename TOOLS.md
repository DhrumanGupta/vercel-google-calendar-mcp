# Google Calendar MCP Tool Suite

This folder exposes a **typed, modular set of tools** that can be registered with the `@modelcontextprotocol/sdk` runtime. Every tool returns **structured JSON** under a `data` field for programmatic consumption **and** a brief natural-language summary under `content` for LLM / human readability.

## Shared response envelope

```ts
interface McpResponse<T> {
  content: Array<{ type: "text"; text: string }>;
  data?: T; // Machine-readable payload
}
```

## Tool catalogue

| Tool name            | Description                                                  | Params Schema                                                                           | `data` structure                                                  |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **list_calendars**   | Lists all calendars the authorised account can access        | `{}`                                                                                    | `{ calendars: CalendarListEntry[] }`                              |
| **list_events**      | Lists events from a calendar, optionally within a date range | `{ calendarId?, start?, end?, maxResults?, timeZone? }`                                 | `{ calendarId, events: CalendarEvent[] }`                         |
| **search_events**    | Full-text search over event titles / descriptions            | `{ calendarId?, query, maxResults?, timeZone? }`                                        | `{ calendarId, query, events: CalendarEvent[] }`                  |
| **create_event**     | Creates a new event                                          | `{ calendarId?, summary, description?, start, end, timeZone?, attendees? }`             | `CalendarEvent`                                                   |
| **update_event**     | Updates an existing event                                    | `{ calendarId?, eventId, summary?, description?, start?, end?, timeZone?, attendees? }` | `CalendarEvent`                                                   |
| **delete_event**     | Deletes an event                                             | `{ calendarId?, eventId }`                                                              | `{ calendarId, eventId, deleted: true }`                          |
| **get_freebusy**     | Returns busy intervals for one or more calendars             | `{ calendarIds, start, end, timeZone? }`                                                | `{ range: {start,end}, timeZone, calendars: CalendarFreeBusy[] }` |
| **get_current_time** | Utility to get the server time & timezone                    | `{}`                                                                                    | `{ iso, timeZone }`                                               |

### Relevant Types

- `CalendarEvent` – simplified subset of Google’s event resource
- `CalendarListEntry` – simplified calendar list entry
- `CalendarFreeBusy` – busy blocks for a calendar

Refer to `types.ts` for full definitions.

## Extending / Modifying

1. Add new param schemas via **Zod**.
2. Return `{ content, data }` with `data` being a pure-JSON value.
3. Export new functions in `index.ts` and register them in `route.ts`.

---

Generated automatically by the dev-tools script. Keep this file up-to-date when adding new tools.
