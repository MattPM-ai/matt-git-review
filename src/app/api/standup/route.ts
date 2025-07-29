import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mattAPI, type StandupRequest } from '@/lib/matt-api';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.mattJwtToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgName, date, dateRange } = await request.json();
    
    if (!orgName || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build request for Matt API standup endpoint
    const standupRequest: StandupRequest = {
      organizationLogin: orgName,
      dateFrom: dateRange?.dateFrom || date,
      dateTo: dateRange?.dateTo || date, // For daily standup, dateFrom and dateTo are the same
    };

    // Generate standup task using Matt API
    const taskResponse = await mattAPI.generateStandup(session.mattJwtToken, standupRequest);

    return NextResponse.json(taskResponse);
  } catch (error) {
    console.error('Error generating standup summaries:', error);
    
    if (error instanceof Error && (error.message === 'JWT token has expired' || error.message === 'No JWT token provided')) {
      return NextResponse.json({ error: 'Unauthorized - ' + error.message }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate standup summaries' }, 
      { status: 500 }
    );
  }
}