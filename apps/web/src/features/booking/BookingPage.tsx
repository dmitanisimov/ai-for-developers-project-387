import { useEffect, useState, type FormEvent } from "react";
import { api, getErrorMessage } from "../../api/client";
import type { EventType, Owner, Slot } from "../../api/types";
import { SiteHeader } from "../../components/SiteHeader";
import { toDateKey, toDateKeyInTimeZone, today } from "../../lib/date";
import { navigate } from "../../lib/router";
import { BookingTimeStep } from "./BookingTimeStep";
import { EventTypeStep } from "./EventTypeStep";

const SLOT_REFRESH_INTERVAL_MS = 30_000;

export const BookingPage = () => {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [monthSlotCounts, setMonthSlotCounts] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setAllSlots([]);
    setSlots([]);
    setMonthSlotCounts({});

    Promise.all([api.getOwner(), api.getEventTypes()])
      .then(([ownerResponse, eventTypesResponse]) => {
        if (!active) return;
        setOwner(ownerResponse.owner);
        setSelectedDate(today(ownerResponse.owner.timezone));
        setEventTypes(eventTypesResponse.eventTypes);
      })
      .catch((requestError: unknown) => active && setError(getErrorMessage(requestError)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventType) return;

    let active = true;
    const loadSlots = async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const slotsResponse = await api.getEventTypeSlots(selectedEventType.id, true);
        if (!active) return;
        setAllSlots(slotsResponse.slots);
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (active && showLoader) {
          setLoading(false);
        }
      }
    };

    const refreshSlots = () => {
      if (document.visibilityState === "visible") {
        void loadSlots();
      }
    };

    setError("");
    void loadSlots(true);

    const refreshInterval = window.setInterval(refreshSlots, SLOT_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshSlots);
    document.addEventListener("visibilitychange", refreshSlots);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshSlots);
      document.removeEventListener("visibilitychange", refreshSlots);
    };
  }, [selectedEventType]);

  useEffect(() => {
    const ownerTimeZone = owner?.timezone;
    const counts = allSlots.reduce<Record<string, number>>((accumulator, slot) => {
      if (slot.status !== "available") return accumulator;

      const dateKey = ownerTimeZone ? toDateKeyInTimeZone(new Date(slot.startAt), ownerTimeZone) : toDateKey(new Date(slot.startAt));
      accumulator[dateKey] = (accumulator[dateKey] || 0) + 1;
      return accumulator;
    }, {});

    const nextSlots = allSlots.filter((slot) => (ownerTimeZone ? toDateKeyInTimeZone(new Date(slot.startAt), ownerTimeZone) : toDateKey(new Date(slot.startAt))) === selectedDate);

    setMonthSlotCounts(counts);
    setSlots(nextSlots);
    setSelectedSlot((current) => (current && nextSlots.some((slot) => slot.startAt === current.startAt && slot.status !== "booked") ? current : null));
  }, [allSlots, owner?.timezone, selectedDate]);

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedEventType || !selectedSlot) {
      setError("Выберите слот");
      return;
    }

    try {
      setError("");
      const response = await api.createBooking({ eventTypeId: selectedEventType.id, guestName, guestEmail, guestNotes, startAt: selectedSlot.startAt });
      navigate(`/success/${response.booking.id}`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="booking-page">
      <SiteHeader
        onBookClick={() => {
          setSelectedEventType(null);
          setSelectedSlot(null);
          setAllSlots([]);
        }}
      />
      {!selectedEventType ? (
        <EventTypeStep error={error} eventTypes={eventTypes} owner={owner} onSelectEventType={setSelectedEventType} />
      ) : (
        <BookingTimeStep
          error={error}
          guestEmail={guestEmail}
          guestName={guestName}
          guestNotes={guestNotes}
          loading={loading}
          monthSlotCounts={monthSlotCounts}
          onBack={() => {
            if (selectedSlot) {
              setSelectedSlot(null);
            } else {
              setSelectedEventType(null);
            }
          }}
          onSelectDate={setSelectedDate}
          onSelectSlot={setSelectedSlot}
          onSubmit={submitBooking}
          owner={owner}
          selectedDate={selectedDate}
          selectedEventType={selectedEventType}
          selectedSlot={selectedSlot}
          setGuestEmail={setGuestEmail}
          setGuestName={setGuestName}
          setGuestNotes={setGuestNotes}
          slots={slots}
        />
      )}
    </main>
  );
};
