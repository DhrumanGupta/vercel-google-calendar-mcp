// New shared types for all calendar tools
export interface McpResponse<T = unknown> {
  [key: string]: unknown; // allow extra properties expected by MCP typings
  // Human-readable summary blocks consumed by LLMs or UI
  content: Array<{ type: "text"; text: string }>;
  // Machine-readable data enabling downstream structured usage
  data?: T;
}

// Convenience event / calendar shapes -------------------------------------
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  timeZone?: string;
  htmlLink?: string;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  timeZone?: string;
}

export interface FreeBusyInterval {
  start: string; // ISO string
  end: string; // ISO string
}

export interface CalendarFreeBusy {
  calendarId: string;
  busy: FreeBusyInterval[];
}
