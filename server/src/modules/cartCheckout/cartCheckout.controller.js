import Stripe from "stripe";
import mongoose from "mongoose";
import UnifiedCart from "./cart.model.js";
import CheckoutOrder from "./order.model.js";
import TransportTicket from "../transport/transport.model.js";
import Destination from "../recommendation/destination.model.js";
import StayRecord from "../reviewRating/stayRecord.model.js";
import User from "../auth/user.model.js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const checkoutCurrency = (process.env.CHECKOUT_CURRENCY || "bdt").toLowerCase();

function getUserId(req) {
  return req?.user?.userId || "";
}

function toSafeText(value = "") {
  return value.toString().trim();
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

async function getOrCreateCart(userId) {
  const existing = await UnifiedCart.findOne({ userId });
  if (existing) {
    return existing;
  }

  return UnifiedCart.create({ userId, items: [], totalAmount: 0 });
}

function getTransportSeatRequestMap(items = []) {
  return items.reduce((quantityMap, item) => {
    if (item?.providerType !== "transport") {
      return quantityMap;
    }

    const sourceId = toSafeText(item?.sourceId);
    if (!sourceId || !mongoose.Types.ObjectId.isValid(sourceId)) {
      return quantityMap;
    }
//check for the previous same ticket record
    const currentQuantity = Math.max(1, toSafeNumber(item?.quantity, 1));
    quantityMap.set(sourceId, (quantityMap.get(sourceId) || 0) + currentQuantity);
    return quantityMap;
  }, new Map());
}

async function checkTransportSeatAvailability(item, quantity) {
  const ticketId = toSafeText(item?.sourceId);
  if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
    return { ok: true };
  }

  const ticket = await TransportTicket.findById(ticketId).select("seatsAvailable title");
  if (!ticket) {
    return { ok: false, message: "Transport ticket not found" };
  }

  if (Number(ticket.seatsAvailable) < Number(quantity)) {
    return {
      ok: false,
      message: `Only ${ticket.seatsAvailable} seats are available for ${toSafeText(ticket.title) || "this ticket"}`,
    };
  }

  return { ok: true, ticket };
}

async function deductTransportSeatsAfterPayment(items = []) {
  const requests = getTransportSeatRequestMap(items);

  for (const [ticketId, quantity] of requests.entries()) {
    await TransportTicket.updateOne(
      {
        _id: ticketId,
        seatsAvailable: { $gte: quantity },
      },
      {
        $inc: { seatsAvailable: -quantity },
      }
    );
  }
}

function parseDistrictFromRoute(route = "") {
  const text = toSafeText(route).toLowerCase();
  if (!text.includes(" to ")) {
    return "";
  }
  const parts = text.split(" to ");
  return toSafeText(parts[parts.length - 1]).toLowerCase();
}

async function resolveDistrictName(item) {
  const fromRoute = parseDistrictFromRoute(item?.route || item?.notes || "");
  if (fromRoute) {
    return fromRoute;
  }

  if (item?.providerType === "transport" && mongoose.Types.ObjectId.isValid(toSafeText(item?.sourceId))) {
    const ticket = await TransportTicket.findById(item.sourceId).select("destination");
    if (ticket?.destination) {
      return toSafeText(ticket.destination).toLowerCase();
    }
  }

  return "";
}

async function createStayRecordsFromPaidOrder(order) {
  if (!order || !Array.isArray(order.items)) {
    return;
  }

  const user = await User.findById(order.userId).select("name email");
  const userEmail = toSafeText(user?.email).toLowerCase() || "unknown@ekjatray.local";
  const userName = toSafeText(user?.name);

  for (const item of order.items) {
    if (item.providerType !== "hotel" && item.providerType !== "transport") {
      continue;
    }

    await StayRecord.create({
      userId: order.userId,
      userEmail,
      userName,
      targetType: item.providerType,
      targetId: toSafeText(item.sourceId) || `${item.providerType}-${item._id}`,
      targetName: toSafeText(item.providerName) || toSafeText(item.itemName),
      districtName: await resolveDistrictName(item),
      status: "booked",
      checkInDate: toSafeText(item.travelDate),
      checkOutDate: "",
      source: "system",
    });
  }
}

async function markStayRecordsCompleted(order) {
  if (!order || !Array.isArray(order.items)) {
    return;
  }

  for (const item of order.items) {
    if (item.providerType !== "hotel" && item.providerType !== "transport") {
      continue;
    }

    const targetId = toSafeText(item.sourceId) || `${item.providerType}-${item._id}`;

    await StayRecord.updateMany(
      {
        userId: order.userId,
        targetType: item.providerType,
        targetId,
        source: "system",
        status: { $in: ["booked", "staying"] },
      },
      { $set: { status: "completed" } }
    );
  }
}

export async function getMyCart(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const cart = await getOrCreateCart(userId);
    return res.json({ cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function addTransportItemToCart(req, res) {
  try {
    const userId = getUserId(req);
    const { ticketId, quantity = 1 } = req.body;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Valid ticketId is required" });
    }

    const ticket = await TransportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Transport ticket not found" });
    }

    const safeQuantity = Math.max(1, toSafeNumber(quantity, 1));
    if (safeQuantity > Number(ticket.seatsAvailable)) {
      return res.status(400).json({
        message: `Only ${ticket.seatsAvailable} seats are available for this ticket`,
      });
    }

    const cart = await getOrCreateCart(userId);
    cart.items.push({
      serviceType: "transport",
      providerType: "transport",
      providerName: toSafeText(ticket.operator),
      itemName: toSafeText(ticket.title),
      sourceModule: "transport",
      sourceId: ticket._id.toString(),
      quantity: safeQuantity,
      price: Math.max(0, toSafeNumber(ticket.price, 0)),
      travelDate: toSafeText(ticket.travelDate),
      route: `${toSafeText(ticket.origin)} to ${toSafeText(ticket.destination)}`,
      status: "pending",
    });

    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();

    return res.status(201).json({ message: "Transport ticket added to cart", cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function addExperienceItemToCart(req, res) {
  try {
    const userId = getUserId(req);
    const { destinationId, quantity = 1 } = req.body;

    if (!destinationId || !mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ message: "Valid destinationId is required" });
    }

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({ message: "Experience destination not found" });
    }

    const cart = await getOrCreateCart(userId);
    cart.items.push({
      serviceType: "experience",
      providerType: "localArtisan",
      providerName: toSafeText(destination.name),
      itemName: toSafeText(destination.name),
      sourceModule: "recommendation",
      sourceId: destination._id.toString(),
      quantity: Math.max(1, toSafeNumber(quantity, 1)),
      price: Math.max(0, toSafeNumber(destination.cost, 0)),
      travelDate: "",
      route: "",
      status: "pending",
    });

    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();

    return res.status(201).json({ message: "Experience item added to cart", cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function updateCartItem(req, res) {
  try {
    const userId = getUserId(req);
    const { itemId } = req.params;
    const { quantity, route, notes } = req.body;

    const cart = await getOrCreateCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (quantity !== undefined) {
      const nextQuantity = Math.max(1, toSafeNumber(quantity, item.quantity));

      if (item.providerType === "transport" && item.sourceModule === "transport") {
        const availabilityCheck = await checkTransportSeatAvailability(item, nextQuantity);
        if (!availabilityCheck.ok) {
          return res.status(400).json({ message: availabilityCheck.message });
        }
      }

      item.quantity = nextQuantity;
    }

    if (route !== undefined || notes !== undefined) {
      item.route = toSafeText(route !== undefined ? route : notes);
    }

    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();

    return res.json({ message: "Cart item updated", cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function removeCartItem(req, res) {
  try {
    const userId = getUserId(req);
    const { itemId } = req.params;

    const cart = await getOrCreateCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.deleteOne();
    cart.totalAmount = calculateTotal(cart.items);
    await cart.save();

    return res.json({ message: "Cart item removed", cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function clearCart(req, res) {
  try {
    const userId = getUserId(req);
    const cart = await getOrCreateCart(userId);

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return res.json({ message: "Cart cleared", cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

function mapCartItemToLineItem(cartItem, currency = checkoutCurrency) {
  const totalUnitPrice = Math.round(Number(cartItem.price) * 100); 
  // converts into the smallest currency unit for stripe

  return {
    quantity: Number(cartItem.quantity),
    price_data: {
      currency,
      unit_amount: Math.max(0, totalUnitPrice),
      product_data: {
        name: `${cartItem.itemName} (${cartItem.serviceType})`,
        description: `${cartItem.providerName}${cartItem.travelDate ? ` | ${cartItem.travelDate}` : ""}`,
      },
    },
  };
}

export async function createStripeCheckoutSession(req, res) {
  try {
    const userId = getUserId(req);

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured. Add STRIPE_SECRET_KEY first." });
    }

    const cart = await getOrCreateCart(userId);

    if (!cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const transportSeatRequests = getTransportSeatRequestMap(cart.items);
    for (const [ticketId, quantity] of transportSeatRequests.entries()) {


      const ticket = await TransportTicket.findById(ticketId).select("seatsAvailable title");
      
      //validation
      if (!ticket) {
        return res.status(404).json({ message: "Transport ticket not found" });
      }

      if (Number(ticket.seatsAvailable) < quantity) {
        return res.status(400).json({
          message: `Only ${ticket.seatsAvailable} seats are available for ${toSafeText(ticket.title) || "this ticket"}`,
        });
      }
    }

    const order = await CheckoutOrder.create({
      userId,
      items: cart.items.map((item) => ({
        serviceType: item.serviceType,
        providerType: item.providerType,
        providerName: item.providerName,
        itemName: item.itemName,
        sourceId: toSafeText(item.sourceId) || `cart-item-${item._id}`,
        quantity: item.quantity,
        price: item.price,
        travelDate: item.travelDate,
        route: item.route || item.notes || "",
        bookingStatus: "pending",
      })),

      totalAmount: cart.totalAmount,
      currency: checkoutCurrency,
      paymentStatus: "pending",
      bookingStatus: "pending",
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";


    //create stripe session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${frontendUrl}/cart`,
      line_items: cart.items.map((item) => mapCartItemToLineItem(item, checkoutCurrency)),
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    order.stripeSessionId = session.id;
    await order.save();

    return res.status(201).json({
      message: "Stripe checkout session created",
      orderId: order._id,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMyOrders(req, res) {
  try {
    const userId = getUserId(req);
    const orders = await CheckoutOrder.find({ userId }).sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function markOrderAsCompleted(req, res) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;

    const order = await CheckoutOrder.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Only paid orders can be marked completed" });
    }

    order.bookingStatus = "completed";
    order.items = order.items.map((item) => ({ ...item.toObject(), bookingStatus: "completed" }));
    await order.save();

    await markStayRecordsCompleted(order);

    return res.json({ message: "Booking marked as completed", order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getOrderById(req, res) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;

    const order = await CheckoutOrder.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function handleStripeWebhook(req, res) {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured" });
  }

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session?.metadata?.orderId || "";
      const userId = session?.metadata?.userId || "";

      const order = await CheckoutOrder.findById(orderId);
      if (order) {
        order.paymentStatus = "paid";
        order.bookingStatus = "confirmed";
        order.stripeSessionId = session.id || order.stripeSessionId;
        order.stripePaymentIntentId = session.payment_intent?.toString() || "";
        order.paidAt = new Date();
        order.items = order.items.map((item) => ({ ...item.toObject(), bookingStatus: "confirmed" }));
        await order.save();

        await deductTransportSeatsAfterPayment(order.items);

        await createStayRecordsFromPaidOrder(order);
      }

      if (userId) {
        const cart = await UnifiedCart.findOne({ userId });
        if (cart) {
          cart.items = [];
          cart.totalAmount = 0;
          await cart.save();
        }
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      const orderId = session?.metadata?.orderId || "";
      const order = await CheckoutOrder.findById(orderId);
      if (order) {
        order.paymentStatus = "failed";
        await order.save();
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
