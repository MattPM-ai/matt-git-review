import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mattAPI, type StandupRequest } from '@/lib/matt-api';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
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

    // Generate standup using Matt API
    const standupSummaries = await mattAPI.generateStandup(session.accessToken, standupRequest);

    return NextResponse.json({ summaries: standupSummaries });
  } catch (error) {
    console.error('Error generating standup summaries:', error);
    return NextResponse.json(
      { error: 'Failed to generate standup summaries' }, 
      { status: 500 }
    );
  }
}