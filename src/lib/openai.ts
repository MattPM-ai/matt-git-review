import OpenAI from 'openai';
import { GitHubCommit } from './github-api';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StandupSummary {
  userLogin: string;
  summary: string;
  workDone: string[];
  nextSteps: string[];
  blockers: string[];
}

export async function generateStandupSummary(
  userLogin: string,
  userName: string,
  commits: GitHubCommit[]
): Promise<StandupSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (commits.length === 0) {
    return {
      userLogin,
      summary: `${userName} had no commits for this day.`,
      workDone: [],
      nextSteps: [],
      blockers: []
    };
  }

  const commitMessages = commits.map(commit => ({
    message: commit.commit.message,
    repository: commit.repository.name,
    timestamp: commit.commit.author.date
  }));

  const prompt = `
You are helping generate a daily standup summary for a software developer. 

Developer: ${userName} (@${userLogin})
Date: ${commits[0]?.commit.author.date.split('T')[0]}

Here are their commits from today:
${commitMessages.map(c => `- [${c.repository}] ${c.message}`).join('\n')}

Please generate a brief, professional standup summary in the following format:
- A 2-3 sentence overview of what they accomplished
- 3-5 specific work items they completed (bullet points)
- 1-2 potential next steps or areas they might focus on
- Any potential blockers or challenges (if apparent from commit messages)

Keep it concise and professional. Focus on the actual work done based on commit messages.
Return the response as a JSON object with the following structure:
{
  "summary": "Brief 2-3 sentence overview",
  "workDone": ["item 1", "item 2", "item 3"],
  "nextSteps": ["next step 1", "next step 2"],
  "blockers": ["blocker 1"] // or empty array if none
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates professional standup summaries for software developers based on their git commits. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      userLogin,
      summary: parsed.summary || `${userName} worked on ${commits.length} commits today.`,
      workDone: parsed.workDone || [],
      nextSteps: parsed.nextSteps || [],
      blockers: parsed.blockers || []
    };
  } catch (error) {
    console.error('Error generating standup summary:', error);
    
    // Fallback summary
    const repoNames = [...new Set(commits.map(c => c.repository.name))];
    return {
      userLogin,
      summary: `${userName} made ${commits.length} commits across ${repoNames.length} repository(ies): ${repoNames.join(', ')}.`,
      workDone: commits.slice(0, 5).map(c => c.commit.message.split('\n')[0]),
      nextSteps: [],
      blockers: []
    };
  }
}

export async function generateMultipleStandupSummaries(
  userCommits: { user: { login: string; name: string }, commits: GitHubCommit[] }[]
): Promise<StandupSummary[]> {
  const summaries = await Promise.all(
    userCommits.map(({ user, commits }) => 
      generateStandupSummary(user.login, user.name, commits)
    )
  );
  
  return summaries;
}