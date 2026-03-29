import Link from "next/link";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Impressum — clone:it",
};

export default function ImpressumPage() {
  return (
    <main className="bg-black min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full flex justify-center h-16 bg-black">
        <div className="w-full max-w-6xl flex justify-between items-center px-3 sm:px-8">
          <Link href="/services" className="font-bold text-white text-base bg-black px-3 py-1 border border-gray-800">
            clone:it
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-24 w-full">
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-8">
          <h1 className="text-3xl font-semibold text-white mb-10">Impressum</h1>

          <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
            {/* Address */}
            <div>
              <p className="font-semibold text-white">clone:it GmbH</p>
              <p>Am Katzelbach 9</p>
              <p>8054 Graz</p>
              <p>Österreich</p>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <p>Tel.: +43 676 755 5310</p>
              <p>
                E-Mail:{" "}
                <a href="mailto:paul.wegerer@cloneit.at" className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors">
                  paul.wegerer@cloneit.at
                </a>
              </p>
              <p>
                Web:{" "}
                <a href="https://www.cloneit.at" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors">
                  www.cloneit.at
                </a>
              </p>
            </div>

            {/* Register */}
            <div className="space-y-1">
              <p><span className="font-semibold text-white">Firmenbuchnummer:</span> FN 601893 m</p>
              <p><span className="font-semibold text-white">Firmenbuchgericht:</span> Landesgericht für ZRS Graz</p>
              <p><span className="font-semibold text-white">UID-Nummer:</span> ATU79501148</p>
            </div>

            {/* Chamber */}
            <div>
              <p className="font-semibold text-white">Mitglied der Wirtschaftskammerorganisation:</p>
              <p>Wirtschaftskammer Steiermark</p>
            </div>

            {/* Management */}
            <div>
              <p className="font-semibold text-white mb-1">Geschäftsführer (handelsrechtlich):</p>
              <p>Baumstr. Dipl.-Ing. Paul Wegerer</p>
              <p>Dipl.-Ing. Liebhard Mattuschka</p>
              <p>Dr. Timur Uzunoglu</p>
            </div>

            {/* Trade authorization */}
            <div>
              <p className="font-semibold text-white mb-1">Gewerbeberechtigung/Berufsbezeichnung:</p>
              <p>Baumeister</p>
              <p>Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik</p>
            </div>

            {/* Trade manager */}
            <div>
              <p className="font-semibold text-white mb-1">Gewerberechtlicher Geschäftsführer:</p>
              <p>Baumstr. Dipl.-Ing. Paul Wegerer</p>
            </div>

            {/* Authority */}
            <div>
              <p className="font-semibold text-white mb-1">Gewerbebehörde:</p>
              <p>Magistrat der Stadt Graz</p>
            </div>

            {/* State */}
            <div>
              <p><span className="font-semibold text-white">Verleihungsstaat:</span> Österreich</p>
            </div>

            {/* Legal */}
            <div>
              <p className="font-semibold text-white mb-1">Anwendbare Rechtsvorschriften:</p>
              <p>
                Gewerbeordnung (GewO), abrufbar unter{" "}
                <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors">
                  www.ris.bka.gv.at
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 [&>footer]:mt-0 [&>footer]:mb-0 [&>footer]:pt-6 [&>footer]:pb-6">
        <Footer textColor="text-gray-300" />
      </div>
    </main>
  );
}
