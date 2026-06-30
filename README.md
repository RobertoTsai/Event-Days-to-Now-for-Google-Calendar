# Event Days to Now for Google Calendar

Enhance your Google Calendar experience with Date Prefixer! This extension adds compact time indicators to your events, making it easier to see how close each appointment is at a glance.

Current version: **1.0.14**

## Install
Chrome Web Store: 
https://chromewebstore.google.com/detail/hceoajkodhbjkoiopgehogkfplgpmpdj

## Key Features:

1. **Dynamic Date Prefixes**: Automatically adds time indicators to your Google Calendar events.
    - For future events: Shows how many days or hours until the event.
    - For past events: Displays how many days have passed since the event occurred.
2. **Intelligent Time Display**:
    - Events within 24 hours: Shown in hours (e.g., 5h)
    - Events beyond 24 hours: Displayed in days (e.g., 3d)
    - Long-term events: Option to display in years and days (e.g., 1y5d)
3. **Customizable Settings**:
    - Toggle the display of years for long-term events
    - Easily accessible settings through the extension icon
4. **Seamless Integration**:
    - Works directly within your Google Calendar interface
    - No need to navigate away from your calendar view
    - Uses CSS-based labels to reduce layout movement when Google Calendar refreshes event elements
5. **Real-time Updates**:
    - Prefixes update automatically as time passes
    - Always shows the most current time difference
6. **User-Friendly Design**:
    - Clean and unobtrusive visual style
    - Doesn't interfere with Google Calendar's existing functionality
7. **Multi-Language Support**:
    - Reads Google Calendar event labels across localized calendar UIs
    - Uses browser locale data for month names instead of hard-coded English-only parsing
    - Includes support for contact birthday events and localized month labels such as Sinhala Gregorian month names
8. **Stable Extension Behavior**:
    - Handles Google Calendar DOM refreshes without repeatedly inserting extra title elements
    - Guards Chrome extension API calls when the extension context is refreshed or invalidated

---

## Release Notes

- **1.0.14**: Integrated update after 1.0.7. Improved localized date parsing beyond the original supported languages, fixed incorrect date detection from nearby calendar DOM metadata, added Sinhala Gregorian month-name handling, changed prefix rendering from inserted spans to CSS-based labels, reduced first-render layout movement, sped up event refresh handling, guarded Chrome API calls to avoid extension context invalidated errors, and kept test files outside the Chrome Web Store upload folder.
- **1.0.7**: Fix contact birthday problems.
- **1.0.6**: Change extension name & modify date tag style.
- **1.0.5**: Prefix label display adjustment.
- **1.0.4**: Fixed the problem of not displaying prefixes for part-time events when viewing "Days" or "Weeks".
- **1.0.3**: Optimize the appearance of the prefix.
- **1.0.2**: Change prefix style.

---

Note: This extension is not affiliated with or endorsed by Google. It is a third-party tool designed to enhance the functionality of Google Calendar.
