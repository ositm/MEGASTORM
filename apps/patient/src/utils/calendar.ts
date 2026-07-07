import { format } from 'date-fns';

type CalendarEvent = {
    title: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
};

export const googleCalendarUrl = (event: CalendarEvent) => {
    const start = format(event.startTime, "yyyyMMdd'T'HHmmss");
    const end = format(event.endTime, "yyyyMMdd'T'HHmmss");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
};

export const outlookCalendarUrl = (event: CalendarEvent) => {
    const start = event.startTime.toISOString();
    const end = event.endTime.toISOString();

    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&startdt=${start}&enddt=${end}`;
};

export const downloadIcs = (event: CalendarEvent) => {
    const start = format(event.startTime, "yyyyMMdd'T'HHmmss");
    const end = format(event.endTime, "yyyyMMdd'T'HHmmss");

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'appointment.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
