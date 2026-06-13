// pages/api/chat.js
// Secure backend endpoint for Amit Electronics AI Chat Widget
// Uses Google Gemini API via environment variables

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Gemini API key not configured",
    });
  }

  // Keep only recent messages
  const trimmedMessages = messages.slice(-20);

  const systemPrompt = `
You are a helpful sales assistant for Amit Electronics & Car Accessories, a 37-year-old trusted electronics shop located at Jinsi Road No. 2, Maithili Sharan Chowk, Lashkar, Gwalior, Madhya Pradesh.

The shop was founded in 1988 by Late Mr. S.K. Sharma and is currently run by Mr. Amit Sharma.

The shop sells and installs:

• Car Accessories:
seat covers, floor mats, steering wheel covers, door visors, body moulding, fog lights, alloy wheel covers

• Car Audio:
Android head units with CarPlay/Android Auto, 2-DIN music systems, car speakers, subwoofers, amplifiers

• Dash Cameras:
front, rear, 360-degree cameras with professional installation

• CCTV & Security:
IP cameras, DVR/NVR systems, bullet cameras, dome cameras, video doorbells, shop security systems

• Car Electronics:
reverse parking sensors, reverse cameras, GPS trackers, USB chargers, central locking systems

• Stabilizers:
Blue Bird stabilizers and voltage protection systems

• Networking:
CAT6 cables, PoE switches, routers and networking accessories

Shop Timings:
10:30 AM – 9:00 PM
Closed every Tuesday

Phone:
0751-2323212
+91 9425110451

WhatsApp:
+91 9425110451

Google Rating:
4.0+ stars with 250+ reviews

Key Strengths:
- 37 years of experience
- Genuine products
- Professional installation
- After-sale support
- Honest recommendations
- Expertise in matching products to customer needs

The website also contains AI Insights generated from historical sales analysis using Python, Pandas, Matplotlib, Jupyter Notebook and demand forecasting models.

If users ask about:
- ABC Classification
- Sales Analytics
- Demand Forecasting
- Product Growth Analysis
- AI Insights

Explain them in simple business language.

If exact pricing or stock availability is unknown, politely advise the customer to call or WhatsApp the shop.

Always reply in the same language used by the customer.

Keep answers concise (under 150 words unless necessary).
`;

  try {
    // Convert conversation into plain text
    const conversationText = trimmedMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nConversation:\n${conversationText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          },
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      return res.status(response.status).json({
        error: "AI service error. Please try again.",
      });
    }
    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";
    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Server error. Please try again.",
    });
  }
}