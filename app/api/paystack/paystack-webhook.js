// pages/api/paystack-webhook.js
import crypto from 'crypto';

import dbConnect from '@/lib/mongodb'; // Adjust import path
import { verifyPaystackPayment } from '@/actions/order';

export const config = {
  api: {
    bodyParser: false, // Required for raw body verification
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read raw body
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify signature
    const computedSignature = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (computedSignature !== signature) {
      console.error('Invalid Paystack signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString());
    
    // Handle charge success event
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      let orderId = metadata?.order_id || null;

      // Fallback to custom_fields if needed
      if (!orderId && Array.isArray(metadata?.custom_fields)) {
        const orderField = metadata.custom_fields.find(
          f => f.variable_name === 'order_id'
        );
        orderId = orderField?.value;
      }

      if (!orderId) {
        console.error('Order ID missing in Paystack metadata');
        return res.status(400).json({ error: 'Missing order ID' });
      }

      await dbConnect();
      const result = await verifyPaystackPayment(orderId, reference);

      if (result.success) {
        return res.status(200).json({ verified: true });
      } else {
        console.error('Verification failed:', result.error);
        return res.status(400).json({ error: result.error });
      }
    }

    // Handle other event types
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}