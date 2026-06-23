import Stripe from "stripe";
import { Class } from "../models/Class.js";
import { Booking } from "../models/Booking.js";
import { Transaction } from "../models/Transaction.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build");

// POST /api/payments/create-checkout-session
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { classId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData || classData.status !== "approved") {
      return res.status(404).json({ success: false, message: "Valid approved class not found" });
    }

    const existingBooking = await Booking.findOne({ userId: req.user._id, classId });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "You have already booked this class" });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/${classId}`,
      customer_email: req.user.email,
      client_reference_id: req.user._id.toString(),
      metadata: {
        userId: req.user._id.toString(),
        classId: classId.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: classData.title || classData.className || "Class Booking",
              images: classData.image ? [classData.image] : [],
            },
            unit_amount: Math.round(classData.price * 100),
          },
          quantity: 1,
        },
      ],
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/session/:sessionId
export const verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const classId = session.metadata.classId;
    const userId = session.metadata.userId;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    let booking = await Booking.findOne({ userId, classId });
    let transaction = await Transaction.findOne({ paymentIntentId: session.payment_intent });

    if (!transaction) {
      transaction = await Transaction.create({
        userId,
        userEmail: req.user?.email || session.customer_details?.email || "unknown@example.com",
        classId,
        className: classData.className || classData.title || "Unknown Class",
        amount: session.amount_total / 100,
        currency: session.currency,
        transactionId: session.payment_intent || session.id,
        paymentIntentId: session.payment_intent || session.id,
        status: "succeeded"
      });
    }

    if (!booking) {
      // Find user details to save properly
      // If we don't have it, we use info from classData and session
      booking = await Booking.create({
        userId,
        userEmail: req.user?.email || session.customer_details?.email || "unknown@example.com",
        userName: req.user?.name || session.customer_details?.name || "User",
        classId,
        className: classData.className || classData.title || "Unknown Class",
        trainerId: classData.trainerId || "Unknown",
        trainerName: classData.trainerName || "Unknown Trainer",
        schedule: classData.schedule || "TBD",
        price: classData.price || 0,
        paymentStatus: "paid",
        transactionId: session.payment_intent || session.id
      });

      // Safely increment bookingCount without triggering full document validation
      await Class.updateOne({ _id: classId }, { $inc: { bookingCount: 1 } });
    }

    res.status(200).json({ success: true, message: "Payment verified", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Verification failed" });
  }
};

// POST /api/payments/webhook
export const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
    // Business logic handled in confirm-booking endpoint to prevent race conditions or missing data,
    // but in a real-world app you'd finalize it here.
  }

  res.status(200).json({ received: true });
};

// GET /api/payments/my-transactions
export const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};
