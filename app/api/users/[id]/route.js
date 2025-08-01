import { NextResponse } from 'next/server';
import { getUserById } from '../data/user';

export async function GET(request, context) {
  try {
    // Properly await the context promise
    // const { params } = await context;
    // const id = params?.id;

    const {id} = await context?.params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}