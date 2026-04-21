import { useEffect, useState } from "react";
import { getMyProfile } from "../services/authService";
import {
  createTransportTicket,
  deleteTransportTicket,
  searchTransportTickets,
  updateTransportTicket,
} from "../services/transportService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

function formatDuration(durationMinutes) {
  const totalMinutes = Number(durationMinutes);

  if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
    return "N/A";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function AdminPage() {
  const [adminStatus, setAdminStatus] = useState("Checking admin permission...");
  const [isAllowed, setIsAllowed] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [listMessage, setListMessage] = useState("No tickets loaded.");
  const [editingTicketId, setEditingTicketId] = useState("");

  const [form, setForm] = useState({
    mode: "flight",
    title: "",
    operator: "",
    origin: "",
    destination: "",
    travelDate: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    seatTypes: "",
    seatsAvailable: "",
  });

  function getTicketPayloadFromForm() {
    return {
      mode: form.mode,
      title: form.title.trim(),
      operator: form.operator.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      travelDate: form.travelDate,
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
      price: Number(form.price),
      seatTypes: form.seatTypes
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      seatsAvailable: Number(form.seatsAvailable),
    };
  }

  function resetTicketForm() {
    setEditingTicketId("");
    setForm({
      mode: "flight",
      title: "",
      operator: "",
      origin: "",
      destination: "",
      travelDate: "",
      departureTime: "",
      arrivalTime: "",
      price: "",
      seatTypes: "",
      seatsAvailable: "",
    });
  }

  function fillTicketForm(ticket) {
    setEditingTicketId(ticket._id);
    setForm({
      mode: ticket.mode || "flight",
      title: ticket.title || "",
      operator: ticket.operator || "",
      origin: ticket.origin || "",
      destination: ticket.destination || "",
      travelDate: ticket.travelDate || "",
      departureTime: ticket.departureTime || "",
      arrivalTime: ticket.arrivalTime || "",
      price: ticket.price || "",
      seatTypes: (ticket.seatTypes || []).join(", "),
      seatsAvailable: ticket.seatsAvailable ?? "",
    });
  }

  async function verifyAdminAccess() {
    try {
      const result = await getMyProfile();

      if (result.user.role !== "admin") {
        setAdminStatus("You are logged in, but this account does not have admin permission.");
        setIsAllowed(false);
        return;
      }

      setAdminStatus(`Welcome ${result.user.name}. You can manage transport tickets here.`);
      setIsAllowed(true);
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || "Unable to connect to the server.");
      setIsAllowed(false);
    }
  }

  async function loadTicketList() {
    setListMessage("Loading tickets...");

    try {
      const result = await searchTransportTickets();

      const nextTickets = Array.isArray(result.tickets) ? result.tickets : [];
      setTickets(nextTickets);

      if (nextTickets.length === 0) {
        setListMessage("No transport tickets found. Create one from the form.");
      } else {
        setListMessage("");
      }
    } catch (error) {
      setTickets([]);
      setListMessage(error?.response?.data?.message || error?.response?.data?.error || "Unable to load tickets.");
    }
  }

  async function deleteTicket(ticketId) {
    const ok = window.confirm("Delete this ticket?");
    if (!ok) {
      return;
    }

    try {
      await deleteTransportTicket(ticketId);
      setAdminStatus("Ticket deleted successfully.");
      if (editingTicketId === ticketId) {
        resetTicketForm();
      }
      loadTicketList();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Delete failed.");
    }
  }

  async function submitTicketForm(event) {
    event.preventDefault();

    const payload = getTicketPayloadFromForm();
    const isEdit = Boolean(editingTicketId);

    try {
      if (isEdit) {
        await updateTransportTicket(editingTicketId, payload);
      } else {
        await createTransportTicket(payload);
      }

      setAdminStatus(isEdit ? "Ticket updated successfully." : "Ticket created successfully.");
      resetTicketForm();
      loadTicketList();
    } catch (error) {
      setAdminStatus(error?.response?.data?.message || error?.response?.data?.error || "Unable to connect to the server.");
    }
  }

  useEffect(() => {
    (async () => {
      await verifyAdminAccess();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAllowed) {
      loadTicketList();
    }
  }, [isAllowed]);

  return (
    <main>
      <section className="section">
        <div className="section-title compact">
          <p className="sub-title">Admin</p>
          <h2>Transport Ticket Management</h2>
        </div>

        <div className="result-box">{adminStatus}</div>
      </section>

      {isAllowed && (
        <section className="section">
          <div className="admin-panel-grid">
            <article className="card">
              <h3>{editingTicketId ? "Edit Transport Ticket" : "Create Transport Ticket"}</h3>
              <form onSubmit={submitTicketForm}>
                <label htmlFor="mode">Mode</label>
                <select id="mode" required value={form.mode} onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                </select>

                <label htmlFor="title">Title</label>
                <input id="title" type="text" placeholder="Dhaka to Sylhet Air Express" required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />

                <label htmlFor="operator">Operator</label>
                <input id="operator" type="text" placeholder="SkyRoute" required value={form.operator} onChange={(event) => setForm((prev) => ({ ...prev, operator: event.target.value }))} />

                <label htmlFor="origin">Origin</label>
                <select id="origin" required value={form.origin} onChange={(event) => setForm((prev) => ({ ...prev, origin: event.target.value }))}>
                  <option value="">Select district</option>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`origin-${district}`}>{district}</option>
                  ))}
                </select>

                <label htmlFor="destination">Destination</label>
                <select id="destination" required value={form.destination} onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}>
                  <option value="">Select district</option>
                  {bangladeshDistricts.map((district) => (
                    <option value={district} key={`dest-${district}`}>{district}</option>
                  ))}
                </select>

                <label htmlFor="travelDate">Travel Date</label>
                <input id="travelDate" type="date" required value={form.travelDate} onChange={(event) => setForm((prev) => ({ ...prev, travelDate: event.target.value }))} />

                <label htmlFor="departureTime">Departure Time</label>
                <input id="departureTime" type="time" required value={form.departureTime} onChange={(event) => setForm((prev) => ({ ...prev, departureTime: event.target.value }))} />

                <label htmlFor="arrivalTime">Arrival Time</label>
                <input id="arrivalTime" type="time" required value={form.arrivalTime} onChange={(event) => setForm((prev) => ({ ...prev, arrivalTime: event.target.value }))} />

                <label htmlFor="price">Price</label>
                <input id="price" type="number" min="0" step="1" required value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />

                <label htmlFor="seatTypes">Seat Types (comma separated)</label>
                <input id="seatTypes" type="text" placeholder="Window, Aisle, Business" required value={form.seatTypes} onChange={(event) => setForm((prev) => ({ ...prev, seatTypes: event.target.value }))} />

                <label htmlFor="seatsAvailable">Seats Available</label>
                <input id="seatsAvailable" type="number" min="0" step="1" required value={form.seatsAvailable} onChange={(event) => setForm((prev) => ({ ...prev, seatsAvailable: event.target.value }))} />

                <div className="button-row">
                  <button className="button-main" type="submit">{editingTicketId ? "Update Ticket" : "Create Ticket"}</button>
                  {editingTicketId && (
                    <button className="button-light" type="button" onClick={resetTicketForm}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </article>

            <article className="card">
              <h3>Transport Tickets</h3>
              <button className="button-light" type="button" onClick={loadTicketList}>Refresh List</button>

              <div className="result-box">
                {listMessage && <p>{listMessage}</p>}

                {tickets.map((ticket) => (
                  <div className="result-item admin-ticket-item" key={ticket._id}>
                    <p><strong>{ticket.title}</strong> ({ticket.mode})</p>
                    <p>{ticket.origin} -&gt; {ticket.destination} | {ticket.travelDate}</p>
                    <p>Price: {ticket.price} | Duration: {formatDuration(ticket.duration)} | Seats: {ticket.seatsAvailable}</p>
                    <div className="button-row">
                      <button className="button-light" type="button" onClick={() => fillTicketForm(ticket)}>Edit</button>
                      <button className="button-light" type="button" onClick={() => deleteTicket(ticket._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
