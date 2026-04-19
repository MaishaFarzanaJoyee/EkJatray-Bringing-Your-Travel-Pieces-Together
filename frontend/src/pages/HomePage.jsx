import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { searchTransportTickets } from "../services/transportService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

const transportCartKey = "ekjatrayTransportCart";

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

function getTransportCartItemKey(item) {
  if (item?.cartId) {
    return item.cartId;
  }

  return `${item?.id || ""}:${item?.seat || ""}:${item?.seatCount || 1}`;
}

function readCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(transportCartKey) || "[]");
  } catch {
    return [];
  }
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
  const [cart, setCart] = useState(() => readCartFromStorage());
  const [ticketSelections, setTicketSelections] = useState({});
  const [proceedNote, setProceedNote] = useState("Login is required to continue booking.");

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(transportCartKey);
      setCart([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(transportCartKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    loadTransportTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function removeCartItem(targetId) {
    setCart((prev) => prev.filter((item) => getTransportCartItemKey(item) !== targetId));
  }

  function addTicketToCart(ticket) {
    const ticketId = getTransportTicketId(ticket);
    if (!ticketId) {
      return;
    }

    const selectedSeat = ticketSelections[ticketId]?.seat || "Any";
    const selectedSeatCount = Number(ticketSelections[ticketId]?.count) > 0
      ? Number(ticketSelections[ticketId]?.count)
      : 1;

    const cartId = `${ticketId}:${selectedSeat}:${selectedSeatCount}`;
    const duplicate = cart.some((item) => getTransportCartItemKey(item) === cartId);
    if (duplicate) {
      setSummaryText("That ticket and seat are already in your cart.");
      return;
    }

    const ticketDate = getTransportDate(ticket);
    const departureTime = getTransportDepartureTime(ticket);
    const arrivalTime = getTransportArrivalTime(ticket);

    setCart((prev) => [
      ...prev,
      {
        cartId,
        id: ticketId,
        title: getTransportTitle(ticket),
        mode: ticket?.mode || "transport",
        modeLabel: getTransportModeLabel(ticket),
        operator: ticket?.operator || "Unknown operator",
        travelDate: ticketDate,
        departureTime,
        arrivalTime,
        price: ticket?.price || 0,
        duration: ticket?.duration || 0,
        seat: selectedSeat,
        seatCount: selectedSeatCount,
      },
    ]);

    setSummaryText(`${getTransportTitle(ticket)} was added to your central cart.`);
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
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!cart.length) {
      setProceedNote("Add at least one ticket before proceeding.");
      return;
    }

    setProceedNote("Booking flow will continue here after login.");
  }

  const ticketCards = useMemo(() => {
    if (!tickets.length) {
      return <p className="transport-empty">No tickets match your filters.</p>;
    }

    return tickets.map((ticket) => {
      const ticketId = getTransportTicketId(ticket);
      const seatTypes = getTransportSeatTypes(ticket);
      const selectedSeat = ticketSelections[ticketId]?.seat || seatTypes[0] || "Any";
      const selectedCount = ticketSelections[ticketId]?.count || 1;
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
                  value={selectedCount}
                  onChange={(event) => updateSelection(ticketId, "count", Number(event.target.value))}
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                    <option value={count} key={`${ticketId}-count-${count}`}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="button-main" type="button" onClick={() => addTicketToCart(ticket)}>
              Add to Cart
            </button>
          </div>
        </article>
      );
    });
  }, [ticketSelections, tickets]);

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

      <section id="transport-ticket-search" className="section">
        <div className="section-title">
          <p className="sub-title">Transport ticket search and booking</p>
          <h2>Search flights, trains, and buses from one place.</h2>
          <p className="description transport-intro">
            Compare transport tickets by destination and date, filter by price and duration, pick a seat, and add the
            ticket to your centralized cart.
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

          <div className="transport-grid transport-grid-split">
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
            </div>

            <aside className="card transport-cart-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Centralized Cart</h3>
                  <p className="transport-muted">Selected tickets stay here while you plan the rest of the trip.</p>
                </div>
                <span className="transport-badge">{cart.length} item{cart.length === 1 ? "" : "s"}</span>
              </div>

              <div className="transport-cart">
                {!cart.length && <p className="transport-empty">Your cart is empty.</p>}

                {cart.map((item) => (
                  <div className="transport-cart-item" key={getTransportCartItemKey(item)}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>
                        {item.modeLabel} | {item.travelDate || item.departureDate || ""} | Seat: {item.seat} | Seats booked: {item.seatCount || 1}
                      </p>
                      <p>{item.operator} | {item.departureTime} - {item.arrivalTime}</p>
                    </div>
                    <div className="transport-cart-meta">
                      <strong>BDT {item.price}</strong>
                      <button
                        className="button-light transport-mini-btn"
                        type="button"
                        onClick={() => removeCartItem(getTransportCartItemKey(item))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="transport-cart-footer">
                <button className="button-main" type="button" disabled={!cart.length} onClick={handleProceed}>
                  Proceed
                </button>
                <p className="transport-muted">
                  {cart.length
                    ? (isAuthenticated ? "Ready to continue booking." : "Login is required to continue booking.")
                    : proceedNote}
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
