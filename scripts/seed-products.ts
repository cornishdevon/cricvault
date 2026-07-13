/**
 * Seed CricVault Pro product and prices in Stripe.
 * Run with: pnpm --filter @workspace/api-server exec tsx ../scripts/seed-products.ts
 * Idempotent — safe to run multiple times.
 */

import Stripe from 'stripe';

async function getStripeCredentials(): Promise<{ secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error('Missing Replit env vars. Ensure Stripe integration is connected.');
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true`,
    {
      headers: { Accept: 'application/json', X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!resp.ok) throw new Error(`Credentials fetch failed: ${resp.status}`);
  const data = await resp.json();
  const stripeItem = data.items?.find((item: any) =>
    (item.connector_name || item.type || '').toLowerCase().includes('stripe')
  );
  const secret = stripeItem?.settings?.secret;
  if (!secret) throw new Error('Stripe secret not found in connector settings');
  return { secretKey: secret };
}

async function main() {
  const { secretKey } = await getStripeCredentials();
  const stripe = new Stripe(secretKey);

  console.log('Checking for existing CricVault Pro product...');
  const existing = await stripe.products.search({
    query: "name:'CricVault Pro' AND active:'true'",
  });

  if (existing.data.length > 0) {
    const prod = existing.data[0];
    console.log(`✓ CricVault Pro already exists (${prod.id})`);
    const prices = await stripe.prices.list({ product: prod.id, active: true });
    for (const p of prices.data) {
      const interval = (p.recurring as any)?.interval ?? 'one-time';
      console.log(`  Price: ${p.currency.toUpperCase()} ${(p.unit_amount! / 100).toFixed(2)}/${interval} (${p.id})`);
    }
    return;
  }

  console.log('Creating CricVault Pro product...');
  const product = await stripe.products.create({
    name: 'CricVault Pro',
    description: 'Unlock advanced stats, coaching insights, season analysis, and unlimited match history.',
  });
  console.log(`✓ Created product: ${product.id}`);

  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: 299,
    currency: 'gbp',
    recurring: { interval: 'month' },
    nickname: 'Monthly',
  });
  console.log(`✓ Monthly price: £2.99/month (${monthly.id})`);

  const yearly = await stripe.prices.create({
    product: product.id,
    unit_amount: 2499,
    currency: 'gbp',
    recurring: { interval: 'year' },
    nickname: 'Yearly',
  });
  console.log(`✓ Yearly price: £24.99/year (${yearly.id})`);

  console.log('\n✅ Seeding complete! Run the API server to sync to DB via webhook.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
