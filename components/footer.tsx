import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 py-8 px-3 sm:px-5 mt-40 sm:mt-80">
      <div className="max-w-5xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Company Information */}
          <div className="text-left">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="font-medium text-gray-900">clone:it GmbH</div>
              <div>Am Katzelbach 7, 8054 Graz</div>
              <div>Phone: +43 676 755 5310</div>
              <div>
                e-mail: paul.wegerer (at) cloneit.at
              </div>
              <div>
                <a 
                  href="https://www.cloneit.at" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  www.cloneit.at
                </a>
              </div>
            </div>
          </div>
          
          {/* Right Column - Legal Information */}
          <div className="text-left">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Firmenbuchnummer: FN 601893 m</div>
              <div>Firmenbuchgericht: Graz</div>
              <div>UID-Nr.: ATU79501148</div>
              <div className="mt-3 space-y-1">
                <div>CEO: Dipl. Ing. Paul Wegerer</div>
                <div>CTO: Dipl. Ing. Liebhard Mattuschka</div>
              </div>
              <div className="mt-3">
                Mitglied: Wirtschaftskammer Steiermark (WKO)
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}