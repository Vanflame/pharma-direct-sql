// api/create-payment.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount_php, description, orderId, metadata } = req.body;
    if (!amount_php || !orderId)
      return res.status(400).json({ error: "amount_php and orderId required" });

    const amount = Math.round(Number(amount_php) * 100);
    const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const payload = {
      data: {
        attributes: {
          amount,
          currency: "PHP",
          description: description || `Order ${orderId}`,
          metadata: {
            ...(metadata || {}),
            order_id: orderId,
          },
        },
      },
    };

    console.log("🧾 Sending to PayMongo:", JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(PAYMONGO_SECRET + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({ error: data });
    }

    const linkId = data.data?.id;
    const checkout_url = data.data?.attributes?.checkout_url;

    // ✅ store linkId in Supabase
    if (linkId) {
      await supabase
        .from("orders")
        .update({ paymongo_link_id: linkId })
        .eq("id", orderId);
      console.log(`✅ Stored PayMongo link ID ${linkId} for order ${orderId}`);
    }

    return res.json({ checkout_url, raw: data });
  } catch (err) {
    console.error("❌ Error creating PayMongo link:", err);
    res.status(500).json({ error: String(err) });
  }
}
