import prisma from '../lib/prisma';

export async function getFormattedEvents() {
  const rawEvents = await prisma.event.findMany({
    orderBy: { date: 'asc' },
  });

  return rawEvents.map(event => ({
    ...event,
    date: new Date(event.date).toISOString().split('T')[0],
    time: new Date(event.time).toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }));
}