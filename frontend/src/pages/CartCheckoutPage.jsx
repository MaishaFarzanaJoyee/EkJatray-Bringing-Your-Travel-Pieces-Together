import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  clearMyCart,
  getMyOrders,
  getMyCart,
  markOrderCompleted,
  removeCartItem,
  updateCartItem,
} from "../services/cartCheckoutService";
import { createReview, getMyBookingsForReview } from "../services/reviewService";

export default function CartCheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [orders, setOrders] = useState([]);
  const [reviewBookings, setReviewBookings] = useState([]);
  const [activeReviewKey, setActiveReviewKey] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [message, setMessage] = useState("Loading your cart...");
  const [error, setError] = useState("");

  async function loadCart() {
    try {
      const result = await getMyCart();
      setCart(result.cart || { items: [], totalAmount: 0 });
      setMessage("Cart loaded.");
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load cart");
    }
  }

  async function loadOrders() {
    try {
      const result = await getMyOrders();
      setOrders(Array.isArray(result.orders) ? result.orders : []);
    } catch {
      setOrders([]);
    }
  }

  async function loadReviewBookings() {
    try {
      const result = await getMyBookingsForReview();
      setReviewBookings(Array.isArray(result.bookings) ? result.bookings : []);
    } catch {
      setReviewBookings([]);
    }
  }

  useEffect(() => {
    loadCart();
    loadOrders();
    loadReviewBookings();
  }, []);

  function getItemReviewKey(item) {
    return `${item.providerType || item.serviceType}:${item.sourceId || item._id}`;
  }

  function findBookingForItem(item) {
    const targetType = item.providerType || item.serviceType;
    const targetId = item.sourceId || "";

    if (!targetType || !targetId) {
      return null;
    }

    const candidates = reviewBookings.filter(
      (booking) => booking.targetType === targetType && booking.targetId === targetId
    );

    if (!candidates.length) {
      return null;
    }

    const notReviewed = candidates.find((booking) => !booking.review);
    return notReviewed || candidates[0];
  }

  function openReviewForm(item) {
    const key = getItemReviewKey(item);
    setActiveReviewKey((prev) => (prev === key ? "" : key));

    setReviewDrafts((prev) => ({
      ...prev,
      [key]: prev[key] || { rating: 5, reviewText: "" },
    }));
  }

  function changeReviewDraft(item, field, value) {
    const key = getItemReviewKey(item);
    setReviewDrafts((prev) => ({
      ...prev,
      [key]: {
        rating: Number(prev[key]?.rating || 5),
        reviewText: prev[key]?.reviewText || "",
        [field]: value,
      },
    }));
  }

  async function submitItemReview(item) {
    const booking = findBookingForItem(item);

    if (!booking) {
      setError("No eligible booking found for this item yet.");
      return;
    }

    const key = getItemReviewKey(item);
    const draft = reviewDrafts[key] || { rating: 5, reviewText: "" };

    if (!String(draft.reviewText || "").trim()) {
      setError("Please write a review text before submitting.");
      return;
    }

    try {
      await createReview({
        stayRecordId: booking._id || booking.stayRecordId,
        targetType: booking.targetType,
        targetId: booking.targetId,
        targetName: booking.targetName,
        rating: Number(draft.rating || 5),
        reviewText: String(draft.reviewText || "").trim(),
      });

      setMessage("Review submitted successfully.");
      setError("");
      setActiveReviewKey("");
      await loadReviewBookings();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit review");
    }
  }

  async function handleUpdateItemQuantity(itemId, nextQuantity) {
    try {
      const result = await updateCartItem(itemId, { quantity: nextQuantity });
      setCart(result.cart || { items: [], totalAmount: 0 });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update item");
    }
  }

  async function handleRemoveItem(itemId) {
    try {
      const result = await removeCartItem(itemId);
      setCart(result.cart || { items: [], totalAmount: 0 });
      setMessage("Item removed from cart.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not remove item");
    }
  }

  async function handleClearCart() {
    try {
      const result = await clearMyCart();
      setCart(result.cart || { items: [], totalAmount: 0 });
      setMessage("Cart has been cleared.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not clear cart");
    }
  }

  async function handleMarkCompleted(orderId) {
    try {
      await markOrderCompleted(orderId);
      setMessage("Order marked as completed. You can now submit item reviews.");
      await Promise.all([loadOrders(), loadReviewBookings()]);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not mark order completed");
    }
  }

  const itemCount = useMemo(() => {
    return (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cart.items]);

  return (
    <main>
      <section className="card review-card-shell">
        <h2>{user?.name ? `${user.name}'s Cart` : "My Cart"}</h2>
        <p className="section-intro">
          Selected tickets are saved here. Update quantities or remove items before checkout.
        </p>

        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <div className="cart-stats-row">
          <div className="result-item">
            <span>Total Items</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="result-item">
            <span>Grand Total (BDT)</span>
            <strong>{Number(cart.totalAmount || 0).toFixed(2)}</strong>
          </div>
        </div>

      </section>

      <section className="card review-card-shell">
        <h3>Current Cart Items</h3>
        {!cart.items?.length ? <p>No items in cart yet.</p> : null}

        {cart.items?.length ? (
          <div className="module-table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Provider</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.serviceType}</td>
                    <td>{item.providerName}</td>
                    <td>{item.itemName}</td>
                    <td>
                      <input className="qty-input" type="number" min="1" value={item.quantity} onChange={(e) => handleUpdateItemQuantity(item._id, Number(e.target.value || 1))} />
                    </td>
                    <td>{Number(item.price).toFixed(2)}</td>
                    <td>{item.status}</td>
                    <td>
                      <button className="button-light" type="button" onClick={() => handleRemoveItem(item._id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="button-row">
          <button type="button" className="button-light" onClick={handleClearCart}>Clear Cart</button>
          <button
            type="button"
            className="button-main"
            onClick={() => navigate("/checkout")}
            disabled={!cart.items?.length}
          >
            Proceed
          </button>
        </div>
      </section>

      <section className="card review-card-shell">
        <h3>My Booking Orders</h3>
        {!orders.length ? <p>No order history yet.</p> : null}

        {orders.map((order) => (
          <article className="order-card" key={order._id}>
            <div className="order-head">
              <p><strong>Order ID:</strong> {order._id}</p>
              <p><strong>Payment:</strong> {order.paymentStatus}</p>
              <p><strong>Booking:</strong> {order.bookingStatus}</p>
              <p><strong>Total:</strong> {(order.currency || "bdt").toUpperCase()} {Number(order.totalAmount || 0).toFixed(2)}</p>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div key={item._id} className="order-item-row">
                  <p>{item.itemName} | {item.providerName} | Qty {item.quantity} | {item.bookingStatus}</p>

                  {order.bookingStatus === "completed" && item.bookingStatus === "completed" ? (
                    <>
                      {findBookingForItem(item)?.review ? (
                        <p className="transport-muted">Reviewed: {findBookingForItem(item)?.review?.rating}/5</p>
                      ) : (
                        <div className="button-row">
                          <button
                            className="button-light"
                            type="button"
                            onClick={() => openReviewForm(item)}
                          >
                            {activeReviewKey === getItemReviewKey(item) ? "Close Review" : "Write Review"}
                          </button>
                        </div>
                      )}

                      {activeReviewKey === getItemReviewKey(item) && !findBookingForItem(item)?.review ? (
                        <div className="inline-review-form">
                          <label>
                            Star Rating
                            <select
                              value={Number(reviewDrafts[getItemReviewKey(item)]?.rating || 5)}
                              onChange={(e) => changeReviewDraft(item, "rating", Number(e.target.value))}
                            >
                              <option value={5}>5</option>
                              <option value={4}>4</option>
                              <option value={3}>3</option>
                              <option value={2}>2</option>
                              <option value={1}>1</option>
                            </select>
                          </label>

                          <label>
                            Review
                            <textarea
                              rows="3"
                              value={reviewDrafts[getItemReviewKey(item)]?.reviewText || ""}
                              onChange={(e) => changeReviewDraft(item, "reviewText", e.target.value)}
                              placeholder="Write your review"
                            />
                          </label>

                          <button
                            className="button-main"
                            type="button"
                            onClick={() => submitItemReview(item)}
                          >
                            Submit Review
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            {order.paymentStatus === "paid" && order.bookingStatus !== "completed" ? (
              <button className="button-main" type="button" onClick={() => handleMarkCompleted(order._id)}>Mark Booking Completed</button>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
