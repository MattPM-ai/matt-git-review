import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mattAPI, type ActivityFilterDto, type SimplifiedCommitDto } from '@/lib/matt-api';
import { subDays, parseISO } from 'date-fns';

interface n8nCommitStruct {
  numberOfCommits: number;
  commits: SimplifiedCommitDto[];
}

function getCommitsForUser(
  commits: SimplifiedCommitDto[],
  userLogin: string,
): SimplifiedCommitDto[] {
  return commits.filter(commit => commit.user_login === userLogin);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgName, date, users, email } = await request.json();
    
    if (!orgName || !date || !users) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate date range for last 30 days
    const endDateObj = parseISO(date);
    const startDateObj = subDays(endDateObj, 30);

    // Build filter to fetch commits from the last 30 days
    const filter: ActivityFilterDto = {
      organizationLogin: orgName,
      activityTypes: ['commit'],
      dateFrom: startDateObj.toISOString(),
      dateTo: endDateObj.toISOString(),
      limit: 1000,
    };

    // Fetch activities from Matt API
    const response = await mattAPI.fetchActivities(session.mattJwtToken!, filter);
    
    // Filter only commits
    const filteredCommits = response.activities.filter(activity => 
      activity.type === 'commit'
    ) as SimplifiedCommitDto[];
    
    console.log(`Filtered commits from last 30 days: ${filteredCommits.length} total commits`);

    // Generate commits for each user
    const commitsByUser: { [key: string]: n8nCommitStruct } = {};
    
    for (const user of users) {
      const userAllCommits = getCommitsForUser(filteredCommits, user.login);
      commitsByUser[user.login] = {numberOfCommits: userAllCommits.length, commits: userAllCommits};
      console.log("Number of commits for user", user.login, userAllCommits.length);
    }

    console.log("Total number of commits", filteredCommits.length);
    sendStandupsByUserToN8n(commitsByUser, email);

    return NextResponse.json({ message: "Commit report sent" });
  } catch (error) {
    console.error('Error generating standup report:', error);
    
    if (error instanceof Error && error.message === 'JWT token has expired') {
      return NextResponse.json({ error: 'Unauthorized - Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate standup report' }, 
      { status: 500 }
    );
  }
}

function sendStandupsByUserToN8n(commitsByUser: { [key: string]: n8nCommitStruct }, email: string) {
  console.log("Sending standups to N8n");
  fetch("https://engine.upnode.org/webhook/b809fda3-8fa1-4542-b929-58c433be532c/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commitsByUser: commitsByUser,
      email: email,
      sessionId: Date.now().toString()
    }),
  });
}