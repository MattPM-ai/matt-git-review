"use client";

import { useValidatedSession } from "@/hooks/useValidatedSession";
import { SignOutButton } from "./sign-out-button";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export function UserProfile() {
  const { data: session } = useValidatedSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Large screen: Show full details */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-3">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      {/* Small screen: Show avatar with dropdown */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 rounded-lg hover:bg-gray-100 transition-colors hover:cursor-pointer"
        >
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${
              isMenuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2">
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
