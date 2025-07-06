import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllOrgCommits, getCommitsForUserAndDate, GitHubCommit } from '@/lib/github-api';
import { generateStandupSummary, type StandupSummary } from '@/lib/openai';

interface n8nCommitStruct {
  numberOfCommits: number;
  commits: GitHubCommit[];
}

export function getCommitsForUser(
  commits: GitHubCommit[],
  userLogin: string,
): GitHubCommit[] {
  return commits.filter(commit => {
    const commitUser = commit.author?.login || commit.commit.author.email.split("@")[0];
    return commitUser === userLogin;
  });
}


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

    // Generate commits for each user
    const commitsByUser: { [key: string]: n8nCommitStruct } = {};
    
    for (const user of users) {
      const userAllCommits = getCommitsForUser(commits, user.login);
      commitsByUser[user.login] = {numberOfCommits: userAllCommits.length, commits: userAllCommits};
      console.log("Number of commits for user", user.login, userAllCommits.length);
    }

    console.log("Total number of commits", commits.length);
    sendStandupsByUserToN8n(commitsByUser);

    return NextResponse.json({ message: "Commit report sent" });
  } catch (error) {
    console.error('Error generating standup report:', error);
    return NextResponse.json(
      { error: 'Failed to generate standup report' }, 
      { status: 500 }
    );
  }
}

function sendStandupsByUserToN8n(commitsByUser: { [key: string]: n8nCommitStruct }) {
  console.log("Sending standups to N8n");
  fetch("https://engine.upnode.org/webhook/b809fda3-8fa1-4542-b929-58c433be532c/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commitsByUser: commitsByUser,
      email: "alex@turbo.ing",
      sessionId: Date.now().toString()
    }),
  });
}