import React from "react";
import { useEvent } from "hooks/useEvent";
import { EventHydrated } from "demos-server";

export const EventList: React.FC = () => {
  const { getEvents } = useEvent();
  const [events, setEvents] = React.useState<EventHydrated[]>([]);

  // Fetch events when the component mounts
  React.useEffect(() => {
    const fetchEvents = async () => {
      const result = await getEvents.trigger();
      setEvents(result?.events?.slice(0, 20) || []);
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <h2>Recent Events</h2>
      <ul>
        {events.map((event: EventHydrated) => (
          <li key={event.id}>
            <strong>{event.eventType.id}</strong> - {String(event.createdAt)}
          </li>
        ))}
      </ul>
    </div>
  );
};
