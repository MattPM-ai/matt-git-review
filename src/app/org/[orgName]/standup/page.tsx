// import { auth } from "@/lib/auth";
// import { redirect } from "next/navigation";
// import { DashboardLayout } from "@/components/dashboard-layout";
// // import {
// //   mattAPI,
// //   type ActivityFilterDto,
// //   type ActivitiesResponseDto,
// // } from "@/lib/matt-api";

// interface StandupPageProps {
//   params: Promise<{
//     orgName: string;
//   }>;
//   searchParams: Promise<{
//     dateFrom?: string;
//     dateTo?: string;
//   }>;
// }

// export default async function StandupPage({
//   params,
//   searchParams,
// }: StandupPageProps) {
//   const session = await auth();

//   if (!session) {
//     redirect("/");
//   }

//   const { orgName } = await params;
//   // const { dateFrom } = await searchParams;

//   // let activityData: ActivitiesResponseDto | null = null;
//   let error = null;

//   try {
//     // Build filter to fetch only commits
//     // const filter: ActivityFilterDto = {
//     //   organizationLogin: orgName,
//     //   activityTypes: ["commit"],
//     //   limit: 1000, // Get a reasonable amount of commits
//     // };

//     // // Add date filter if provided
//     // if (dateFrom) {
//     //   filter.dateFrom = dateFrom;
//     // }

//     // // Fetch activities from Matt API
//     // activityData = await mattAPI.fetchActivities(session.accessToken!, filter);
//   } catch (err) {
//     console.error("Failed to fetch activities:", err);
//     error = "Failed to fetch organization data";
//   }

//   // Commented out unused variables for now
//   // const members = activityData ? Object.values(activityData.users) : [];
//   // const commits = activityData
//   //   ? activityData.activities.filter((a) => a.type === "commit")
//   //   : [];

//   // // Extract unique commit dates
//   // const commitDates = activityData
//   //   ? Array.from(
//   //       new Set(
//   //         activityData.activities
//   //           .filter((a) => a.type === "commit")
//   //           .map((a) => a.created_at.toISOString().split("T")[0])
//   //       )
//   //     )
//   //       .sort()
//   //       .reverse()
//   //   : [];

//   // // Group commit authors by date
//   // const dailyCommitAuthors = activityData
//   //   ? commits.reduce((acc, commit) => {
//   //       const dateStr = commit.created_at.toISOString().split("T")[0];
//   //       if (!acc[dateStr]) {
//   //         acc[dateStr] = new Set();
//   //       }
//   //       if (commit.user_login) {
//   //         acc[dateStr].add(commit.user_login);
//   //       }
//   //       return acc;
//   //     }, {} as Record<string, Set<string>>)
//   //   : {};

//   return (
//     <DashboardLayout
//       orgName={orgName}
//       title="Standup"
//       currentView="standup"
//       sidebar={
//         <div></div>
//         // <StandupSidebar
//         //   members={members}
//         //   commitDates={commitDates}
//         //   selectedDate={dateFrom}
//         //   orgName={orgName}
//         //   dailyCommitAuthors={dailyCommitAuthors}
//         // />
//       }
//     >
//       {error && (
//         <div className="rounded-md bg-red-50 p-4 mb-4">
//           <p className="text-sm text-red-800">{error}</p>
//         </div>
//       )}

//       <div></div>

//       {/* <StandupDashboard
//         members={members}
//         commitDates={commitDates}
//         selectedDate={dateFrom}
//         orgName={orgName}
//         dailyCommitAuthors={dailyCommitAuthors}
//       /> */}
//     </DashboardLayout>
//   );
// }

export default async function StandupPage() {
  return <div>Standup</div>;
}
