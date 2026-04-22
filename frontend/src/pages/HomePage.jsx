import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkoutTrip } from "../services/itineraryService";
import { searchLocalDiscoveryItems } from "../services/localDiscoveryService";
import { searchSafetyContacts } from "../services/safetyService";
import { searchTransportTickets } from "../services/transportService";
import { addTransportTicketToCart } from "../services/cartCheckoutService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

function getTransportTicketId(ticket) {
  return ticket?._id || ticket?.id || "";
}

function getTransportTitle(ticket) {
  return ticket?.title || "Untitled ticket";
}

function getTransportModeLabel(ticket) {
  const mode = ticket?.mode || "";
  return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Transport";
}

function getTransportDate(ticket) {
  return ticket?.travelDate || ticket?.date || "";
}

function getTransportDepartureTime(ticket) {
  return ticket?.departureTime || ticket?.depart || "";
}

function getTransportArrivalTime(ticket) {
  return ticket?.arrivalTime || ticket?.arrive || "";
}

function getTransportAvailableSeats(ticket) {
  const seats = Number(ticket?.seatsAvailable ?? 0);
  if (Number.isNaN(seats) || seats < 0) {
    return 0;
  }

  return seats;
}

function getTransportSeatTypes(ticket) {
  if (Array.isArray(ticket?.seatTypes) && ticket.seatTypes.length) {
    return ticket.seatTypes;
  }

  if (Array.isArray(ticket?.seats) && ticket.seats.length) {
    return ticket.seats;
  }

  return ["Standard"];
}

function formatDuration(durationMinutes) {
  const totalMinutes = Number(durationMinutes);

  if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
    return "N/A";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchForm, setSearchForm] = useState({
    origin: "",
    destination: "",
    date: "",
    mode: "all",
    seatType: "any",
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("Use the filters above to find tickets.");
  const [ticketSelections, setTicketSelections] = useState({});
  const [cartNotice, setCartNotice] = useState({ type: "", text: "" });

  useEffect(() => {
    sessionStorage.setItem(localDiscoveryPlanKey, JSON.stringify(localPlan));
  }, [localPlan]);

  useEffect(() => {
    loadTransportTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cartNotice.text) {
      return;
    }

    const timer = setTimeout(() => {
      setCartNotice({ type: "", text: "" });
    }, 2500);

    return () => clearTimeout(timer);
  }, [cartNotice]);

  function updateSearchField(name, value) {
    setSearchForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateSelection(ticketId, field, value) {
    setTicketSelections((prev) => ({
      ...prev,
      [ticketId]: {
        seat: prev[ticketId]?.seat || "Any",
        count: prev[ticketId]?.count || 1,
        [field]: value,
      },
    }));
  }

  async function addTicketToCart(ticket) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const ticketId = getTransportTicketId(ticket);
    if (!ticketId) {
      return;
    }

    const availableSeats = getTransportAvailableSeats(ticket);
    const selectedSeatCount = Math.min(
      availableSeats || 1,
      Number(ticketSelections[ticketId]?.count) > 0 ? Number(ticketSelections[ticketId]?.count) : 1
    );

    try {
      await addTransportTicketToCart({ ticketId, quantity: selectedSeatCount });
      setCartNotice({ type: "success", text: `${getTransportTitle(ticket)} added to cart successfully.` });
    } catch (error) {
      setCartNotice({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not add ticket to cart.",
      });
    }
  }

  function resetTransportSearch() {
    setSearchForm({
      origin: "",
      destination: "",
      date: "",
      mode: "all",
      seatType: "any",
    });
    loadTransportTickets({
      origin: "",
      destination: "",
      date: "",
      mode: "all",
      seatType: "any",
    });
  }

  function updateSafetyField(name, value) {
    setSafetyForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateLocalField(name, value) {
    setLocalDiscoveryForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetSafetySearch() {
    const nextForm = {
      destination: "Cox's Bazar",
      category: "all",
      search: "",
    };
    setSafetyForm(nextForm);
    loadSafetyContacts(nextForm);
  }

  async function loadSafetyContacts(formOverride) {
    const form = formOverride || safetyForm;
    setSafetyLoading(true);
    setSafetySummary("Loading trusted local contacts...");

    try {
      const result = await searchSafetyContacts({
        destination: form.destination,
        category: form.category,
        search: form.search.trim(),
      });

      const nextContacts = Array.isArray(result.contacts) ? result.contacts : [];
      setSafetyContacts(nextContacts);

      const summaryParts = [];
      if (form.destination) summaryParts.push(form.destination);
      if (form.category && form.category !== "all") summaryParts.push(getSafetyCategoryLabel(form.category));
      if (form.search.trim()) summaryParts.push(`matching "${form.search.trim()}"`);

      const nextSummary = nextContacts.length
        ? `Showing ${nextContacts.length} verified support contact${nextContacts.length === 1 ? "" : "s"}${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`
        : `No contacts found${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`;

      setSafetySummary(nextSummary);
    } catch (error) {
      setSafetyContacts([]);
      setSafetySummary(error?.response?.data?.message || error?.response?.data?.error || "Unable to load safety contacts right now.");
    } finally {
      setSafetyLoading(false);
    }
  }

  function runSafetySearch(event) {
    event.preventDefault();
    loadSafetyContacts();
  }

  function resetLocalSearch() {
    const nextForm = {
      destination: "Cox's Bazar",
      type: "all",
      category: "",
      search: "",
      maxPrice: "",
    };
    setLocalDiscoveryForm(nextForm);
    loadLocalDiscoveryItems(nextForm);
  }

  function addLocalItemToPlan(item) {
    const planId = item.id;
    if (!planId) {
      return;
    }

    const exists = localPlan.some((entry) => getLocalItemKey(entry) === planId);
    if (exists) {
      setLocalSummary("That rental or workshop is already in your trip plan.");
      return;
    }

    setLocalPlan((prev) => [
      ...prev,
      {
        planId,
        id: item.id,
        type: item.type,
        destination: item.destination,
        name: item.name,
        provider: item.provider,
        price: item.price,
        pricingUnit: item.pricingUnit,
        durationHours: item.durationHours,
        contactPhone: item.contactPhone,
        pickupLocation: item.pickupLocation,
        scheduledDate: "",
        scheduledTime: "",
      },
    ]);
    setLocalSummary(`${item.name} was added to your trip plan.`);
  }

  function updateLocalPlanItem(planId, field, value) {
    setLocalPlan((prev) =>
      prev.map((entry) => (getLocalItemKey(entry) === planId ? { ...entry, [field]: value } : entry))
    );
  }

  function removeLocalItem(planId) {
    setLocalPlan((prev) => prev.filter((entry) => getLocalItemKey(entry) !== planId));
  }

  async function loadLocalDiscoveryItems(formOverride) {
    const form = formOverride || localDiscoveryForm;
    setLocalLoading(true);
    setLocalSummary("Loading local rentals and workshops...");

    try {
      const result = await searchLocalDiscoveryItems({
        destination: form.destination,
        type: form.type,
        category: form.category.trim(),
        search: form.search.trim(),
        maxPrice: form.maxPrice,
      });

      const nextItems = Array.isArray(result.items) ? result.items : [];
      setLocalItems(nextItems);

      const summaryParts = [];
      if (form.destination) summaryParts.push(form.destination);
      if (form.type !== "all") summaryParts.push(getLocalTypeLabel(form.type));
      if (form.category.trim()) summaryParts.push(form.category.trim());
      if (form.maxPrice) summaryParts.push(`under BDT ${form.maxPrice}`);
      if (form.search.trim()) summaryParts.push(`matching "${form.search.trim()}"`);

      setLocalSummary(
        nextItems.length
          ? `Showing ${nextItems.length} rental or workshop option${nextItems.length === 1 ? "" : "s"}${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`
          : `No rentals or workshops found${summaryParts.length ? ` for ${summaryParts.join(", ")}` : ""}.`
      );
    } catch (error) {
      setLocalItems([]);
      setLocalSummary(error?.response?.data?.message || error?.response?.data?.error || "Unable to load local rentals and workshops right now.");
    } finally {
      setLocalLoading(false);
    }
  }

  function runLocalSearch(event) {
    event.preventDefault();
    loadLocalDiscoveryItems();
  }

  async function loadTransportTickets(formOverride) {
    const form = formOverride || searchForm;
    const params = new URLSearchParams();

    if (form.origin) params.set("origin", form.origin.trim());
    if (form.destination) params.set("destination", form.destination.trim());
    if (form.date) params.set("date", form.date);
    if (form.mode !== "all") params.set("mode", form.mode);
    if (form.seatType !== "any") params.set("seat", form.seatType);

    setLoading(true);
    setSummaryText("Loading transport tickets...");

    try {
      const result = await searchTransportTickets(Object.fromEntries(params.entries()));
      const nextTickets = Array.isArray(result.tickets) ? result.tickets : [];
      setTickets(nextTickets);

      // Preserve seat/count selection for each visible ticket.
      setTicketSelections((prev) => {
        const next = { ...prev };
        nextTickets.forEach((ticket) => {
          const id = getTransportTicketId(ticket);
          if (!id) {
            return;
          }
          const defaultSeat = getTransportSeatTypes(ticket)[0] || "Any";
          if (!next[id]) {
            next[id] = { seat: defaultSeat, count: 1 };
          }
        });
        return next;
      });

      const summaryParts = [];
      if (form.origin) summaryParts.push(`origin "${form.origin}"`);
      if (form.destination) summaryParts.push(`district "${form.destination}"`);
      if (form.date) summaryParts.push(`date ${form.date}`);
      if (form.mode !== "all") summaryParts.push(`${form.mode} mode`);
      if (form.seatType !== "any") summaryParts.push(`${form.seatType} seats`);

      const nextSummary = summaryParts.length
        ? `Showing ${nextTickets.length} result${nextTickets.length === 1 ? "" : "s"} for ${summaryParts.join(", ")}.`
        : `${nextTickets.length} transport ticket${nextTickets.length === 1 ? "" : "s"} available.`;

      setSummaryText(nextSummary);
    } catch (error) {
      setTickets([]);
      setSummaryText(error?.response?.data?.message || error?.response?.data?.error || error.message || "Unable to load transport tickets right now.");
    } finally {
      setLoading(false);
    }
  }

  function runTransportSearch(event) {
    event.preventDefault();
    loadTransportTickets();
  }

  function handleProceed() {
    navigate("/cart");
  }

  const ticketCards = useMemo(() => {
    if (!tickets.length) {
      return <p className="transport-empty">No tickets match your filters.</p>;
    }

    return tickets.map((ticket) => {
      const ticketId = getTransportTicketId(ticket);
      const seatTypes = getTransportSeatTypes(ticket);
      const selectedSeat = ticketSelections[ticketId]?.seat || seatTypes[0] || "Any";
      const availableSeats = getTransportAvailableSeats(ticket);
      const selectedCount = Math.min(
        availableSeats || 1,
        ticketSelections[ticketId]?.count || 1
      );
      const ticketDate = getTransportDate(ticket);
      const departureTime = getTransportDepartureTime(ticket);
      const arrivalTime = getTransportArrivalTime(ticket);

      return (
        <article className="transport-ticket" key={ticketId}>
          <div className="transport-ticket-top">
            <div>
              <p className="transport-mode-tag">{getTransportModeLabel(ticket)}</p>
              <h4>{getTransportTitle(ticket)}</h4>
              <p className="transport-muted">{ticket?.operator || "Unknown operator"} | {ticket?.destination || "Unknown destination"}</p>
            </div>
            <strong className="transport-price">BDT {ticket?.price || 0}</strong>
          </div>

          <div className="transport-ticket-meta">
            <span><strong>Date:</strong> {ticketDate}</span>
            <span><strong>Time:</strong> {departureTime} - {arrivalTime}</span>
            <span><strong>Duration:</strong> {formatDuration(ticket?.duration)}</span>
            <span><strong>Seats:</strong> {seatTypes.join(", ")}</span>
            <span><strong>Available:</strong> {ticket?.seatsAvailable ?? "N/A"}</span>
          </div>

          <div className="transport-ticket-actions">
            <div className="transport-ticket-selects">
              <label className="transport-seat-label">
                Seat preference
                <select
                  value={selectedSeat}
                  onChange={(event) => updateSelection(ticketId, "seat", event.target.value)}
                >
                  {seatTypes.map((seat) => (
                    <option value={seat} key={`${ticketId}-${seat}`}>
                      {seat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="transport-seat-label">
                Seats to book
                <select
                  disabled={!availableSeats}
                  value={selectedCount}
                  onChange={(event) => updateSelection(ticketId, "count", Number(event.target.value))}
                >
                  {availableSeats
                    ? Array.from({ length: availableSeats }, (_, index) => index + 1).map((count) => (
                    <option value={count} key={`${ticketId}-count-${count}`}>
                      {count}
                    </option>
                  ))
                    : (
                      <option value={0}>Sold out</option>
                    )}
                </select>
              </label>
            </div>

            <button className="button-main" type="button" onClick={() => addTicketToCart(ticket)} disabled={!availableSeats}>
              Add to Cart
            </button>
          </div>
        </article>
      );
    });
  }, [ticketSelections, tickets]);

  const safetyCards = useMemo(() => {
    if (!safetyContacts.length) {
      return <p className="transport-empty">No verified contacts match the current destination or category.</p>;
    }

    return safetyContacts.map((contact) => (
      <article className="safety-card" key={contact.id}>
        <div className="transport-ticket-top">
          <div>
            <p className="transport-mode-tag">{getSafetyCategoryLabel(contact.category)}</p>
            <h4>{contact.name}</h4>
            <p className="transport-muted">
              {contact.organization || "Local support network"} | {contact.destination}
            </p>
          </div>
          <div className="safety-badges">
            {contact.verified && <span className="transport-badge">Verified</span>}
            {contact.available24Hours && <span className="transport-badge">24/7</span>}
          </div>
        </div>

        <div className="transport-ticket-meta safety-meta">
          <span><strong>Primary:</strong> {contact.phone}</span>
          <span><strong>Alternate:</strong> {contact.alternatePhone || "Not listed"}</span>
          <span><strong>Languages:</strong> {contact.languages?.length ? contact.languages.join(", ") : "Local language support"}</span>
          <span><strong>Address:</strong> {contact.address || "Destination support desk"}</span>
        </div>

        <p className="safety-notes">{contact.notes || "Use this contact for urgent support or trusted local guidance."}</p>

        <div className="safety-actions">
          <a className="button-main" href={getPhoneHref(contact.phone)}>
            Call Now
          </a>

          {contact.supportsSos ? (
            <a className="button-light" href={getSosHref(contact.phone, contact.destination, contact.name)}>
              Send SOS
            </a>
          ) : (
            <a
              className="button-light"
              href={contact.whatsapp ? getWhatsappHref(contact.whatsapp, contact.destination) : getPhoneHref(contact.phone)}
              target={contact.whatsapp ? "_blank" : undefined}
              rel={contact.whatsapp ? "noreferrer" : undefined}
            >
              {contact.whatsapp ? "Message on WhatsApp" : "Call for Help"}
            </a>
          )}
        </div>
      </article>
    ));
  }, [safetyContacts]);

  const localDiscoveryCards = useMemo(() => {
    if (!localItems.length) {
      return <p className="transport-empty">No vehicle rentals or workshops match the current filters.</p>;
    }

    return localItems.map((item) => (
      <article className="local-card" key={item.id}>
        <div className="transport-ticket-top">
          <div>
            <p className="transport-mode-tag">{getLocalTypeLabel(item.type)}</p>
            <h4>{item.name}</h4>
            <p className="transport-muted">{item.provider} | {item.destination}</p>
          </div>
          <div className="safety-badges">
            {item.verified && <span className="transport-badge">Verified</span>}
            {item.available && <span className="transport-badge">Available</span>}
          </div>
        </div>

        <div className="transport-ticket-meta">
          <span><strong>Category:</strong> {item.category}</span>
          <span><strong>Price:</strong> BDT {item.price} {item.pricingUnit ? `/${item.pricingUnit}` : ""}</span>
          <span><strong>Duration:</strong> {item.durationHours ? `${item.durationHours}h` : "Flexible"}</span>
          <span><strong>Capacity:</strong> {item.capacity}</span>
          <span><strong>Pickup:</strong> {item.pickupLocation || "Provider confirms on booking"}</span>
          <span><strong>Contact:</strong> {item.contactPhone || "Available after confirmation"}</span>
        </div>

        <p className="safety-notes">{item.shortDescription || "Reserve before arrival and keep this part of the trip organized with the rest of your planning."}</p>

        {!!item.features?.length && (
          <div className="local-feature-row">
            {item.features.map((feature) => (
              <span className="transport-badge" key={`${item.id}-${feature}`}>{feature}</span>
            ))}
          </div>
        )}

        <div className="safety-actions">
          <button className="button-main" type="button" onClick={() => addLocalItemToPlan(item)}>
            Reserve in Plan
          </button>
          {item.contactPhone && (
            <a className="button-light" href={getPhoneHref(item.contactPhone)}>
              Call Provider
            </a>
          )}
        </div>
      </article>
    ));
  }, [localItems, localPlan]);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="sub-title">Travel planning, organized</p>
          <h1>Turn scattered trip ideas into a single, calm plan.</h1>
          <p className="description">
            EkJatray helps travelers coordinate transport, budgets, and destination planning without jumping between tools.
            Keep the journey clear for solo trips or group adventures.
          </p>

          <div className="button-row">
            <Link className="button-main" to="/budget">Open Budget Manager</Link>
            <a className="button-light" href="#transport-ticket-search">Search Transport Tickets</a>
            <a className="button-light" href="#safety-connect-hub">Open Safety Hub</a>
            <a className="button-light" href="#local-discovery-hub">Explore Rentals and Workshops</a>
          </div>

          <div className="stat-row" aria-label="Project highlights">
            <div>
              <strong>Shared</strong>
              <span>trip budgeting</span>
            </div>
            <div>
              <strong>Unified</strong>
              <span>transport search</span>
            </div>
            <div>
              <strong>Simple</strong>
              <span>expense tracking</span>
            </div>
          </div>
        </div>
      </section>

      <section id="local-discovery-hub" className="section">
        <div className="section-title">
          <p className="sub-title">Vehicle rentals and local experiences</p>
          <h2>Reserve your ride and book hands-on workshops before arrival.</h2>
          <p className="description transport-intro">
            Search local car rentals, microbuses, artisan classes, and other destination-specific experiences.
            Keep them alongside your trip planning instead of hunting for providers at the last minute.
          </p>
        </div>

        <div className="transport-shell">
          <form className="transport-form" onSubmit={runLocalSearch}>
            <div className="transport-grid transport-grid-4">
              <div>
                <label htmlFor="local-destination">Destination</label>
                <select id="local-destination" value={localDiscoveryForm.destination} onChange={(event) => updateLocalField("destination", event.target.value)}>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`local-destination-${district}`}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="local-type">Type</label>
                <select id="local-type" value={localDiscoveryForm.type} onChange={(event) => updateLocalField("type", event.target.value)}>
                  {localDiscoveryTypeOptions.map((option) => (
                    <option value={option.value} key={`local-type-${option.value}`}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="local-category">Category</label>
                <input id="local-category" type="text" placeholder="car, microbus, art-workshop..." value={localDiscoveryForm.category} onChange={(event) => updateLocalField("category", event.target.value)} />
              </div>

              <div>
                <label htmlFor="local-search">Search</label>
                <input id="local-search" type="text" placeholder="airport pickup, artisan, eco..." value={localDiscoveryForm.search} onChange={(event) => updateLocalField("search", event.target.value)} />
              </div>

              <div>
                <label htmlFor="local-price">Max Price</label>
                <input id="local-price" type="number" min="0" step="100" value={localDiscoveryForm.maxPrice} onChange={(event) => updateLocalField("maxPrice", event.target.value)} />
              </div>
            </div>

            <div className="transport-actions transport-search-actions">
              <button className="button-main" type="submit">Search Rentals and Workshops</button>
              <button className="button-light" type="button" onClick={resetLocalSearch}>Reset</button>
            </div>
          </form>

          <div className="safety-layout">
            <div className="card transport-results-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Available Local Options</h3>
                  <p className="transport-muted">{localSummary}</p>
                </div>
                <span className="transport-badge">Pre-trip booking</span>
              </div>

              <div className="transport-results">
                {localLoading ? <p className="transport-empty">Loading local rentals and workshops...</p> : localDiscoveryCards}
              </div>
            </div>

            <aside className="card safety-side-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Trip Plan Add-ons</h3>
                  <p className="transport-muted">Save rentals and experiences you want to lock in.</p>
                </div>
                <span className="transport-badge">{localPlan.length} saved</span>
              </div>

              <div className="transport-cart">
                {!localPlan.length && <p className="transport-empty">No rentals or workshops saved yet.</p>}

                {localPlan.map((item) => (
                  <div className="transport-cart-item" key={getLocalItemKey(item)}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{getLocalTypeLabel(item.type)} | {item.destination}</p>
                      <p>{item.provider} | BDT {item.price} {item.pricingUnit ? `/${item.pricingUnit}` : ""}</p>
                    </div>
                    <div className="transport-cart-meta">
                      <strong>{item.durationHours ? `${item.durationHours}h` : "Flexible"}</strong>
                      <button className="button-light transport-mini-btn" type="button" onClick={() => removeLocalItem(getLocalItemKey(item))}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!!localPlan.length && (
                <div className="transport-results">
                  {localPlan.map((item) => (
                    <div className="trip-plan-schedule" key={`${getLocalItemKey(item)}-schedule`}>
                      <strong>{item.name}</strong>
                      <div className="trip-plan-schedule-grid">
                        <label className="transport-seat-label">
                          Planned date
                          <input
                            type="date"
                            value={item.scheduledDate || ""}
                            onChange={(event) => updateLocalPlanItem(getLocalItemKey(item), "scheduledDate", event.target.value)}
                          />
                        </label>
                        <label className="transport-seat-label">
                          Planned time
                          <input
                            type="time"
                            value={item.scheduledTime || ""}
                            onChange={(event) => updateLocalPlanItem(getLocalItemKey(item), "scheduledTime", event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="transport-cart-footer">
                <p className="transport-muted">
                  Use this shortlist to keep pre-booked mobility and artisan sessions visible with the rest of your trip.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="transport-ticket-search" className="section">
        {cartNotice.text ? (
          <div className={`cart-toast ${cartNotice.type === "error" ? "is-error" : "is-success"}`}>
            {cartNotice.text}
          </div>
        ) : null}

        <div className="section-title">
          <p className="sub-title">Transport ticket search and booking</p>
          <h2>Search flights, trains, and buses from one place.</h2>
          <p className="description transport-intro">
            Compare transport tickets by destination and date, filter by seat preference, and add your selected ticket directly to cart.
          </p>
        </div>

        <div className="transport-shell">
          <form className="transport-form" onSubmit={runTransportSearch}>
            <div className="transport-grid transport-grid-4">
              <div>
                <label htmlFor="transport-origin">Origin</label>
                <select
                  id="transport-origin"
                  value={searchForm.origin}
                  onChange={(event) => updateSearchField("origin", event.target.value)}
                >
                  <option value="">Select district</option>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`origin-${district}`}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="transport-destination">Destination</label>
                <select
                  id="transport-destination"
                  value={searchForm.destination}
                  onChange={(event) => updateSearchField("destination", event.target.value)}
                >
                  <option value="">Select district</option>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`dest-${district}`}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="transport-date">Travel Date</label>
                <input
                  id="transport-date"
                  type="date"
                  value={searchForm.date}
                  onChange={(event) => updateSearchField("date", event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="transport-mode">Transport Mode</label>
                <select
                  id="transport-mode"
                  value={searchForm.mode}
                  onChange={(event) => updateSearchField("mode", event.target.value)}
                >
                  <option value="all">All Modes</option>
                  <option value="flight">Flights</option>
                  <option value="train">Trains</option>
                  <option value="bus">Buses</option>
                </select>
              </div>

              <div>
                <label htmlFor="transport-seat-type">Seat Preference</label>
                <select
                  id="transport-seat-type"
                  value={searchForm.seatType}
                  onChange={(event) => updateSearchField("seatType", event.target.value)}
                >
                  <option value="any">Any Seat</option>
                  <option value="window">Window</option>
                  <option value="aisle">Aisle</option>
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            <div className="transport-actions transport-search-actions">
              <button className="button-main" type="submit">Search Tickets</button>
              <button className="button-light" type="button" onClick={resetTransportSearch}>Reset</button>
            </div>
          </form>

          <div className="card transport-results-panel">
            <div className="transport-panel-header">
              <div>
                <h3>Available Tickets</h3>
                <p className="transport-muted">{summaryText}</p>
              </div>
              <span className="transport-badge">Live demo</span>
            </div>

            <div className="transport-results">
              {loading ? <p className="transport-empty">Loading transport tickets...</p> : ticketCards}
            </div>

            <div className="transport-actions">
              <button className="button-main" type="button" onClick={handleProceed}>Go to Cart</button>
            </div>
          </div>
        </div>
      </section>

      <section id="safety-connect-hub" className="section">
        <div className="section-title">
          <p className="sub-title">Safety and local connect hub</p>
          <h2>Keep trusted emergency and local help contacts ready before you need them.</h2>
          <p className="description transport-intro">
            Search destination-specific tourist police, hospital desks, emergency hotlines, and registered guides.
            Every card is organized by category and built for immediate calling or SOS outreach.
          </p>
        </div>

        <div className="transport-shell">
          <form className="transport-form safety-form" onSubmit={runSafetySearch}>
            <div className="transport-grid transport-grid-4">
              <div>
                <label htmlFor="safety-destination">Destination</label>
                <select
                  id="safety-destination"
                  value={safetyForm.destination}
                  onChange={(event) => updateSafetyField("destination", event.target.value)}
                >
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`safety-destination-${district}`}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="safety-category">Category</label>
                <select
                  id="safety-category"
                  value={safetyForm.category}
                  onChange={(event) => updateSafetyField("category", event.target.value)}
                >
                  {safetyCategoryOptions.map((option) => (
                    <option value={option.value} key={`safety-category-${option.value}`}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="safety-search">Search by organization or note</label>
                <input
                  id="safety-search"
                  type="text"
                  value={safetyForm.search}
                  placeholder="Hospital, beach, guide..."
                  onChange={(event) => updateSafetyField("search", event.target.value)}
                />
              </div>
            </div>

            <div className="transport-actions transport-search-actions">
              <button className="button-main" type="submit">Find Trusted Contacts</button>
              <button className="button-light" type="button" onClick={resetSafetySearch}>Reset</button>
            </div>
          </form>

          <div className="safety-layout">
            <div className="card transport-results-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Verified Local Directory</h3>
                  <p className="transport-muted">{safetySummary}</p>
                </div>
                <span className="transport-badge">Quick access</span>
              </div>

              <div className="transport-results">
                {safetyLoading ? <p className="transport-empty">Loading local support contacts...</p> : safetyCards}
              </div>
            </div>

            <aside className="card safety-side-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Immediate Support Tips</h3>
                  <p className="transport-muted">Use the quickest channel based on the situation.</p>
                </div>
                <span className="transport-badge">SOS ready</span>
              </div>

              <div className="safety-tip-list">
                <div className="safety-tip">
                  <strong>For emergencies</strong>
                  <p>Use `999` or a tourist police contact first when safety is at risk or you need urgent help navigating a local response.</p>
                </div>
                <div className="safety-tip">
                  <strong>For medical issues</strong>
                  <p>Call the listed hospital desk directly, then use the address block for faster transport coordination.</p>
                </div>
                <div className="safety-tip">
                  <strong>For local guidance</strong>
                  <p>Registered guide contacts are better for route advice, translation help, and trusted nearby recommendations.</p>
                </div>
              </div>

              <div className="transport-cart-footer">
                <a className="button-main" href="tel:999">Call 999</a>
                <p className="transport-muted">
                  The hub mixes admin-managed records with built-in fallback contacts so travelers still see essential help lines.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="section-title">
          <p className="sub-title">Features</p>
          <h2>Everything needed to shape a trip that feels under control.</h2>
        </div>

        <div className="card-grid">
          <article className="card">
            <h3>Plan faster</h3>
            <p>Keep trip details in one place and avoid switching between tools.</p>
          </article>
          <article className="card">
            <h3>Search transport</h3>
            <p>Compare flights, trains, and buses by date, price, duration, and seat.</p>
          </article>
          <article className="card">
            <h3>Track spending</h3>
            <p>Add expenses and keep your budget visible while planning together.</p>
          </article>
          <article className="card">
            <h3>Book local experiences</h3>
            <p>Reserve workshops and reliable rentals before arrival instead of scrambling on the ground.</p>
          </article>
        </div>
      </section>

      <section className="cta-box">
        <div>
          <p className="sub-title">Ready to start</p>
          <h2>Open transport search or the budget manager and begin shaping your next trip.</h2>
        </div>
        <div className="button-row">
          <a className="button-main button-dark" href="#transport-ticket-search">Search Tickets</a>
          <Link className="button-light" to="/budget">Go to Budget Manager</Link>
        </div>
      </section>
    </main>
  );
}
