"use client";

import { Footer } from "@/components/footer";
import { AuthButtonClient } from "@/components/auth-button-client";
import Link from "next/link";
import { getNavbarClasses, getContentClasses } from "@/lib/layout-constants";
import Image from "next/image";
import { useState } from "react";

export default function PrivacyPolicyPage() {
  const [language, setLanguage] = useState<"de" | "en">("de");

  return (
    <main className="flex flex-col items-center">
      <div className="w-full flex flex-col gap-0 items-center">
        {/* Navbar */}
        <nav className={`${getNavbarClasses().container} bg-white`}>
          <div className={getNavbarClasses().content}>
            <div className="flex text-lg gap-5 items-center font-semibold">
              <Link
                href="/"
                className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                <Image
                  src="/images/banner_logo.png"
                  alt="Site Banner"
                  width={120}
                  height={32}
                  className="h-4 sm:h-6 w-auto max-w-none"
                />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === "de" ? "en" : "de")}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {language === "de" ? "EN" : "DE"}
              </button>
              <AuthButtonClient />
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <div className={getContentClasses().container}>
          <div className={`${getContentClasses().inner} max-w-4xl`}>
            {language === "de" ? (
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none py-8">
              <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung (EU / DSGVO)</h1>
              <p className="text-sm text-gray-600 mb-8">Stand: 14.01.2026</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Verantwortlicher</h2>
                <p className="mb-2"><strong>cloneit GmbH</strong></p>
                <p className="mb-1">Am Katzelbach 9</p>
                <p className="mb-1">8054 Graz</p>
                <p className="mb-4">Österreich</p>

                <p className="mb-1">Geschäftsführer: Dipl. Ing. Paul Wegerer (CEO)</p>
                <p className="mb-4">Technischer Leiter: Dipl. Ing. Liebhard Mattuschka (CTO)</p>

                <p className="mb-2"><strong>Kontakt:</strong></p>
                <p className="mb-1">E-Mail: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p className="mb-1">Telefon: +43 676 755 5310</p>
                <p className="mb-4">Website: <a href="https://www.cloneit.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cloneit.at</a></p>

                <p className="mb-1">Firmenbuchnummer: FN 601893 m</p>
                <p className="mb-1">Firmenbuchgericht: Graz</p>
                <p className="mb-1">UID-Nr.: ATU79501148</p>
                <p className="mb-4">Mitglied: Wirtschaftskammer Steiermark (WKO)</p>

                <p>Diese Datenschutzerklärung gilt für unsere mobile App und unsere Website (zusammen der „Dienst").</p>
                <p>Wir verarbeiten personenbezogene Daten ausschließlich im Einklang mit der Datenschutz-Grundverordnung (DSGVO) und den geltenden EU-Datenschutzgesetzen.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Unsere Datenschutz-Grundsätze</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Wir erheben so wenig Daten wie möglich</li>
                  <li>Wir betreiben kein Tracking</li>
                  <li>Wir verwenden keine Analyse- oder Werbe-SDKs</li>
                  <li>Wir verkaufen oder teilen keine personenbezogenen Daten</li>
                  <li>Wir erstellen keine Nutzerprofile</li>
                  <li>Wir nutzen Daten nicht für Marketing oder Werbung</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Welche Daten wir verarbeiten</h2>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Daten, die Sie freiwillig bereitstellen</h3>
                <p className="mb-2">Wir verarbeiten personenbezogene Daten nur, wenn Sie diese aktiv und freiwillig angeben, zum Beispiel:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>E-Mail-Adresse oder Nachrichteninhalt bei Kontaktaufnahme</li>
                  <li>Inhalte, die Sie innerhalb des Dienstes freiwillig eingeben</li>
                </ul>
                <p>Die Bereitstellung dieser Daten ist optional.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Technisch notwendige Daten</h3>
                <p className="mb-2">Beim Betrieb des Dienstes können technisch bedingt kurzfristig folgende Daten verarbeitet werden:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>IP-Adresse</li>
                  <li>Browser- oder Gerätetyp</li>
                  <li>Datum und Uhrzeit des Zugriffs</li>
                </ul>

                <p className="mb-2">Diese Daten:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>dienen ausschließlich der sicheren Bereitstellung des Dienstes</li>
                  <li>werden nicht zur Identifikation von Personen verwendet</li>
                  <li>werden nicht mit anderen Daten zusammengeführt</li>
                  <li>werden automatisch nach kurzer Zeit gelöscht</li>
                </ul>

                <p className="text-sm italic">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem Betrieb)</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Daten, die wir ausdrücklich NICHT erheben</h2>
                <p className="mb-2">Wir erheben oder verwenden keine:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Werbe-IDs (IDFA, GAID)</li>
                  <li>Standortdaten</li>
                  <li>Analyse- oder Telemetriedaten</li>
                  <li>Nutzungs- oder Verhaltensprofile</li>
                  <li>sensiblen personenbezogenen Daten (Art. 9 DSGVO)</li>
                  <li>biometrischen Daten</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Cookies & Tracking-Technologien</h2>
                <p className="mb-2">Wir verwenden keine Cookies oder ähnlichen Technologien zu:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Tracking-Zwecken</li>
                  <li>Analyse-Zwecken</li>
                  <li>Werbe-Zwecken</li>
                </ul>
                <p>Falls technisch zwingend erforderliche Cookies (z. B. Sicherheits- oder Session-Cookies) eingesetzt werden, sind diese für den Betrieb notwendig und einwilligungsfrei gemäß EU-Recht.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Zweck der Datenverarbeitung</h2>
                <p className="mb-2">Personenbezogene Daten werden ausschließlich verarbeitet, um:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>den Dienst bereitzustellen und zu betreiben</li>
                  <li>Anfragen zu beantworten</li>
                  <li>Sicherheit und Missbrauchsprävention zu gewährleisten</li>
                  <li>gesetzlichen Pflichten nachzukommen</li>
                </ul>
                <p>Eine Nutzung zu Werbe-, Analyse- oder Profiling-Zwecken findet nicht statt.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Weitergabe von Daten</h2>
                <p className="mb-2">Wir geben keine personenbezogenen Daten weiter, außer:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>wenn dies gesetzlich erforderlich ist</li>
                  <li>an technisch notwendige Dienstleister (z. B. Hosting), ausschließlich auf Basis von Auftragsverarbeitungsverträgen nach Art. 28 DSGVO</li>
                  <li>zum Schutz unserer Rechte oder zur Missbrauchsverhinderung</li>
                </ul>
                <p>Eine Weitergabe zu kommerziellen Zwecken erfolgt nicht.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Speicherung & Datenübermittlung</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Daten werden ausschließlich innerhalb der Europäischen Union gespeichert</li>
                  <li>Es findet keine Übermittlung in Drittländer statt</li>
                  <li>Sollte dies zukünftig erforderlich werden, erfolgen Übermittlungen nur unter Einhaltung der DSGVO-Vorgaben</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Speicherdauer</h2>
                <p className="mb-2">Personenbezogene Daten werden nur so lange gespeichert, wie dies erforderlich ist:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>zur Bereitstellung des Dienstes</li>
                  <li>zur Erfüllung gesetzlicher Pflichten</li>
                </ul>
                <p>Anschließend werden die Daten sicher gelöscht.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Ihre Rechte nach der DSGVO</h2>
                <p className="mb-2">Sie haben jederzeit das Recht auf:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Auskunft (Art. 15 DSGVO)</li>
                  <li>Berichtigung (Art. 16 DSGVO)</li>
                  <li>Löschung (Art. 17 DSGVO)</li>
                  <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                  <li>Widerspruch (Art. 21 DSGVO)</li>
                  <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                  <li>Beschwerde bei einer Aufsichtsbehörde</li>
                </ul>

                <p className="mb-2"><strong>Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:</strong></p>
                <p className="mb-1">E-Mail: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p>Telefon: +43 676 755 5310</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. App-Store- & Play-Store-Konformität</h2>

                <h3 className="text-xl font-semibold mb-3 mt-4">Apple App Store</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Keine Nutzer-Tracking oder Verknüpfung von Daten zu Werbezwecken</li>
                  <li>Keine Drittanbieter-Tracking-SDKs</li>
                  <li>App-Store-Datenschutzangaben: „Kein Tracking"</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-4">Google Play Store</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Konform mit der Google-Play-User-Data-Policy</li>
                  <li>Datenerhebung ausschließlich für Kernfunktionen</li>
                  <li>Keine Weitergabe oder Verkauf von Daten</li>
                  <li>Transparente Offenlegung in der „Datensicherheit"-Sektion</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Datenschutz von Kindern</h2>
                <p>Der Dienst richtet sich nicht an Kinder unter 16 Jahren. Wir erheben wissentlich keine personenbezogenen Daten von Kindern.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Änderungen dieser Datenschutzerklärung</h2>
                <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die jeweils aktuelle Version ist jederzeit hier verfügbar.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Kontakt</h2>
                <p className="mb-2"><strong>cloneit GmbH</strong></p>
                <p className="mb-1">Am Katzelbach 9</p>
                <p className="mb-1">8054 Graz</p>
                <p className="mb-4">Österreich</p>

                <p className="mb-1">E-Mail: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p className="mb-1">Telefon: +43 676 755 5310</p>
                <p className="mb-4">Website: <a href="https://www.cloneit.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cloneit.at</a></p>

                <p className="text-sm text-gray-600 mt-8">Stand: 14.01.2026</p>
              </section>
            </div>
            ) : (
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none py-8">
              <h1 className="text-3xl font-bold mb-6">Privacy Policy (EU / GDPR)</h1>
              <p className="text-sm text-gray-600 mb-8">Last Updated: January 14, 2026</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Controller</h2>
                <p className="mb-2"><strong>cloneit GmbH</strong></p>
                <p className="mb-1">Am Katzelbach 9</p>
                <p className="mb-1">8054 Graz</p>
                <p className="mb-4">Austria</p>

                <p className="mb-1">Managing Director: Dipl. Ing. Paul Wegerer (CEO)</p>
                <p className="mb-4">Technical Director: Dipl. Ing. Liebhard Mattuschka (CTO)</p>

                <p className="mb-2"><strong>Contact:</strong></p>
                <p className="mb-1">Email: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p className="mb-1">Phone: +43 676 755 5310</p>
                <p className="mb-4">Website: <a href="https://www.cloneit.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cloneit.at</a></p>

                <p className="mb-1">Company Registration Number: FN 601893 m</p>
                <p className="mb-1">Company Court: Graz</p>
                <p className="mb-1">VAT ID: ATU79501148</p>
                <p className="mb-4">Member: Wirtschaftskammer Steiermark (WKO)</p>

                <p>This privacy policy applies to our mobile app and website (together, the "Service").</p>
                <p>We process personal data exclusively in accordance with the General Data Protection Regulation (GDPR) and applicable EU data protection laws.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Our Privacy Principles</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We collect as little data as possible</li>
                  <li>We do not track users</li>
                  <li>We do not use analytics or advertising SDKs</li>
                  <li>We do not sell or share personal data</li>
                  <li>We do not create user profiles</li>
                  <li>We do not use data for marketing or advertising</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. What Data We Process</h2>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Data You Voluntarily Provide</h3>
                <p className="mb-2">We process personal data only when you actively and voluntarily provide it, for example:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Email address or message content when contacting us</li>
                  <li>Content you voluntarily enter within the Service</li>
                </ul>
                <p>Providing this data is optional.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Technically Necessary Data</h3>
                <p className="mb-2">When operating the Service, the following data may be processed temporarily for technical reasons:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>IP address</li>
                  <li>Browser or device type</li>
                  <li>Date and time of access</li>
                </ul>

                <p className="mb-2">This data:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>serves exclusively to ensure secure operation of the Service</li>
                  <li>is not used to identify individuals</li>
                  <li>is not combined with other data</li>
                  <li>is automatically deleted after a short period</li>
                </ul>

                <p className="text-sm italic">Legal basis: Art. 6(1)(f) GDPR (legitimate interest in secure operation)</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Data We Explicitly Do NOT Collect</h2>
                <p className="mb-2">We do not collect or use:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Advertising IDs (IDFA, GAID)</li>
                  <li>Location data</li>
                  <li>Analytics or telemetry data</li>
                  <li>Usage or behavioral profiles</li>
                  <li>Sensitive personal data (Art. 9 GDPR)</li>
                  <li>Biometric data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Cookies & Tracking Technologies</h2>
                <p className="mb-2">We do not use cookies or similar technologies for:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Tracking purposes</li>
                  <li>Analytics purposes</li>
                  <li>Advertising purposes</li>
                </ul>
                <p>If technically essential cookies (e.g., security or session cookies) are used, they are necessary for operation and exempt from consent requirements under EU law.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Purpose of Data Processing</h2>
                <p className="mb-2">Personal data is processed exclusively to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>provide and operate the Service</li>
                  <li>respond to inquiries</li>
                  <li>ensure security and prevent abuse</li>
                  <li>comply with legal obligations</li>
                </ul>
                <p>We do not use data for advertising, analytics, or profiling purposes.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Data Sharing</h2>
                <p className="mb-2">We do not share personal data, except:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>when legally required</li>
                  <li>with technically necessary service providers (e.g., hosting), exclusively based on data processing agreements pursuant to Art. 28 GDPR</li>
                  <li>to protect our rights or prevent abuse</li>
                </ul>
                <p>We do not share data for commercial purposes.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Storage & Data Transfer</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Data is stored exclusively within the European Union</li>
                  <li>No transfer to third countries takes place</li>
                  <li>Should this become necessary in the future, transfers will only occur in compliance with GDPR requirements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Retention Period</h2>
                <p className="mb-2">Personal data is only stored for as long as necessary:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>to provide the Service</li>
                  <li>to fulfill legal obligations</li>
                </ul>
                <p>After that, the data is securely deleted.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Your Rights Under GDPR</h2>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Access (Art. 15 GDPR)</li>
                  <li>Rectification (Art. 16 GDPR)</li>
                  <li>Erasure (Art. 17 GDPR)</li>
                  <li>Restriction of processing (Art. 18 GDPR)</li>
                  <li>Object (Art. 21 GDPR)</li>
                  <li>Data portability (Art. 20 GDPR)</li>
                  <li>Lodge a complaint with a supervisory authority</li>
                </ul>

                <p className="mb-2"><strong>To exercise your rights, contact us at:</strong></p>
                <p className="mb-1">Email: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p>Phone: +43 676 755 5310</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. App Store & Play Store Compliance</h2>

                <h3 className="text-xl font-semibold mb-3 mt-4">Apple App Store</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>No user tracking or data linking for advertising purposes</li>
                  <li>No third-party tracking SDKs</li>
                  <li>App Store privacy label: "No Tracking"</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-4">Google Play Store</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Compliant with Google Play User Data Policy</li>
                  <li>Data collection exclusively for core functionality</li>
                  <li>No sharing or selling of data</li>
                  <li>Transparent disclosure in the "Data Safety" section</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Children's Privacy</h2>
                <p>The Service is not directed at children under 16 years of age. We do not knowingly collect personal data from children.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
                <p>We reserve the right to update this privacy policy. The current version is always available here.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
                <p className="mb-2"><strong>cloneit GmbH</strong></p>
                <p className="mb-1">Am Katzelbach 9</p>
                <p className="mb-1">8054 Graz</p>
                <p className="mb-4">Austria</p>

                <p className="mb-1">Email: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p className="mb-1">Phone: +43 676 755 5310</p>
                <p className="mb-4">Website: <a href="https://www.cloneit.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cloneit.at</a></p>

                <p className="text-sm text-gray-600 mt-8">Last Updated: January 14, 2026</p>
              </section>
            </div>
            )}

            <Footer />
          </div>
        </div>
      </div>
    </main>
  );
}
