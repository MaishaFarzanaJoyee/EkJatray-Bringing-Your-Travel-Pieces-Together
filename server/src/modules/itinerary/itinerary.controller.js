import crypto from "crypto";
import Itinerary from "./itinerary.model.js";

const normalizeString = (value = "") => value.toString().trim();

function toIsoString(date, time = "00:00") {
  const safeDate = normalizeString(date);
  const safeTime = normalizeString(time) || "00:00";

  if (!safeDate) {
    return "";
  }

  const candidate = new Date(`${safeDate}T${safeTime}:00`);
  return Number.isNaN(candidate.getTime()) ? "" : candidate.toISOString();
}

function addHoursToIso(isoString, durationHours = 0) {
  if (!isoString) {
    return "";
  }

  const start = new Date(isoString);
  if (Number.isNaN(start.getTime())) {
    return "";
  }

  start.setMinutes(start.getMinutes() + Math.round(Number(durationHours || 0) * 60));
  return start.toISOString();
}

function addMinutesToIso(isoString, durationMinutes = 0) {
  if (!isoString) {
    return "";
  }

  const start = new Date(isoString);
  if (Number.isNaN(start.getTime())) {
    return "";
  }

  start.setMinutes(start.getMinutes() + Math.round(Number(durationMinutes || 0)));
  return start.toISOString();
}

function buildTransportEntries(transportItems) {
  return transportItems.flatMap((item) => {
    const startIso = toIsoString(item.travelDate, item.departureTime);
    const endIso = startIso
      ? addMinutesToIso(startIso, item.duration || 0)
      : toIsoString(item.travelDate, item.arrivalTime);
    const transportLabel = `${item.modeLabel || "Transport"} | ${item.operator || "Unknown operator"}`;

    return [
      {
        kind: "departure",
        itemType: "transport",
        title: item.title || "Transport departure",
        subtitle: transportLabel,
        destination: item.travelDate || "",
        startsAt: startIso,
        endsAt: endIso,
        isScheduled: Boolean(startIso),
        notes: `Seat ${item.seat || "Any"} x ${item.seatCount || 1}`,
      },
      {
        kind: "arrival",
        itemType: "transport",
        title: `${item.title || "Transport"} arrival`,
        subtitle: transportLabel,
        destination: item.travelDate || "",
        startsAt: endIso || startIso,
        endsAt: endIso || startIso,
        isScheduled: Boolean(endIso || startIso),
        notes: item.arrivalTime ? `Arrival at ${item.arrivalTime}` : "",
      },
    ];
  });
}

function buildLocalEntries(localItems) {
  return localItems.map((item) => {
    const startIso = toIsoString(item.scheduledDate, item.scheduledTime);
    const endIso = startIso ? addHoursToIso(startIso, item.durationHours) : "";
    const isRental = item.type === "vehicle-rental";

    return {
      kind: isRental ? "rental-pickup" : "activity",
      itemType: item.type || "local-experience",
      title: item.name || "Local booking",
      subtitle: item.provider || "",
      destination: item.destination || "",
      startsAt: startIso,
      endsAt: endIso,
      isScheduled: Boolean(startIso),
      notes: startIso
        ? `${item.pickupLocation || "Provider confirms location"}`
        : "Schedule this item to place it in the timeline.",
    };
  });
}

function buildTimeline(transportItems, localItems) {
  const entries = [...buildTransportEntries(transportItems), ...buildLocalEntries(localItems)];

  return entries.sort((a, b) => {
    if (a.isScheduled !== b.isScheduled) {
      return a.isScheduled ? -1 : 1;
    }

    const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime || a.title.localeCompare(b.title);
  });
}

function buildTripTitle(transportItems, localItems) {
  const firstTransport = transportItems[0];
  if (firstTransport?.title) {
    return `Itinerary for ${firstTransport.title}`;
  }

  const firstLocal = localItems[0];
  if (firstLocal?.destination) {
    return `${firstLocal.destination} itinerary`;
  }

  return "Trip itinerary";
}

function mapItinerary(itinerary) {
  return {
    id: itinerary._id.toString(),
    tripTitle: itinerary.tripTitle,
    passToken: itinerary.passToken,
    transportItems: itinerary.transportItems || [],
    localItems: itinerary.localItems || [],
    timelineEntries: itinerary.timelineEntries || [],
    stats: itinerary.stats || {},
    createdAt: itinerary.createdAt,
    updatedAt: itinerary.updatedAt,
  };
}

export const checkoutItinerary = async (req, res) => {
  try {
    const authUserId = req.user?.userId;
    const transportItems = Array.isArray(req.body.transportItems) ? req.body.transportItems : [];
    const localItems = Array.isArray(req.body.localItems) ? req.body.localItems : [];

    if (!authUserId) {
      return res.status(401).json({ message: "Login required" });
    }

    if (!transportItems.length && !localItems.length) {
      return res.status(400).json({ message: "Add at least one booked item before checkout." });
    }

    const timelineEntries = buildTimeline(transportItems, localItems);
    const scheduledCount = timelineEntries.filter((entry) => entry.isScheduled).length;
    const unscheduledCount = timelineEntries.length - scheduledCount;

    const itinerary = await Itinerary.create({
      user: authUserId,
      passToken: crypto.randomUUID(),
      tripTitle: buildTripTitle(transportItems, localItems),
      transportItems,
      localItems,
      timelineEntries,
      stats: {
        transportCount: transportItems.length,
        localCount: localItems.length,
        scheduledCount,
        unscheduledCount,
      },
    });

    return res.status(201).json({
      message: "Checkout completed and itinerary generated successfully.",
      itinerary: mapItinerary(itinerary),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to generate itinerary right now.", error: error.message });
  }
};

export const getItineraryById = async (req, res) => {
  try {
    const authUserId = req.user?.userId;
    const itinerary = await Itinerary.findById(req.params.itineraryId);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found." });
    }

    if (!authUserId) {
      return res.status(401).json({ message: "Login required" });
    }

    if (itinerary.user.toString() !== authUserId && req.user.role !== "admin") {
      return res.status(403).json({ message: "You do not have access to this itinerary." });
    }

    return res.json({ itinerary: mapItinerary(itinerary) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load itinerary right now.", error: error.message });
  }
};
