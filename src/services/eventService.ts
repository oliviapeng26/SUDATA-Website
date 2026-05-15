import prisma from '../lib/prisma';

const EVENT_TIME_ZONE = 'Australia/Sydney';

function toSydneyDateString(value: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const partMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

export async function getFormattedEvents() {
  const rawEvents = await prisma.event.findMany({
    orderBy: { date: 'asc' },
  });

  return rawEvents.map(event => ({
    ...event,
    date: toSydneyDateString(new Date(event.date)),
    time: new Date(event.time).toLocaleTimeString('en-AU', {
      timeZone: EVENT_TIME_ZONE,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }));
}
