// ═══════════════════════════════════════════════════════
//  Mexico Travel Pass — Backend Server
//  Node.js + Express + Stripe Embedded Checkout
// ═══════════════════════════════════════════════════════
//
//  SETUP:
//    1. npm install express stripe cors dotenv
//    2. Create .env with STRIPE_SECRET_KEY=sk_live_...
//    3. node server.js
//
//  Deploy on Railway / Render / Fly.io (free tier works)
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: [
    'https://www.mexicotravelpass.com',
    'https://mexicotravelpass.com',
    'http://localhost:8080',   // local dev
    'http://127.0.0.1:5500'   // VS Code Live Server
  ]
}));
app.use(express.json());
app.use(express.static('public')); // serve index.html + success.html from /public

// ── PIEZA 1: Create Checkout Session ───────────────────
// POST /create-checkout-session
// Body: { lineItems: [{price: "price_xxx", quantity: 1}, ...] }
// Returns: { clientSecret: "cs_..." }

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { lineItems } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'lineItems array is required' });
    }

    // Validate all price IDs are from our product list
    const VALID_PRICES = new Set([
      'price_1TdNCsDOZDPnW2siWVL9vVD0', // CDMX Guide
      'price_1TdNG7DOZDPnW2siLBlEzzgU', // Guadalajara Guide
      'price_1TdNQoDOZDPnW2si1vWVaxCl', // Monterrey Guide
      'price_1TdNGgDOZDPnW2siSyprCW9U', // Bundle 3 cities
      'price_1TdNH3DOZDPnW2si4Gp5veqZ', // Stomach CDMX
      'price_1TdNHSDOZDPnW2sitXBu5imr', // Stomach Guadalajara
      'price_1TdNHpDOZDPnW2siGXCpM5us', // Stomach Monterrey
      'price_1TdNIlDOZDPnW2sisp9Jr4no', // Bundle 3 Stomach Guides
    ]);

    for (const item of lineItems) {
      if (!VALID_PRICES.has(item.price)) {
        return res.status(400).json({ error: `Invalid price ID: ${item.price}` });
      }
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      currency: 'usd',
      line_items: lineItems,
      return_url: 'https://www.mexicotravelpass.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      automatic_payment_methods: { enabled: true },
      locale: 'en',
      metadata: {
        source: 'mexico-travel-pass-website'
      }
    });

    res.json({ clientSecret: session.client_secret });

  } catch (err) {
    console.error('create-checkout-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PIEZA 3: Verify Session (for success.html) ─────────
// GET /verify-session?session_id=cs_xxx
// Returns: { status, amount_total, currency, line_items }

app.get('/verify-session', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    // Map purchased items to guide URLs
    const GUIDE_URLS = {
      'price_1TdNCsDOZDPnW2siWVL9vVD0': 'https://www.mexicotravelpass.com/cdmx-guide-2026',
      'price_1TdNG7DOZDPnW2siLBlEzzgU': 'https://www.mexicotravelpass.com/GDL-guide-2026',
      'price_1TdNQoDOZDPnW2si1vWVaxCl': 'https://www.mexicotravelpass.com/MTY-guide-2026',
      'price_1TdNGgDOZDPnW2siSyprCW9U': 'https://www.mexicotravelpass.com/all3-guide-2026',
      'price_1TdNH3DOZDPnW2si4Gp5veqZ': 'https://www.mexicotravelpass.com/cdmx_stomach-2026',
      'price_1TdNHSDOZDPnW2sitXBu5imr': 'https://www.mexicotravelpass.com/GDL_stomach-2026',
      'price_1TdNHpDOZDPnW2siGXCpM5us': 'https://www.mexicotravelpass.com/MTY_stomach-2026',
      'price_1TdNIlDOZDPnW2sisp9Jr4no': 'https://www.mexicotravelpass.com/All3_stomach-2026',
    };

    const purchasedPriceIds = session.line_items.data.map(i => i.price.id);
    const guideUrls = purchasedPriceIds
      .map(id => GUIDE_URLS[id])
      .filter(Boolean);

    // If bought 3 individual city guides, redirect to all3
    const cityGuides = ['price_1TdNCsDOZDPnW2siWVL9vVD0','price_1TdNG7DOZDPnW2siLBlEzzgU','price_1TdNQoDOZDPnW2si1vWVaxCl'];
    const boughtAllThree = cityGuides.every(id => purchasedPriceIds.includes(id));
    if (boughtAllThree) {
      const allIdx = guideUrls.indexOf('https://www.mexicotravelpass.com/cdmx-guide-2026');
      // Replace individual city URLs with all3
      guideUrls.length = 0;
      guideUrls.push('https://www.mexicotravelpass.com/all3-guide-2026');
    }

    // Primary guide = first non-stomach guide, or first guide
    const primaryGuide = guideUrls.find(u => !u.includes('stomach')) || guideUrls[0];

    res.json({
      status:        session.status,
      amount_total:  session.amount_total,
      currency:      session.currency,
      line_items:    session.line_items.data,
      guide_urls:    guideUrls,        // all guides purchased
      primary_guide: primaryGuide,     // main redirect URL
    });

  } catch (err) {
    console.error('verify-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }));

// ── Start ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Mexico Travel Pass server running on port ${PORT}`);
});
