import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { redirect } from "next/navigation";
import Image from "next/image";

interface HomeProps {
  searchParams: Promise<{
    setup_redirect?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const session = await auth();

  if (session) {
    // If there's a setup redirect, go there instead of dashboard
    if (params.setup_redirect) {
      redirect(decodeURIComponent(params.setup_redirect));
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-5">
              <Image
                src="/icon.png"
                alt="Matt PM Icon"
                width={64}
                height={64}
                className="w-16 h-16"
                priority
              />
              <span className="text-5xl font-bold text-gray-900">Matt PM</span>
            </div>

            <h1 className="text-4xl text-center font-bold text-gray-900 max-w-sm mx-auto">
              Git Performance Ranking & Standup
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Connect your GitHub organization to generate automated performance
              rankings and standup
            </p>
          </div>

          <div className="space-y-6">
            <SignInButton />

            {/* <p className="text-sm text-gray-500">
              Secure authentication with GitHub
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}
