# 🎉 Google Calendar MCP Server

Welcome to the **Google Calendar MCP (Model Context Protocol) Server**! This is your friendly bridge between AI assistants and Google Calendar, allowing seamless integration with your calendar data through a standardized protocol.

## ✨ What is this?

This Next.js application serves as an MCP server that exposes Google Calendar operations as tools that AI assistants can use. Whether you want to list your calendars, search for events, create new appointments, or check free/busy times, this server makes it all possible through a simple HTTP API.

## 🚀 Available Tools

### 📅 Calendar Management

- **`list_calendars`** - Discover all your available Google Calendars
- **`get_freebusy`** - Check free/busy times across multiple calendars

### 📝 Event Management

- **`list_events`** - Browse events in a specific calendar and date range
- **`search_events`** - Find events using text search queries
- **`create_event`** - Schedule new calendar events
- **`update_event`** - Modify existing calendar events
- **`delete_event`** - Remove events from your calendar

### 🛠️ Utility Tools

- **`get_current_time`** - Get the current time and timezone

## 🏃‍♂️ Quick Start

1. **Set up Google OAuth credentials**

   - Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials
   - Configure the redirect URI to match your deployment

2. **Configure environment variables**

   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=your_redirect_uri
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   MCP_AUTH_SECRET=your_shared_secret
   REDIS_URL=your_redis_url  # Optional, for multi-step conversations
   ```

3. **Deploy and use**
   - Deploy to Vercel, Netlify, or any Next.js-compatible platform
   - Configure your MCP client with the server endpoint and auth token
   - Start managing your calendar through AI!

## 🔐 Authentication

This server uses:

- **Bearer token authentication** via the `MCP_AUTH_SECRET` environment variable
- **Google OAuth 2.0** with refresh tokens for Calendar API access
- **Optional Redis** for session management in complex conversations

## 🏗️ Architecture

- **Modular design** with separate modules for events, calendars, and free/busy operations
- **Type-safe** with full TypeScript support and Zod validation
- **Error handling** with user-friendly error messages
- **Backward compatibility** maintained with legacy tool names

## 💡 Use Cases

- **AI assistants** can check your availability before scheduling meetings
- **Automated scheduling** based on your calendar patterns
- **Calendar analytics** and insights through AI queries
- **Smart reminders** and event management
- **Cross-platform calendar integration** via MCP protocol

## 🛡️ Security

- All API calls require authentication
- Google Calendar permissions are scoped to necessary operations only
- Environment variables protect sensitive credentials
- Type validation prevents malformed requests

## 📖 Learn More

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Next.js Documentation](https://nextjs.org/)

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests to improve this MCP server.

---

_Made with ❤️ for seamless AI-Calendar integration_
