'use client';

import { CookieIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50 text-gray-900 border-t border-gray-200 p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm flex items-center">
          <CookieIcon className="size-10 md:size-6  mr-2 sm:mr-3" />
          <p>
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
            <a href="https://www.mattpm.ai/privacy-policy" className="underline hover:text-gray-600">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto flex-shrink-1">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-800 hover:cursor-pointer w-full"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 hover:cursor-pointer w-full"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
