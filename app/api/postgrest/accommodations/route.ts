import { NextRequest, NextResponse } from 'next/server';
import { postgrest } from '@/lib/postgrest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const status = searchParams.get('accreditation_status');
    
    const accommodations = await postgrest.get('accommodations', {
      select: '*, providers(business_name, contact_person)',
      filter: status ? { accreditation_status: status } : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      order: 'created_at.desc'
    });
    
    return NextResponse.json(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accommodations' },
      { status: 500 }
    );
  }
}
