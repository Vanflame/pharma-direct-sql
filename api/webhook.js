// api/webhook.js
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Read raw request body (PayMongo requires raw body)
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });

    const event = JSON.parse(rawBody);
    const type = event?.data?.attributes?.type || "unknown";
    console.log("🔔 PayMongo event received:", type);

    // ✅ Only handle successful payments
    if (
      type === "payment.paid" ||
      type === "link.payment.paid" ||
      type === "checkout_session.payment.paid"
    ) {
      const linkId =
        event.data?.attributes?.data?.id ||
        event.data?.attributes?.id ||
        null;

      const paymentData =
        event.data?.attributes?.data?.attributes ||
        event.data?.attributes ||
        {};
      const amount = (paymentData.amount || 0) / 100;
      const paymentId = paymentData.id || event.data?.id || "unknown";
      const method =
        paymentData.source?.type ||
        paymentData.payment_method_used ||
        "unknown";

      console.log("🔗 PayMongo link ID:", linkId);

      if (!linkId) {
        console.warn("⚠️ Missing link ID in webhook payload.");
        return res.status(400).json({ error: "Missing link ID" });
      }

      // ✅ Find order by link ID
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("id")
        .eq("paymongo_link_id", linkId)
        .single();

      if (orderErr || !order) {
        console.warn("⚠️ No matching order for link ID:", linkId);
        return res.status(404).json({ error: "Order not found for link ID" });
      }

      const orderId = order.id;
      console.log(`✅ Found order ${orderId} for link ${linkId}`);

      // ✅ Update order payment status
      const paymentInfo = JSON.stringify({
        id: paymentId,
        method,
        amount,
      });

      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          payment_status: "Confirmed",
          stage: "Confirmed",
          payment_info: paymentInfo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateErr) {
        console.error("❌ Supabase update failed:", updateErr);
        return res.status(500).json({ error: "Supabase update failed" });
      }

      console.log("✅ Order marked as paid in Supabase");

      // ✅ Trigger backend business logic
      console.log("⚙️ Executing complete_order_payment function in Supabase...");
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "complete_order_payment",
        { order_id_param: orderId }
      );

      if (rpcError) {
        console.error("❌ Supabase RPC function error:", rpcError);
      } else {
        console.log("✅ Supabase RPC executed successfully:", rpcData);
      }
    } else {
      console.log("ℹ️ Ignored non-payment event type:", type);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(400).json({ error: "Webhook processing failed" });
  }
}
