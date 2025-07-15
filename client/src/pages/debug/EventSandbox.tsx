import React from "react";
import { LogEventArguments, useEvent } from "hooks/event/useEvent";
import { EventHydrated } from "demos-server";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { useToast } from "components/toast";
import { PrimaryButton } from "components/button";
import { ALL_EVENT_TYPE_IDS } from "hooks/event/eventTypes";

const EventList = ({events}: {events: EventHydrated[]}) => {
  return (
    <div className="border boder-brand p-2">
      <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
      <ul className="space-y-2">
        {events.map((event: EventHydrated) => (
          <li key={event.id} className="p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-blue-600">{event.eventType.id}</strong>
                <span className="text-gray-500 ml-2">{event.route}</span>
              </div>
              <span className="text-gray-400 text-sm">{String(event.createdAt)}</span>
            </div>
            {event.eventData && (
              <div className="mt-2 text-sm text-gray-600">
                  Data: {JSON.stringify(event.eventData)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const LogNewEventForm = () => {
  const { logEvent } = useEvent();
  const { showError, showSuccess } = useToast();

  const [eventTypeId, setEventTypeId] = React.useState<string>("PAGE_VIEW");

  const handleLogEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    const logEventInput: LogEventArguments = {
      eventTypeId,
    };

    const result = await logEvent(logEventInput);
    if (result.data?.logEvent.success) {
      showSuccess("Event logged successfully");
    } else {
      showError("Failed to log event: " +  result.data?.logEvent.message || "Unknown error");
    }

  };

  return (
    <form onSubmit={handleLogEvent} className="flex flex-row gap-2 border border-brand p-2">
      <AutoCompleteSelect
        options={ALL_EVENT_TYPE_IDS.map((type) => ({
          label: type,
          value: type,
        }))}
        id="eventType"
        label="Event Type"
        onSelect={(label) => setEventTypeId(label)}
      />

      <PrimaryButton
        type="submit"
      >
          Log Event
      </PrimaryButton>
    </form>
  );
};

export const EventSandbox: React.FC = () => {
  const { getEvents } = useEvent();
  const [events, setEvents] = React.useState<EventHydrated[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await getEvents();
        setEvents(result.data?.events?.slice(0, 20) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch events");
      }
    };
    fetchEvents();
  }, []);

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Event Logging Sandbox</h2>
      <LogNewEventForm />
      <EventList events={events} />
    </div>
  );
};
