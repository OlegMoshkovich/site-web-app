import React from 'react';

interface FooterProps {
  user?: { id: string; email?: string } | null;
}

export function Footer({ user }: FooterProps) {
  const textColor = user ? 'text-black' : 'text-white';
  
  return (
    <footer className="w-full pt-8 pb-0 mt-12 sm:mt-12">
      <div className="mx-[10px] md:mx-0">
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* Left Column - Company Information */}
          <div className="text-left">
            <div className={`text-xs ${textColor} space-y-1`}>
              <div className="font-medium text-white">clone:it GmbH</div>
              <div>Am Katzelbach 9, 8054 Graz</div>
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
            <div className={`text-xs ${textColor} space-y-1`}>
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