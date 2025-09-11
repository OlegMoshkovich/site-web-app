import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 py-8 px-3 sm:px-5 mt-40 sm:mt-20">
      <div className="max-w-5xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 ml-6">
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
                  className="text-grey-600 hover:text-blue-600 underline"
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
                <div>
                  <a 
                    href="https://www.linkedin.com/in/paul-wegerer-364248236/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-grey-600 hover:text-blue-600 underline"
                  >
                    CEO: Dipl. Ing. Paul Wegerer
                  </a>
                </div>
                <div>
                  <a 
                    href="https://www.linkedin.com/in/liebhard-mattuschka-9b33b9239/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-grey-600 hover:text-blue-600 underline"
                  >
                    CTO: Dipl. Ing. Liebhard Mattuschka
                  </a>
                </div>
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