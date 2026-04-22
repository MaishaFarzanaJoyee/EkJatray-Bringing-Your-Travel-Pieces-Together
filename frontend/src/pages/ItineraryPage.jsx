import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Link, useParams } from "react-router-dom";
import { getCachedItinerary, getItinerary } from "../services/itineraryService";

function formatDateTime(value) {
  if (!value) {
    return "Pending schedule";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Pending schedule";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildOfflinePassPayload(itinerary) {
  return {
    tripTitle: itinerary.tripTitle,
    passToken: itinerary.passToken,
    createdAt: itinerary.createdAt,
    timeline: (itinerary.timelineEntries || []).map((entry) => ({
      kind: entry.kind,
      title: entry.title,
      subtitle: entry.subtitle,
      destination: entry.destination,
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      notes: entry.notes,
    })),
  };
}

export default function ItineraryPage() {
  const { itineraryId } = useParams();
  const [itinerary, setItinerary] = useState(() => getCachedItinerary(itineraryId));
  const [status, setStatus] = useState(() => (itinerary ? "Loaded offline itinerary snapshot." : "Loading itinerary..."));
  const [qrImage, setQrImage] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const result = await getItinerary(itineraryId);
        if (!active) {
          return;
        }

        setItinerary(result.itinerary);
        setStatus("Latest itinerary loaded. This pass is also saved for offline access on this device.");
      } catch (error) {
        if (!active) {
          return;
        }

        const cached = getCachedItinerary(itineraryId);
        if (cached) {
          setItinerary(cached);
          setStatus("Showing the saved offline itinerary because the live trip data could not be refreshed.");
        } else {
          setStatus(error?.response?.data?.message || "Unable to load itinerary.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [itineraryId]);

  useEffect(() => {
    if (!itinerary) {
      return;
    }

    const payload = JSON.stringify(buildOfflinePassPayload(itinerary));
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: "#1f2a37",
        light: "#fffaf4",
      },
    })
      .then(setQrImage)
      .catch(() => setQrImage(""));
  }, [itinerary]);

  const scheduledEntries = useMemo(
    () => (itinerary?.timelineEntries || []).filter((entry) => entry.isScheduled),
    [itinerary]
  );

  const unscheduledEntries = useMemo(
    () => (itinerary?.timelineEntries || []).filter((entry) => !entry.isScheduled),
    [itinerary]
  );

  return (
    <main>
      <section className="section">
        <div className="section-title">
          <p className="sub-title">Dynamic itinerary and offline QR pass</p>
          <h2>{itinerary?.tripTitle || "Your trip itinerary"}</h2>
          <p className="description transport-intro">
            {status}
          </p>
        </div>

        <div className="itinerary-grid">
          <article className="card">
            <div className="transport-panel-header">
              <div>
                <h3>Chronological Timeline</h3>
                <p className="transport-muted">
                  Scheduled bookings are ordered by timestamp so you can move through the trip without hunting through confirmations.
                </p>
              </div>
              {itinerary?.stats && (
                <span className="transport-badge">
                  {itinerary.stats.scheduledCount || 0} scheduled
                </span>
              )}
            </div>

            <div className="itinerary-timeline">
              {!scheduledEntries.length && <p className="transport-empty">No scheduled timeline entries yet.</p>}
              {scheduledEntries.map((entry, index) => (
                <div className="itinerary-entry" key={`${entry.title}-${entry.startsAt || index}`}>
                  <div className="itinerary-dot" aria-hidden="true" />
                  <div className="itinerary-entry-body">
                    <p className="transport-mode-tag">{entry.kind.replace("-", " ")}</p>
                    <h4>{entry.title}</h4>
                    <p className="transport-muted">{entry.subtitle || entry.destination || "Trip item"}</p>
                    <p className="itinerary-time">{formatDateTime(entry.startsAt)}</p>
                    {!!entry.endsAt && entry.endsAt !== entry.startsAt && (
                      <p className="transport-muted">Ends {formatDateTime(entry.endsAt)}</p>
                    )}
                    {!!entry.notes && <p className="safety-notes">{entry.notes}</p>}
                  </div>
                </div>
              ))}
            </div>

            {!!unscheduledEntries.length && (
              <div className="itinerary-unscheduled">
                <h3>Needs Scheduling</h3>
                <div className="transport-results">
                  {unscheduledEntries.map((entry, index) => (
                    <div className="transport-empty" key={`${entry.title}-pending-${index}`}>
                      <strong>{entry.title}</strong>
                      <p className="transport-muted">{entry.subtitle || entry.destination || "Trip item"}</p>
                      <p className="transport-muted">{entry.notes || "Add a planned time before the trip so it can be placed in the timeline."}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="card itinerary-pass-card">
            <div className="transport-panel-header">
              <div>
                <h3>Offline QR Pass</h3>
                <p className="transport-muted">This QR stores the schedule payload itself, so you can reopen the core trip plan without a network request.</p>
              </div>
              <span className="transport-badge">Offline ready</span>
            </div>

            {qrImage ? (
              <img className="itinerary-qr" src={qrImage} alt="Offline itinerary QR pass" />
            ) : (
              <p className="transport-empty">Generating QR pass...</p>
            )}

            <div className="itinerary-pass-meta">
              <p><strong>Pass token:</strong> {itinerary?.passToken || "Pending"}</p>
              <p><strong>Created:</strong> {formatDateTime(itinerary?.createdAt)}</p>
            </div>

            <div className="button-row">
              <Link className="button-main" to="/">Back to Planner</Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
