import TransportTicket from "./transport.model.js";

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

const parseTimeToMinutes = (time = "") => {
  const value = time.toString().trim();
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

const calculateDurationMinutes = (departureTime, arrivalTime) => {
  const departureMinutes = parseTimeToMinutes(departureTime);
  const arrivalMinutes = parseTimeToMinutes(arrivalTime);

  if (departureMinutes === null || arrivalMinutes === null) {
    return null;
  }

  let duration = arrivalMinutes - departureMinutes;

  // If arrival is before departure, treat it as next-day arrival.
  if (duration < 0) {
    duration += 24 * 60;
  }

  return duration;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  } else {
    return parsed;
  }
};

const normalizeSeatTypes = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const mapSeatPreference = (ticket) => ticket.seatTypes || [];

export const getTransportTickets = async (req, res) => {
  try {
    const {
      origin = "",
      destination = "",
      date = "",
      mode = "",
      seat = "",
      maxPrice = "",
      maxDuration = "",
    } = req.query;

    const mongoQuery = {};

    if (date) {
      mongoQuery.travelDate = date;
    }

    if (origin) {
      mongoQuery.origin = origin;
    }

    if (mode && mode !== "all") {
      mongoQuery.mode = mode;
    }

    const priceLimit = parseNumber(maxPrice);
    if (priceLimit !== null) {
      mongoQuery.price = { $lte: priceLimit };
    }

    const durationLimit = parseNumber(maxDuration);
    if (durationLimit !== null) {
      mongoQuery.duration = { $lte: durationLimit };
    }

    let tickets = await TransportTicket.find(mongoQuery).sort({ travelDate: 1, departureTime: 1 });
// if any part match keep the ticket
    const normalizedDestination = normalizeText(destination);
    if (normalizedDestination) {
      tickets = tickets.filter((ticket) => {
        const destinationMatch = normalizeText(ticket.destination).includes(normalizedDestination);
        const titleMatch = normalizeText(ticket.title).includes(normalizedDestination);
        const originMatch = normalizeText(ticket.origin).includes(normalizedDestination);
        return destinationMatch || titleMatch || originMatch;
      });
    }

    const normalizedSeat = normalizeText(seat);
    if (normalizedSeat && normalizedSeat !== "any") {
      tickets = tickets.filter((ticket) =>
        mapSeatPreference(ticket).some((seatType) => normalizeText(seatType).includes(normalizedSeat))
      );
    }

    return res.json({ tickets });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getTransportTicketById = async (req, res) => {
  try {
    const ticket = await TransportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Transport ticket not found" });
    }

    return res.json({ ticket });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const createTransportTicket = async (req, res) => {
  try {
    const {
      mode,
      title,
      operator,
      origin,
      destination,
      travelDate,
      departureTime,
      arrivalTime,
      price,
      seatTypes,
      seatsAvailable,
    } = req.body;

    if (!mode || !title || !operator || !origin || !destination || !travelDate || !departureTime || !arrivalTime) {
      return res.status(400).json({ message: "Please provide all required transport ticket fields" });
    }

    const computedDuration = calculateDurationMinutes(departureTime, arrivalTime);
    if (computedDuration === null) {
      return res.status(400).json({ message: "Invalid departure or arrival time format. Use HH:mm" });
    }
//save ticket in db
    const ticket = await TransportTicket.create({
      mode,
      title: title.trim(),
      operator: operator.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      travelDate,
      departureTime,
      arrivalTime,
      duration: computedDuration,
      price: Number(price),
      seatTypes: normalizeSeatTypes(seatTypes),
      seatsAvailable: seatsAvailable === undefined ? 0 : Number(seatsAvailable),
    });

    return res.status(201).json({ message: "Transport ticket created successfully", ticket });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateTransportTicket = async (req, res) => {
  try {
    const updates = { ...req.body };

    const existingTicket = await TransportTicket.findById(req.params.ticketId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Transport ticket not found" });
    }

    const effectiveDepartureTime = updates.departureTime ?? existingTicket.departureTime;
    const effectiveArrivalTime = updates.arrivalTime ?? existingTicket.arrivalTime;
    const computedDuration = calculateDurationMinutes(effectiveDepartureTime, effectiveArrivalTime);

    if (computedDuration === null) {
      return res.status(400).json({ message: "Invalid departure or arrival time format. Use HH:mm" });
    }

    updates.duration = computedDuration;

    if (updates.title) updates.title = updates.title.trim();
    if (updates.operator) updates.operator = updates.operator.trim();
    if (updates.origin) updates.origin = updates.origin.trim();
    if (updates.destination) updates.destination = updates.destination.trim();
    if (updates.seatTypes !== undefined) updates.seatTypes = normalizeSeatTypes(updates.seatTypes);
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.seatsAvailable !== undefined) updates.seatsAvailable = Number(updates.seatsAvailable);

    const ticket = await TransportTicket.findByIdAndUpdate(req.params.ticketId, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({ message: "Transport ticket updated successfully", ticket });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteTransportTicket = async (req, res) => {
  try {
    const ticket = await TransportTicket.findByIdAndDelete(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: "Transport ticket not found" });
    }

    return res.json({ message: "Transport ticket deleted successfully", ticketId: ticket._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};