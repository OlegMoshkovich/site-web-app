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
                <p className="mb-2"><strong>clone:it GmbH</strong></p>
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

                <p className="mb-4"><strong>Datenschutzbeauftragter:</strong><br />Ein Datenschutzbeauftragter ist nicht bestellt, da hierfür gemäß Art. 37 DSGVO keine gesetzliche Verpflichtung besteht.</p>

                <p>Diese Datenschutzerklärung gilt für unsere mobile App und unsere Website (zusammen der „Dienst").</p>
                <p>Wir verarbeiten personenbezogene Daten ausschließlich im Einklang mit der Datenschutz-Grundverordnung (DSGVO) und den geltenden EU-Datenschutzgesetzen.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Unsere Datenschutz-Grundsätze</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Wir erheben so wenig Daten wie möglich</li>
                  <li>Wir betreiben kein nutzer- oder marketingbezogenes Tracking</li>
                  <li>Wir verwenden keine Analyse-SDKs</li>
                  <li>Wir verkaufen oder teilen keine personenbezogenen Daten</li>
                  <li>Wir erstellen keine Nutzerprofile</li>
                  <li>Wir nutzen Daten nicht für Marketing oder Werbung</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Welche Daten wir verarbeiten</h2>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Kategorien personenbezogener Daten</h3>
                <p className="mb-2">Wir verarbeiten – abhängig von der Nutzung unseres Dienstes – insbesondere folgende Kategorien personenbezogener Daten:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Kontakt- und Kommunikationsdaten (z. B. E-Mail-Adresse, Nachrichteninhalt bei Kontaktaufnahme)</li>
                  <li>Nutzungsbezogene Inhaltsdaten, die Sie freiwillig innerhalb des Dienstes eingeben</li>
                  <li>Technische Zugriffsdaten (siehe Punkt 3.3)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Daten, die Sie freiwillig bereitstellen</h3>
                <p className="mb-2">Wir verarbeiten personenbezogene Daten nur, wenn Sie diese aktiv und freiwillig angeben, zum Beispiel:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>E-Mail-Adresse oder Nachrichteninhalt bei Kontaktaufnahme</li>
                  <li>Inhalte, die Sie innerhalb des Dienstes freiwillig eingeben</li>
                </ul>
                <p className="mb-1">Die Bereitstellung dieser Daten ist optional.</p>
                <p>Ohne bestimmte Angaben (z. B. Kontakt-E-Mail) kann es jedoch sein, dass Anfragen nicht bearbeitet werden können.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Technisch notwendige Daten</h3>
                <p className="mb-2">Beim Betrieb des Dienstes können technisch bedingt kurzfristig folgende Daten verarbeitet werden:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>IP-Adresse</li>
                  <li>Browser- oder Gerätetyp</li>
                  <li>Betriebssystem</li>
                  <li>Datum und Uhrzeit des Zugriffs</li>
                </ul>

                <p className="mb-2">Diese Daten:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>dienen ausschließlich der sicheren Bereitstellung und Stabilität des Dienstes</li>
                  <li>werden nicht zur Identifikation einzelner Nutzer verwendet</li>
                  <li>werden nicht mit anderen Daten zusammengeführt</li>
                  <li>werden nach spätestens 14 Tagen automatisch gelöscht</li>
                </ul>

                <p className="text-sm italic">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb des Dienstes)</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Daten, die wir ausdrücklich NICHT erheben</h2>
                <p className="mb-2">Wir erheben oder verwenden keine:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Werbe-IDs (IDFA, GAID)</li>
                  <li>Standortdaten</li>
                  <li>Analyse- oder Telemetriedaten</li>
                  <li>Nutzungs- oder Verhaltensprofile</li>
                  <li>sensiblen personenbezogenen Daten (Art. 9 DSGVO)</li>
                  <li>biometrischen Daten</li>
                </ul>
                <p>Es findet keine automatisierte Entscheidungsfindung und kein Profiling im Sinne des Art. 22 DSGVO statt.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Cookies & Tracking-Technologien</h2>
                <p className="mb-2">Wir verwenden keine Cookies oder ähnlichen Technologien zu:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Tracking-Zwecken</li>
                  <li>Analyse-Zwecken</li>
                  <li>Werbe-Zwecken</li>
                </ul>
                <p>Falls technisch zwingend erforderliche Cookies (z. B. Sicherheits- oder Session-Cookies) eingesetzt werden, sind diese für den Betrieb notwendig und einwilligungsfrei gemäß Art. 6 Abs. 1 lit. f DSGVO.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Zweck und Rechtsgrundlagen der Datenverarbeitung</h2>
                <p className="mb-2">Personenbezogene Daten werden ausschließlich verarbeitet zu folgenden Zwecken:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Bereitstellung und Betrieb des Dienstes</li>
                  <li>Beantwortung von Anfragen</li>
                  <li>Sicherheit und Missbrauchsprävention</li>
                  <li>Erfüllung gesetzlicher Verpflichtungen</li>
                </ul>
                <p className="mb-2">Die Verarbeitung erfolgt auf Basis folgender Rechtsgrundlagen:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche Maßnahmen)</li>
                  <li>Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtungen, z. B. steuer- und unternehmensrechtliche Aufbewahrungspflichten)</li>
                  <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem, stabilem und missbrauchsfreien Betrieb)</li>
                </ul>
                <p>Eine Nutzung zu Werbe-, Analyse- oder Profiling-Zwecken findet nicht statt.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Weitergabe von Daten</h2>
                <p className="mb-2">Wir geben keine personenbezogenen Daten weiter, außer:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>wenn dies gesetzlich erforderlich ist</li>
                  <li>an technisch notwendige Auftragsverarbeiter (z. B. Hosting-, Server- und E-Mail-Dienstleister)</li>
                  <li>zum Schutz unserer Rechte oder zur Missbrauchsverhinderung</li>
                </ul>
                <p className="mb-1">Alle Auftragsverarbeiter sind vertraglich gemäß Art. 28 DSGVO verpflichtet.</p>
                <p>Eine Weitergabe zu kommerziellen Zwecken erfolgt nicht.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Speicherung & Datenübermittlung</h2>
                <p className="mb-2">Daten werden ausschließlich innerhalb der Europäischen Union gespeichert. Es findet keine Übermittlung in Drittländer statt.</p>
                <p>Sollte künftig eine Drittlandübermittlung erforderlich werden, erfolgt diese ausschließlich unter Einhaltung der Art. 44 ff. DSGVO (z. B. Angemessenheitsbeschluss oder Standardvertragsklauseln).</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Speicherdauer</h2>
                <p className="mb-2">Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Kontaktanfragen: bis zu 12 Monate nach abschließender Bearbeitung</li>
                  <li>Technische Server- und Sicherheitslogs: bis zu 14 Tage</li>
                  <li>Vertrags- und abrechnungsrelevante Daten gemäß gesetzlichen Aufbewahrungspflichten (in der Regel 7 Jahre)</li>
                </ul>
                <p>Nach Ablauf der jeweiligen Fristen werden die Daten sicher gelöscht oder anonymisiert.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Ihre Rechte nach der DSGVO</h2>
                <p className="mb-2">Sie haben jederzeit das Recht auf:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Auskunft (Art. 15 DSGVO)</li>
                  <li>Berichtigung (Art. 16 DSGVO)</li>
                  <li>Löschung (Art. 17 DSGVO)</li>
                  <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                  <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                  <li>Widerspruch (Art. 21 DSGVO)</li>
                </ul>
                <p className="mb-4">Insbesondere können Sie der Verarbeitung Ihrer Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO jederzeit widersprechen.</p>

                <p className="mb-2"><strong>Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:</strong></p>
                <p className="mb-1">E-Mail: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p className="mb-4">Telefon: +43 676 755 5310</p>

                <p className="mb-2">Sie haben zudem das Recht, Beschwerde bei der zuständigen Aufsichtsbehörde einzulegen:</p>
                <p className="mb-1"><strong>Österreichische Datenschutzbehörde</strong></p>
                <p className="mb-1">Barichgasse 40–42</p>
                <p className="mb-1">1030 Wien</p>
                <p className="mb-1">Telefon: +43 1 52 152-0</p>
                <p className="mb-1">E-Mail: <a href="mailto:dsb@dsb.gv.at" className="text-blue-600 hover:underline">dsb@dsb.gv.at</a></p>
                <p>Website: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.dsb.gv.at</a></p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. App-Store- & Play-Store-Konformität</h2>

                <h3 className="text-xl font-semibold mb-3 mt-4">Apple App Store</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Kein Nutzer-Tracking</li>
                  <li>Keine Verknüpfung von Daten zu Werbezwecken</li>
                  <li>Keine Drittanbieter-SDKs</li>
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
                <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die jeweils aktuelle Version ist jederzeit auf unserer Website abrufbar.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Kontakt</h2>
                <p className="mb-2"><strong>clone:it GmbH</strong></p>
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
                <p className="mb-2"><strong>clone:it GmbH</strong></p>
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

                <p className="mb-4"><strong>Data Protection Officer:</strong><br />No data protection officer has been appointed, as there is no legal obligation to do so pursuant to Art. 37 GDPR.</p>

                <p>This privacy policy applies to our mobile app and website (together, the "Service").</p>
                <p>We process personal data exclusively in accordance with the General Data Protection Regulation (GDPR) and applicable EU data protection laws.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Our Privacy Principles</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We collect as little data as possible</li>
                  <li>We do not engage in user- or marketing-related tracking</li>
                  <li>We do not use analytics SDKs</li>
                  <li>We do not sell or share personal data</li>
                  <li>We do not create user profiles</li>
                  <li>We do not use data for marketing or advertising</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. What Data We Process</h2>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Categories of Personal Data</h3>
                <p className="mb-2">Depending on how you use our Service, we process the following categories of personal data in particular:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Contact and communication data (e.g., email address, message content when contacting us)</li>
                  <li>Usage-related content data that you voluntarily enter within the Service</li>
                  <li>Technical access data (see section 3.3)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Data You Voluntarily Provide</h3>
                <p className="mb-2">We process personal data only when you actively and voluntarily provide it, for example:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Email address or message content when contacting us</li>
                  <li>Content you voluntarily enter within the Service</li>
                </ul>
                <p className="mb-1">Providing this data is optional.</p>
                <p>However, without certain information (e.g., contact email), it may not be possible to process your request.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Technically Necessary Data</h3>
                <p className="mb-2">When operating the Service, the following data may be processed temporarily for technical reasons:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>IP address</li>
                  <li>Browser or device type</li>
                  <li>Operating system</li>
                  <li>Date and time of access</li>
                </ul>

                <p className="mb-2">This data:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>serves exclusively to ensure secure and stable operation of the Service</li>
                  <li>is not used to identify individual users</li>
                  <li>is not combined with other data</li>
                  <li>is automatically deleted after a maximum of 14 days</li>
                </ul>

                <p className="text-sm italic">Legal basis: Art. 6(1)(f) GDPR (legitimate interest in secure and stable operation of the Service)</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Data We Explicitly Do NOT Collect</h2>
                <p className="mb-2">We do not collect or use:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Advertising IDs (IDFA, GAID)</li>
                  <li>Location data</li>
                  <li>Analytics or telemetry data</li>
                  <li>Usage or behavioral profiles</li>
                  <li>Sensitive personal data (Art. 9 GDPR)</li>
                  <li>Biometric data</li>
                </ul>
                <p>No automated decision-making or profiling within the meaning of Art. 22 GDPR takes place.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Cookies & Tracking Technologies</h2>
                <p className="mb-2">We do not use cookies or similar technologies for:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Tracking purposes</li>
                  <li>Analytics purposes</li>
                  <li>Advertising purposes</li>
                </ul>
                <p>If technically essential cookies (e.g., security or session cookies) are used, they are necessary for operation and exempt from consent requirements pursuant to Art. 6(1)(f) GDPR.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Purpose and Legal Bases of Data Processing</h2>
                <p className="mb-2">Personal data is processed exclusively for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Providing and operating the Service</li>
                  <li>Responding to inquiries</li>
                  <li>Security and abuse prevention</li>
                  <li>Fulfilling legal obligations</li>
                </ul>
                <p className="mb-2">Processing is based on the following legal bases:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Art. 6(1)(b) GDPR (performance of a contract or pre-contractual measures)</li>
                  <li>Art. 6(1)(c) GDPR (legal obligations, e.g., statutory retention requirements under tax and corporate law)</li>
                  <li>Art. 6(1)(f) GDPR (legitimate interest in secure, stable, and abuse-free operation)</li>
                </ul>
                <p>We do not use data for advertising, analytics, or profiling purposes.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Data Sharing</h2>
                <p className="mb-2">We do not share personal data, except:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>when legally required</li>
                  <li>with technically necessary processors (e.g., hosting, server, and email service providers)</li>
                  <li>to protect our rights or prevent abuse</li>
                </ul>
                <p className="mb-1">All processors are contractually bound pursuant to Art. 28 GDPR.</p>
                <p>We do not share data for commercial purposes.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Storage & Data Transfer</h2>
                <p className="mb-2">Data is stored exclusively within the European Union. No transfer to third countries takes place.</p>
                <p>Should a third-country transfer become necessary in the future, it will only occur in compliance with Art. 44 et seq. GDPR (e.g., adequacy decision or standard contractual clauses).</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Retention Period</h2>
                <p className="mb-2">We store personal data only for as long as necessary for the respective purposes:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Contact requests: up to 12 months after final processing</li>
                  <li>Technical server and security logs: up to 14 days</li>
                  <li>Contract and billing-related data in accordance with statutory retention obligations (generally 7 years)</li>
                </ul>
                <p>After the respective periods expire, the data is securely deleted or anonymized.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Your Rights Under GDPR</h2>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Access (Art. 15 GDPR)</li>
                  <li>Rectification (Art. 16 GDPR)</li>
                  <li>Erasure (Art. 17 GDPR)</li>
                  <li>Restriction of processing (Art. 18 GDPR)</li>
                  <li>Data portability (Art. 20 GDPR)</li>
                  <li>Object (Art. 21 GDPR)</li>
                </ul>
                <p className="mb-4">In particular, you may object at any time to the processing of your data based on Art. 6(1)(f) GDPR.</p>

                <p className="mb-2"><strong>To exercise your rights, contact us at:</strong></p>
                <p className="mb-1">Email: <a href="mailto:paul.wegerer@cloneit.at" className="text-blue-600 hover:underline">paul.wegerer@cloneit.at</a></p>
                <p className="mb-4">Phone: +43 676 755 5310</p>

                <p className="mb-2">You also have the right to lodge a complaint with the competent supervisory authority:</p>
                <p className="mb-1"><strong>Austrian Data Protection Authority</strong></p>
                <p className="mb-1">Barichgasse 40–42</p>
                <p className="mb-1">1030 Vienna, Austria</p>
                <p className="mb-1">Phone: +43 1 52 152-0</p>
                <p className="mb-1">Email: <a href="mailto:dsb@dsb.gv.at" className="text-blue-600 hover:underline">dsb@dsb.gv.at</a></p>
                <p>Website: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.dsb.gv.at</a></p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. App Store & Play Store Compliance</h2>

                <h3 className="text-xl font-semibold mb-3 mt-4">Apple App Store</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>No user tracking</li>
                  <li>No linking of data for advertising purposes</li>
                  <li>No third-party SDKs</li>
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
                <p>We reserve the right to update this privacy policy. The current version is always available on our website.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
                <p className="mb-2"><strong>clone:it GmbH</strong></p>
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
