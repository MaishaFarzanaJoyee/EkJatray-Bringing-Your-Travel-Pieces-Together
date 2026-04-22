import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";
import {
  createReview,
  deleteReview,
  getHotelsByDistrict,
  getMyBookingsForReview,
  getMyReviews,
  getPublicProviderProfile,
  getPublicReviews,
  updateReview,
} from "../services/reviewService";

const defaultSearch = {
  targetType: "hotel",
  districtName: "",
};

const defaultForm = {
  stayRecordId: "",
  targetType: "hotel",
  targetId: "",
  targetName: "",
  rating: 5,
  reviewText: "",
};

export default function ReviewPage() {
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState(defaultSearch);
  const [publicReviews, setPublicReviews] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  const [districtHotels, setDistrictHotels] = useState([]);
  const [expandedHotelId, setExpandedHotelId] = useState("");
  const [expandedHotelReviews, setExpandedHotelReviews] = useState([]);
  const [publicMessage, setPublicMessage] = useState("Showing latest public reviews.");

  const [myBookings, setMyBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingReviewId, setEditingReviewId] = useState("");

  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPublicReviews(filter = {}) {
    try {
      const result = await getPublicReviews(filter);
      const rows = Array.isArray(result.reviews) ? result.reviews : [];
      setPublicReviews(rows);
      if (!rows.length) {
        setPublicMessage("No public reviews found for this filter.");
      } else {
        setPublicMessage(`Showing ${rows.length} public review(s).`);
      }
    } catch (error) {
      setPublicReviews([]);
      setPublicMessage(error?.response?.data?.message || "Could not load public reviews.");
    }
  }

  async function loadPrivateData() {
    if (!isAuthenticated) {
      setMyBookings([]);
      setMyReviews([]);
      return;
    }

    try {
      const [bookingResult, reviewResult] = await Promise.all([getMyBookingsForReview(), getMyReviews()]);
      setMyBookings(Array.isArray(bookingResult.bookings) ? bookingResult.bookings : []);
      setMyReviews(Array.isArray(reviewResult.reviews) ? reviewResult.reviews : []);
    } catch {
      setMyBookings([]);
      setMyReviews([]);
    }
  }

  useEffect(() => {
    loadPublicReviews();
  }, []);

  useEffect(() => {
    loadPrivateData();
  }, [isAuthenticated]);

  function onChangeSearch(event) {
    const { name, value } = event.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmitSearch(event) {
    event.preventDefault();
    setErrorMessage("");

    const filter = {};
    if (search.targetType.trim()) {
      filter.targetType = search.targetType.trim();
    }
    if (search.districtName.trim()) {
      filter.districtName = search.districtName.trim().toLowerCase();
    }

    await loadPublicReviews(filter);

    if (!search.districtName.trim() || filter.targetType !== "hotel") {
      setDistrictHotels([]);
      setPublicProfile(null);
      return;
    }

    try {
      const result = await getHotelsByDistrict(search.districtName.trim());
      setDistrictHotels(Array.isArray(result.hotels) ? result.hotels : []);
    } catch {
      setDistrictHotels([]);
    }
  }

  async function onToggleHotelReviews(hotel) {
    if (expandedHotelId === hotel.targetId) {
      setExpandedHotelId("");
      setExpandedHotelReviews([]);
      setPublicProfile(null);
      return;
    }

    setPublicProfile(null);

    try {
      const result = await getPublicProviderProfile("hotel", hotel.targetId);
      setPublicProfile(result.profile || null);
      setExpandedHotelReviews(Array.isArray(result.reviews) ? result.reviews : []);
      setExpandedHotelId(hotel.targetId);
    } catch {
      setPublicProfile(null);
      setExpandedHotelReviews([]);
      setExpandedHotelId("");
    }
  }

  function onSelectStay(event) {
    const stayId = event.target.value;
    const selected = myBookings.find((row) => row._id === stayId || row.stayRecordId === stayId);

    if (!selected) {
      setForm(defaultForm);
      return;
    }

    setForm((prev) => ({
      ...prev,
      stayRecordId: selected._id,
      targetType: selected.targetType,
      targetId: selected.targetId,
      targetName: selected.targetName,
    }));
  }

  function onFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearForm() {
    setEditingReviewId("");
    setForm(defaultForm);
  }

  async function onSubmitReview(event) {
    event.preventDefault();
    setInfoMessage("");
    setErrorMessage("");

    try {
      const payload = {
        ...form,
        rating: Number(form.rating),
      };

      if (editingReviewId) {
        await updateReview(editingReviewId, {
          rating: payload.rating,
          reviewText: payload.reviewText,
        });
        setInfoMessage("Review updated successfully.");
      } else {
        await createReview(payload);
        setInfoMessage("Review created successfully.");
      }

      clearForm();
      await Promise.all([loadPublicReviews(), loadPrivateData()]);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Could not save review.");
    }
  }

  function startEditReview(review) {
    setEditingReviewId(review._id);
    setForm({
      stayRecordId: review.stayRecordId,
      targetType: review.targetType,
      targetId: review.targetId,
      targetName: review.targetName,
      rating: Number(review.rating || 5),
      reviewText: review.reviewText || "",
    });
  }

  async function onDeleteReview(reviewId) {
    const ok = window.confirm("Delete this review?");
    if (!ok) {
      return;
    }

    setInfoMessage("");
    setErrorMessage("");

    try {
      await deleteReview(reviewId);
      setInfoMessage("Review deleted successfully.");
      await Promise.all([loadPublicReviews(), loadPrivateData()]);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Could not delete review.");
    }
  }

  const eligibleOptions = useMemo(() => {
    return myBookings.map((stay) => ({
      value: stay._id,
      label: `${stay.targetName} (${stay.targetType}, ${stay.districtName || "district unknown"}) - ${stay.status}${stay.review ? " - reviewed" : ""}`,
    }));
  }, [myBookings]);

  return (
    <main>
      <section className="section-title compact">
        <p className="sub-title">Trust and Transparency</p>
        <h2>Review and Rating</h2>
        <p className="transport-muted">
          Everyone can read reviews. Only users with valid staying or completed records can submit.
        </p>
      </section>

      <section className="card review-card-shell">
        <h3>Reviews</h3>
        <form className="review-search" onSubmit={onSubmitSearch}>
          <label>
            Type
            <select name="targetType" value={search.targetType} onChange={onChangeSearch}>
              <option value="hotel">Hotel</option>
              <option value="transport">Transportation</option>
              <option value="localArtisan">Local Artisan</option>
            </select>
          </label>

          <label>
            District Name
            <select
              name="districtName"
              value={search.districtName}
              onChange={onChangeSearch}
            >
              <option value="">All districts</option>
              {bangladeshDistricts.map((district) => (
                <option value={district} key={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>

          <button className="button-main" type="submit">Search</button>
        </form>

        <p className="transport-muted">{publicMessage}</p>

        {publicProfile ? (
          <div className="result-grid review-summary-grid">
            <div className="result-item">
              <span>Provider</span>
              <strong>{publicProfile.targetName || "Unknown"}</strong>
            </div>
            <div className="result-item">
              <span>Average Rating</span>
              <strong>{Number(publicProfile.averageRating || 0).toFixed(2)} / 5</strong>
            </div>
            <div className="result-item">
              <span>Total Reviews</span>
              <strong>{publicProfile.totalReviews || 0}</strong>
            </div>
          </div>
        ) : null}

        {districtHotels.length ? (
          <div className="review-list-grid">
            {districtHotels.map((hotel) => (
              <article className="review-row" key={hotel.targetId}>
                <div>
                  <h4>{hotel.targetName}</h4>
                  <p className="transport-muted">District: {hotel.districtName}</p>
                </div>
                <p className="review-rating">{Number(hotel.averageRating || 0).toFixed(2)} / 5</p>
                <p className="transport-muted">{hotel.totalReviews} review(s)</p>
                <div className="button-row">
                  <button className="button-light" type="button" onClick={() => onToggleHotelReviews(hotel)}>
                    {expandedHotelId === hotel.targetId ? "Hide Reviews" : "View Reviews"}
                  </button>
                </div>

                {expandedHotelId === hotel.targetId ? (
                  <div className="review-expand-box">
                    <p className="transport-muted review-expand-title">
                      All reviews for {hotel.targetName}
                    </p>
                    {!expandedHotelReviews.length ? (
                      <p className="transport-muted">No reviews found for this hotel.</p>
                    ) : (
                      expandedHotelReviews.map((review) => (
                        <article className="review-row review-row-nested" key={review._id}>
                          <p className="review-rating">{review.rating} / 5</p>
                          <p>{review.reviewText}</p>
                          <p className="transport-muted">
                            By {review.userName || "Traveler"} on {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {!districtHotels.length ? (
          <div className="review-list-grid">
            {publicReviews.map((review) => (
              <article className="review-row" key={review._id}>
                <div>
                  <h4>{review.targetName}</h4>
                  <p className="transport-muted">
                    {review.targetType} | {review.districtName || "unknown district"}
                  </p>
                </div>
                <p className="review-rating">{review.rating} / 5</p>
                <p>{review.reviewText}</p>
                <p className="transport-muted">
                  By {review.userName || "Traveler"} on {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card review-card-shell">
        <h3>Submit and Manage My Reviews</h3>

        {!isAuthenticated ? (
          <p className="transport-muted">
            Please <Link to="/login">login</Link> to submit, edit, or delete your own reviews.
          </p>
        ) : (
          <>
            {!myBookings.length ? (
              <p className="transport-muted">
                No booked hotel or transportation found for your account yet.
              </p>
            ) : (
              <div className="review-list-grid">
                {myBookings.map((booking) => (
                  <article className="review-row" key={booking._id}>
                    <div>
                      <h4>{booking.targetName}</h4>
                      <p className="transport-muted">
                        {booking.targetType} | {booking.districtName || "unknown district"}
                      </p>
                    </div>
                    <p className="transport-muted">Status: {booking.status}</p>
                    {booking.review ? (
                      <p className="transport-muted">Reviewed: {booking.review.rating}/5</p>
                    ) : (
                      <p className="transport-muted">Not reviewed yet</p>
                    )}
                    <div className="button-row">
                      <button
                        className="button-light"
                        type="button"
                        onClick={() =>
                          onSelectStay({ target: { value: booking._id } })
                        }
                      >
                        Review This Booking
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {infoMessage ? <p className="form-success">{infoMessage}</p> : null}
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <form className="review-form" onSubmit={onSubmitReview}>
              <label>
                My Booked Service
                <select value={form.stayRecordId} onChange={onSelectStay} required>
                  <option value="">Select a booked service</option>
                  {eligibleOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Rating (1 to 5)
                <select name="rating" value={form.rating} onChange={onFormChange} required>
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </select>
              </label>

              <label>
                Review Text
                <input
                  name="reviewText"
                  value={form.reviewText}
                  onChange={onFormChange}
                  placeholder="Share your experience"
                  required
                />
              </label>

              <div className="button-row">
                <button className="button-main" type="submit">
                  {editingReviewId ? "Update Review" : "Create Review"}
                </button>
                {editingReviewId ? (
                  <button className="button-light" type="button" onClick={clearForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="review-list-grid">
              {myReviews.map((review) => (
                <article className="review-row" key={review._id}>
                  <div>
                    <h4>{review.targetName}</h4>
                    <p className="transport-muted">
                      {review.targetType} | {review.districtName || "unknown district"}
                    </p>
                  </div>
                  <p className="review-rating">{review.rating} / 5</p>
                  <p>{review.reviewText}</p>
                  <div className="button-row">
                    <button className="button-light" type="button" onClick={() => startEditReview(review)}>
                      Edit
                    </button>
                    <button className="button-light" type="button" onClick={() => onDeleteReview(review._id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
