// Re-export all calendar tools and their types

// Events module
export {
  createEvent,
  createEventParams,
  createEventSchema,
  currentTimeParams,
  deleteEvent,
  deleteEventParams,
  deleteEventSchema,
  getCurrentTime,
  // Event management functions
  listEvents,
  // Event parameter schemas
  listEventsParams,
  listEventsSchema,
  searchEvents,
  searchEventsParams,
  searchEventsSchema,
  updateEvent,
  updateEventParams,
  updateEventSchema,
  type CreateEventInput,
  type DeleteEventInput,
  // Event types
  type ListEventsInput,
  type SearchEventsInput,
  type UpdateEventInput,
} from "./events";

// Calendars module
export {
  // Calendar management functions
  listCalendars,

  // Calendar parameter schemas
  listCalendarsParams,
  listCalendarsSchema,

  // Calendar types
  type ListCalendarsInput,
} from "./calendars";

// Freebusy module
export {
  // Freebusy functions
  getFreebusy,

  // Freebusy parameter schemas
  getFreebusyParams,
  getFreebusySchema,

  // Freebusy types
  type GetFreebusyInput,
} from "./freebusy";

// Common types
export type {
  CalendarEvent,
  CalendarFreeBusy,
  CalendarListEntry,
  FreeBusyInterval,
  McpResponse,
} from "./types";

// Legacy exports for backward compatibility with existing route.ts
// These map to the new function names
export {
  updateEvent as editEvent,
  updateEventParams as editEventParams,
  updateEventSchema as editEventSchema,
} from "./events";
export type { UpdateEventInput as EditEventInput } from "./events";
