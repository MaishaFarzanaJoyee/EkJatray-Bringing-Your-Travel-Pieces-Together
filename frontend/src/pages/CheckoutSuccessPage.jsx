import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrderById } from "../services/cartCheckoutService";

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";

  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("Verifying your payment result...");

  useEffect(() => {
    if (!orderId) {
      setMessage("Missing order id. If payment succeeded, webhook will still confirm your booking.");
      return;
    }

    (async () => {
      try {
        const result = await getOrderById(orderId);
        setOrder(result.order || null);
        setMessage("Payment completed. Booking status will become confirmed after webhook processing.");
      } catch {
        setMessage("Payment page returned successfully. We could not fetch order details right now.");
      }
    })();
  }, [orderId]);

  return (
    <main>
      <section className="card review-card-shell">
        <h2>Payment Success</h2>
        <p>{message}</p>

        {order ? (
          <div className="order-head">
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
            <p><strong>Booking Status:</strong> {order.bookingStatus}</p>
            <p><strong>Total:</strong> {(order.currency || "bdt").toUpperCase()} {Number(order.totalAmount || 0).toFixed(2)}</p>
          </div>
        ) : null}

        <div className="button-row">
          <Link className="button-main" to="/cart">Back to Cart</Link>
          <Link className="button-light" to="/reviews">Go to Reviews</Link>
        </div>
      </section>
    </main>
  );
}
