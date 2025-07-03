import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllOrgCommits, getCommitsForUserAndDate, type GitHubUser } from '@/lib/github-api';
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

    // Get all commits for the organization
    const commits = await getAllOrgCommits(session.accessToken, orgName);
    
    // Generate summaries for each user
    const summaries: StandupSummary[] = [];
    
    for (const user of users) {
      const userCommits = getCommitsForUserAndDate(commits, user.login, date);
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