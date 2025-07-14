import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mattAPI, type ActivityFilterDto, type SimplifiedCommitDto } from '@/lib/matt-api';
import { generateStandupSummary, type StandupSummary } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgName, date, users } = await request.json();
    
    if (!orgName || !date || !users) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build filter to fetch commits for the date
    const filter: ActivityFilterDto = {
      organizationLogin: orgName,
      activityTypes: ['commit'],
      dateFrom: date,
      dateTo: date,
      limit: 1000,
    };

    // Fetch activities from Matt API
    const response = await mattAPI.fetchActivities(session.accessToken, filter);
    
    // Generate summaries for each user
    const summaries: StandupSummary[] = [];
    
    for (const user of users) {
      // Filter commits for this user and date
      const userCommits = response.activities.filter(activity => 
        activity.type === 'commit' && 
        activity.user_login === user.login &&
        activity.created_at.toISOString().split('T')[0] === date
      ) as SimplifiedCommitDto[];
      
      const summary = await generateStandupSummary(user.login, user.login, userCommits);
      summaries.push(summary);
    }

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error('Error generating standup summaries:', error);
    return NextResponse.json(
      { error: 'Failed to generate standup summaries' }, 
      { status: 500 }
    );
  }
}