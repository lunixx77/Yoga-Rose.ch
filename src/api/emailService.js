import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const TEMPLATE_BOOKING_OWNER = import.meta.env.VITE_EMAILJS_TEMPLATE_BOOKING_OWNER;
const TEMPLATE_BOOKING_CUSTOMER = import.meta.env.VITE_EMAILJS_TEMPLATE_BOOKING_CUSTOMER;
const TEMPLATE_REVIEW = import.meta.env.VITE_EMAILJS_TEMPLATE_REVIEW;

const OWNER_EMAIL = "l.milutinovic@outlook.com";

const isConfigured = !!(SERVICE_ID && PUBLIC_KEY);

let initialized = false;
function ensureInit() {
  if (!initialized && isConfigured) {
    emailjs.init(PUBLIC_KEY);
    initialized = true;
  }
}

async function send(templateId, templateParams) {
  if (!isConfigured || !templateId) {
    console.log("[EmailService] Nicht konfiguriert – E-Mail nur simuliert:", {
      templateId,
      templateParams,
    });
    return { status: 200, text: "simulated" };
  }
  ensureInit();
  return emailjs.send(SERVICE_ID, templateId, templateParams);
}

/**
 * Benachrichtigung an die Inhaberin wenn eine neue Anfrage eingeht.
 */
export async function sendBookingNotification(formData) {
  return send(TEMPLATE_BOOKING_OWNER, {
    to_email: OWNER_EMAIL,
    customer_name: formData.customer_name,
    customer_email: formData.customer_email,
    customer_phone: formData.customer_phone,
    service_name: formData.service_name,
    preferred_time: formData.preferred_time || "–",
    preferred_date: formData.preferred_date || "–",
    number_of_days: formData.number_of_days || "–",
    is_trial: formData.is_trial ? "Ja" : "Nein",
    message: formData.message || "–",
  });
}

/**
 * Bestaetigungs-Email an den Kunden nach einer Anfrage.
 */
export async function sendBookingConfirmation(formData) {
  return send(TEMPLATE_BOOKING_CUSTOMER, {
    to_email: formData.customer_email,
    customer_name: formData.customer_name,
    service_name: formData.service_name,
    preferred_time: formData.preferred_time || "–",
    preferred_date: formData.preferred_date || "–",
  });
}

/**
 * Benachrichtigung an die Inhaberin wenn eine neue Bewertung eingeht.
 */
export async function sendReviewNotification(reviewData) {
  return send(TEMPLATE_REVIEW, {
    to_email: OWNER_EMAIL,
    customer_name: reviewData.customer_name,
    rating: "⭐".repeat(reviewData.rating),
    comment: reviewData.comment || "–",
  });
}
