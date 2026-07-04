import { Platform, Alert } from "react-native";
import type { Fixture } from "@workspace/api-client-react";

function buildEventTitle(fixture: Fixture): string {
  return `🏏 vs ${fixture.opponent}${fixture.playingFor ? ` (${fixture.playingFor})` : ""}`;
}

function buildEventNotes(fixture: Fixture): string {
  const lines: string[] = ["CricVault fixture"];
  if (fixture.series) lines.push(`Series: ${fixture.series}`);
  if (fixture.matchType) lines.push(`Format: ${fixture.matchType}`);
  if (fixture.notes) lines.push(`Notes: ${fixture.notes}`);
  return lines.join("\n");
}

function parseEventDates(fixture: Fixture): { start: Date; end: Date } {
  const [year, month, day] = fixture.date.split("-").map(Number);
  let hour = 11, minute = 0;
  if (fixture.time) {
    const [h, m] = fixture.time.split(":").map(Number);
    if (!isNaN(h)) hour = h;
    if (!isNaN(m)) minute = m;
  }
  const start = new Date(year, month - 1, day, hour, minute, 0);
  const end   = new Date(year, month - 1, day, hour + 4, minute, 0);
  return { start, end };
}

// ── Native export (iOS + Android) ────────────────────────────────────────────

async function exportToNativeCalendar(fixture: Fixture): Promise<void> {
  const Calendar = await import("expo-calendar");

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission denied", "CricVault needs calendar access to add fixtures.");
    return;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable  = calendars.filter((c) => c.allowsModifications);

  let calId: string;
  if (Platform.OS === "ios") {
    const def = await Calendar.getDefaultCalendarAsync();
    calId = def?.id ?? writable[0]?.id;
  } else {
    calId = writable.find((c) => c.isPrimary)?.id ?? writable[0]?.id;
  }

  if (!calId) {
    Alert.alert("No writable calendar", "Could not find a calendar to save the fixture to.");
    return;
  }

  const { start, end } = parseEventDates(fixture);

  await Calendar.createEventAsync(calId, {
    title:    buildEventTitle(fixture),
    location: fixture.venue ?? undefined,
    notes:    buildEventNotes(fixture),
    startDate: start,
    endDate:   end,
    alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }],
  });

  Alert.alert("Added to calendar ✓", `"${buildEventTitle(fixture)}" has been saved to your calendar.`);
}

// ── Web export (ICS download) ─────────────────────────────────────────────────

function toICSDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function buildICS(fixtures: Fixture[]): string {
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@cricvault`;
  const events = fixtures.map((f) => {
    const { start, end } = parseEventDates(f);
    return [
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `SUMMARY:${buildEventTitle(f)}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      f.venue    ? `LOCATION:${f.venue}` : "",
      `DESCRIPTION:${buildEventNotes(f).replace(/\n/g, "\\n")}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT60M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Match reminder",
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT1440M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Match tomorrow",
      "END:VALARM",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CricVault//Fixtures//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function exportFixtureToCalendar(fixture: Fixture): Promise<void> {
  if (Platform.OS === "web") {
    const ics = buildICS([fixture]);
    downloadICS(ics, `cricvault-${fixture.opponent.replace(/\s+/g, "-").toLowerCase()}.ics`);
    return;
  }
  await exportToNativeCalendar(fixture);
}

export async function exportAllFixturesToCalendar(fixtures: Fixture[]): Promise<void> {
  if (fixtures.length === 0) {
    Alert.alert("No fixtures", "Add some fixtures first.");
    return;
  }

  if (Platform.OS === "web") {
    const ics = buildICS(fixtures);
    downloadICS(ics, "cricvault-fixtures.ics");
    return;
  }

  for (const f of fixtures) {
    await exportToNativeCalendar(f);
  }
}
