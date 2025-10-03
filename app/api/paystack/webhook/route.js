import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import { verifyPaystackPayment } from '@/actions/order';

export async function POST(request) {
  // Remove detailed debug logs in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    const signature = request.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;
    
    // Essential checks
    if (!signature) {
      if (!isProduction) {
        console.log('Available headers:', Array.from(request.headers.keys()));
      }
      console.warn('Webhook rejected: Missing signature');
      return NextResponse.json(
        { error: 'Invalid webhook' }, 
        { status: 401 }
      );
    }

    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Server error' }, 
        { status: 500 }
      );
    }

    // Get the raw body
    const body = await request.text();
    
    if (!isProduction) {
      console.log('Webhook body received:', body.substring(0, 500));
      console.log('Signature verification in progress...');
    }

    // Verify signature
    const computedSignature = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!signatureValid) {
      console.error('Webhook rejected: Invalid signature');
      if (!isProduction) {
        console.log('Expected:', computedSignature);
        console.log('Received:', signature);
      }
      return NextResponse.json(
        { error: 'Invalid webhook' }, 
        { status: 401 }
      );
    }

    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Webhook rejected: Invalid JSON');
      return NextResponse.json(
        { error: 'Invalid payload' }, 
        { status: 400 }
      );
    }

    console.log(`Paystack webhook received: ${event.event}`);

    // Handle specific events
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      let orderId = metadata?.order_id || null;

      // Fallback to custom_fields
      if (!orderId && Array.isArray(metadata?.custom_fields)) {
        const orderField = metadata.custom_fields.find(
          f => f.variable_name === 'order_id'
        );
        orderId = orderField?.value;
      }

      if (!orderId) {
        console.error('Webhook processing failed: Missing order ID');
        return NextResponse.json(
          { error: 'Missing order information' }, 
          { status: 400 }
        );
      }

      try {
        await dbConnect();
        const result = await verifyPaystackPayment(orderId, reference);

        if (result.success) {
          console.log(`Payment verified successfully for order: ${orderId}`);
          return NextResponse.json({ 
            verified: true,
            orderId,
            reference 
          });
        } else {
          console.error(`Payment verification failed for order ${orderId}:`, result.error);
          return NextResponse.json(
            { error: 'Payment verification failed' }, 
            { status: 400 }
          );
        }
      } catch (dbError) {
        console.error('Database error during webhook processing:', dbError);
        return NextResponse.json(
          { error: 'Processing error' }, 
          { status: 500 }
        );
      }
    }

    // Acknowledge other events without processing
    console.log(`Webhook acknowledged for event: ${event.event}`);
    return NextResponse.json({ 
      received: true, 
      event: event.event 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Optional: Add other HTTP methods for completeness
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}