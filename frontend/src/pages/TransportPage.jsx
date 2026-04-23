import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addTransportTicketToCart, getMyCart } from "../services/cartCheckoutService";
import { searchTransportTickets } from "../services/transportService";
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

export default function TransportPage() {
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
  const [transportCartItems, setTransportCartItems] = useState([]);
  const [transportCartTotal, setTransportCartTotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSummary, setCartSummary] = useState("Sign in to view and manage your live cart.");

  useEffect(() => {
    loadTransportTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTransportCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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

  function calculateCartTotal(items = []) {
    return items.reduce((sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0), 0);
  }

  function isTransportCartItem(item) {
    return item?.providerType === "transport" || item?.serviceType === "transport";
  }

  async function loadTransportCart() {
    if (!isAuthenticated) {
      setTransportCartItems([]);
      setTransportCartTotal(0);
      setCartSummary("Sign in to view and manage your live cart.");
      return;
    }

    setCartLoading(true);
    try {
      const data = await getMyCart();
      const allItems = Array.isArray(data?.cart?.items)
        ? data.cart.items
        : Array.isArray(data?.items)
          ? data.items
          : [];
      const transportItems = allItems.filter(isTransportCartItem);
      const total = calculateCartTotal(transportItems);

      setTransportCartItems(transportItems);
      setTransportCartTotal(total);
      setCartSummary(
        transportItems.length
          ? `${transportItems.length} transport item${transportItems.length === 1 ? "" : "s"} in cart.`
          : "No transport tickets in cart yet."
      );
    } catch (error) {
      setTransportCartItems([]);
      setTransportCartTotal(0);
      setCartSummary(error?.response?.data?.message || "Could not load cart right now.");
    } finally {
      setCartLoading(false);
    }
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
      await loadTransportCart();
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
    const resetForm = {
      origin: "",
      destination: "",
      date: "",
      mode: "all",
      seatType: "any",
    };
    setSearchForm(resetForm);
    loadTransportTickets(resetForm);
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
      const selectedCount = Math.min(availableSeats || 1, ticketSelections[ticketId]?.count || 1);
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

  return (
    <main>
      {cartNotice.text ? (
        <div className={`cart-toast ${cartNotice.type === "error" ? "is-error" : "is-success"}`}>
          {cartNotice.text}
        </div>
      ) : null}

      <section className="section">
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

              <div className="transport-actions">
                <button className="button-main" type="button" onClick={handleProceed}>Go to Cart</button>
              </div>
            </div>

            <aside className="card transport-cart-panel">
              <div className="transport-panel-header">
                <div>
                  <h3>Live Cart</h3>
                  <p className="transport-muted">{cartSummary}</p>
                </div>
                <span className="transport-badge">BDT {Math.round(transportCartTotal)}</span>
              </div>

              <div className="transport-cart">
                {!isAuthenticated ? (
                  <p className="transport-empty">Log in to see your real-time cart here.</p>
                ) : cartLoading ? (
                  <p className="transport-empty">Loading cart items...</p>
                ) : !transportCartItems.length ? (
                  <p className="transport-empty">Your transport cart is empty right now.</p>
                ) : (
                  transportCartItems.map((item) => (
                    <div className="transport-cart-item" key={item?._id || item?.id || `${item?.sourceId}-${item?.itemName}`}>
                      <div>
                        <strong>{item?.itemName || "Transport ticket"}</strong>
                        <p>{item?.providerName || "Operator"}</p>
                        <p>{item?.route || "Route not set"}</p>
                        <p>{item?.travelDate || "Date not set"}</p>
                      </div>
                      <div className="transport-cart-meta">
                        <strong>x{item?.quantity || 1}</strong>
                        <strong>BDT {Math.round(Number(item?.price || 0) * Number(item?.quantity || 1))}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="transport-cart-footer">
                <button className="button-light" type="button" onClick={loadTransportCart}>
                  Refresh Cart
                </button>
                <button className="button-main" type="button" onClick={handleProceed}>
                  Open Full Cart
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="cta-box">
        <div>
          <p className="sub-title">Budget and checkout</p>
          <h2>After choosing tickets, continue to your cart or budget planning.</h2>
        </div>
        <div className="button-row">
          <button className="button-main button-dark" type="button" onClick={handleProceed}>Open Cart</button>
          <Link className="button-light" to="/budget">Go to Budget Manager</Link>
        </div>
      </section>
    </main>
  );
}
