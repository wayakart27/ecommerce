import { getTwoFactorConfirmationByUserId } from '@/data/password-reset-token';
import { deleteTwoFactorConfirmationById } from '@/data/two-factor';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
  try {
   const {id} = await context?.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const confirmation = await getTwoFactorConfirmationByUserId(id);
    return NextResponse.json(confirmation || null, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in GET /api/two-factor/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const {id} = await context?.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await deleteTwoFactorConfirmationById(id);
    return NextResponse.json({ success: !!result }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in DELETE /api/two-factor/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
