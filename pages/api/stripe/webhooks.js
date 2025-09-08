// /api/stripe/webhooks.js
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read raw body
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Product IDs - Get from environment variables
const PRODUCT_IDS = {
  freebird: process.env.STRIPE_FREEBIRD_PRODUCT_ID,
  roadie: process.env.STRIPE_ROADIE_PRODUCT_ID,
  hero: process.env.STRIPE_HERO_PRODUCT_ID
};

// Price IDs - Get from environment variables
const PRICE_IDS = {
  roadie_monthly: process.env.STRIPE_ROADIE_MONTHLY_PRICE_ID,
  roadie_annual: process.env.STRIPE_ROADIE_ANNUAL_PRICE_ID,
  hero_monthly: process.env.STRIPE_HERO_MONTHLY_PRICE_ID,
  hero_annual: process.env.STRIPE_HERO_ANNUAL_PRICE_ID
};

// Plan mapping for database
const PLAN_MAPPING = {
  [PRODUCT_IDS.freebird]: 'freebird',
  [PRODUCT_IDS.roadie]: 'roadie',
  [PRODUCT_IDS.hero]: 'hero'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Read raw body for signature verification
    const rawBody = await getRawBody(req);
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.paused':
        await handleSubscriptionPaused(event.data.object);
        break;
      
      case 'customer.subscription.resumed':
        await handleSubscriptionResumed(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription) {
  console.log('New subscription created:', subscription.id);
  
  const customerId = subscription.customer;
  const productId = subscription.items.data[0].price.product;
  const planType = PLAN_MAPPING[productId];
  
  if (!planType) {
    console.error('Unknown product ID:', productId);
    return;
  }

  try {
    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    
    // Update user profile in Supabase
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: planType,
        plan_selected_at: new Date().toISOString(),
        trial_started_at: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        stripe_customer_id: customerId
      })
      .eq('email', customer.email);

    if (error) {
      console.error('Error updating user profile:', error);
    } else {
      console.log('User profile updated for subscription:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle trial ending soon (3 days before)
async function handleTrialWillEnd(subscription) {
  console.log('Trial ending soon for subscription:', subscription.id);
  
  try {
    // Get customer email
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // TODO: Send trial ending reminder email via Mailjet
    // This will be implemented in the next phase
    
    console.log('Trial ending reminder sent to:', customer.email);
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

// Handle subscription updates (including trial status changes)
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    const customerId = subscription.customer;
    const productId = subscription.items.data[0].price.product;
    const planType = PLAN_MAPPING[productId];
    
    // Check if trial just ended
    if (subscription.status === 'active' && 
        subscription.previous_attributes?.status === 'trialing') {
      console.log('Trial ended for subscription:', subscription.id);
      
      // TODO: Send trial expired email and convert to free tier if needed
      await handleTrialEnded(subscription);
    }
    
    // Update subscription in Supabase
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        stripe_subscription_id: subscription.id,
        user_id: customerId, // You'll need to map this to your user ID
        status: subscription.status,
        tier: planType,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle trial ended (subscription paused)
async function handleSubscriptionPaused(subscription) {
  console.log('Subscription paused (trial ended):', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Convert user to free tier
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'freebird',
        subscription_status: 'paused'
      })
      .eq('email', customer.email);

    if (error) {
      console.error('Error converting user to free tier:', error);
    } else {
      console.log('User converted to free tier:', customer.email);
      
      // TODO: Send trial expired email via Mailjet
    }
  } catch (error) {
    console.error('Error handling subscription paused:', error);
  }
}

// Handle subscription resumed (payment method added)
async function handleSubscriptionResumed(subscription) {
  console.log('Subscription resumed:', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const productId = subscription.items.data[0].price.product;
    const planType = PLAN_MAPPING[productId];
    
    // Restore user to their paid tier
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: planType,
        subscription_status: 'active'
      })
      .eq('email', customer.email);

    if (error) {
      console.error('Error restoring user subscription:', error);
    } else {
      console.log('User subscription restored:', customer.email);
    }
  } catch (error) {
    console.error('Error handling subscription resumed:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Convert user to free tier
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'freebird',
        subscription_status: 'canceled'
      })
      .eq('email', customer.email);

    if (error) {
      console.error('Error converting user to free tier:', error);
    } else {
      console.log('User converted to free tier:', customer.email);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle payment failures
async function handlePaymentFailed(invoice) {
  console.log('Payment failed for invoice:', invoice.id);
  
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    
    // TODO: Send payment failed email via Mailjet
    
    console.log('Payment failed email sent to:', customer.email);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}