import { Router } from 'express';
import { getUncachableStripeClient } from '../stripeClient';
import { stripeStorage } from '../stripeStorage';

const router = Router();

router.get('/stripe/plans', async (_req, res) => {
  try {
    const plans = await stripeStorage.listPlansWithPrices();
    res.json({ data: plans });
  } catch (err: any) {
    console.error('Error listing plans:', err.message);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

router.post('/stripe/checkout', async (req, res) => {
  try {
    const { priceId, email, successUrl, cancelUrl } = req.body;
    if (!priceId || !email || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stripe = await getUncachableStripeClient();

    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/stripe/portal', async (req, res) => {
  try {
    const { email, returnUrl } = req.body;
    if (!email || !returnUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stripe = await getUncachableStripeClient();
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found for this email' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Portal error:', err.message);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

router.get('/stripe/subscription', async (req, res) => {
  try {
    const { email } = req.query as { email?: string };
    if (!email) {
      return res.status(400).json({ error: 'email query param required' });
    }

    const stripe = await getUncachableStripeClient();
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return res.json({ active: false });
    }

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    res.json({ active: subs.data.length > 0, subscription: subs.data[0] ?? null });
  } catch (err: any) {
    console.error('Subscription check error:', err.message);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

export default router;
