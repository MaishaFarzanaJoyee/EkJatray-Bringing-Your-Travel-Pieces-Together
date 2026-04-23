import { useEffect, useState } from "react";
import { getRecommendations } from "../services/joyeeService";

export default function JoyeeRecommendationPage() {
  const [budget, setBudget] = useState("");
  const [tags, setTags] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyResult, setEmptyResult] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: null, lng: null });

  useEffect(() => {
    const token = localStorage.getItem("ekjatrayToken");
    const currentUser = JSON.parse(localStorage.getItem("ekjatrayUser") || "{}");

    if (!token) {
      return;
    }

    if (currentUser.role === "admin") {
      // no-op for now; admin access is still supported via the token
    }
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError("");
    setEmptyResult(false);
    setDestinations([]);

    try {
      const data = await getRecommendations(budget, tags);
      if (!data || data.length === 0) {
        setEmptyResult(true);
      } else {
        setDestinations(data);
      }
    } catch (err) {
      setError("Unable to fetch recommended destinations. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const open3DView = (lat, lng) => {
    setCurrentCoords({ lat, lng });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCoords({ lat: null, lng: null });
  };

  return (
    <div className="page-content">
      <section className="page-section">
        <div className="section-header">
          <h1>Travel Recommendation</h1>
          <p>Search the best tour ideas for your budget and interests.</p>
        </div>

        <div className="card card-form">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Budget (BDT)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Preferences (e.g. beach, culture, nature)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
            />
            <button onClick={fetchRecommendations} className="button-primary">
              Search Recommendations
            </button>
          </div>
        </div>

        {loading && <div className="status-message">Loading your recommendations...</div>}
        {error && <div className="status-error">{error}</div>}
        {emptyResult && <div className="status-message">No results found for this query.</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <article key={dest._id || dest.id} className="card card-highlight">
              <div>
                <div className="card-title-row">
                  <h2>{dest.name}</h2>
                  <span className="badge">BDT {dest.cost}</span>
                </div>
                <p className="text-muted">{dest.description || "A curated travel suggestion."}</p>
                <div className="tag-row">
                  {(dest.tags || []).map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => open3DView(dest.coordinates?.lat, dest.coordinates?.lng)} className="button-secondary">
                View 3D Preview
              </button>
            </article>
          ))}
        </div>
      </section>

      {isModalOpen && currentCoords.lat && currentCoords.lng && (
        <div className="page-modal">
          <div className="modal-panel">
            <div className="modal-header">
              <h3>3D Destination Preview</h3>
              <button onClick={closeModal} className="button-text">
                Close
              </button>
            </div>
            <iframe
              title="3D GPS View"
              className="modal-frame"
              src={`https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&t=k&z=15&output=embed`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
