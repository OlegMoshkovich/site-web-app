"use client";

import Link from "next/link";
import { Footer } from "@/components/footer";
import { allPosts } from "content-collections";

const sectionClass =
  "min-h-screen flex items-center w-full";
const innerClass = "w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 py-24";
const labelClass = "text-xs text-gray-600 uppercase tracking-widest mb-4";
const titleClass =
  "text-3xl sm:text-7xl font-semibold text-white leading-tight mb-6";
const descClass =
  "text-sm sm:text-2xl text-gray-400 max-w-xl leading-relaxed mb-10";
const subLabelClass = "text-xs text-gray-600 uppercase tracking-widest mb-3";
const listClass =
  "grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3";
const listItemClass = "text-lg text-gray-500 flex items-center gap-3";

function Dot() {
  return <span className="w-1 h-1 bg-gray-600 rounded-full flex-shrink-0" />;
}

export default function ServicesPage() {
  return (
    <main className="bg-black">
      {/* Sticky navbar */}
      <nav className="fixed top-0 z-50 w-full flex justify-center h-16 bg-black">
        <div className="w-full max-w-6xl flex justify-between items-center px-3 sm:px-8 text-md">
          <Link href="/" className="text-md font-bold text-white bg-black px-3 py-1 border border-gray-800">
            clone:it
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/software" className="text-sm text-gray-400 hover:text-white transition-colors">
              Our Software
            </Link>
            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* 00 — Hero */}
      <section className="min-h-screen flex items-center w-full">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 py-24">
          <p className={labelClass}>clone:it GmbH</p>
          <h1 className={titleClass}>Unsere Leistungen</h1>
          <p className={descClass}>
            Baumanagement und digitale Baustelle aus einer Hand — von der
            Planung über die Ausschreibung bis zur Bauüberwachung.
          </p>
        </div>
      </section>

      {/* Blog scroll */}
      <section className="w-full">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 pt-16 pb-8">
          <div className="flex items-center justify-between mb-8">
            <p className={labelClass}>Blog</p>
            <Link href="/blog" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              All posts →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {allPosts
              .slice()
              .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
              .map((post) => (
                <Link
                  key={post.slugAsParams}
                  href={post.slug}
                  className="group flex-none w-64 border border-gray-800 hover:border-gray-600 transition-colors overflow-hidden"
                >
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4">
                    {post.category && (
                      <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">{post.category}</p>
                    )}
                    <h3 className="text-sm font-semibold text-white leading-snug mb-3 group-hover:text-gray-200 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <time className="text-xs text-gray-700">
                      {new Date(post.published).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </time>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* 01 — Örtliche Bauaufsicht */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>01</p>
          <h2 className={titleClass}>Örtliche Bauaufsicht</h2>
          <p className={descClass}>
            Wir vertreten die Interessen des Bauherrn auf der Baustelle und
            überwachen Termin, Kosten und Qualität.
          </p>
          <ul className={listClass}>
            {["Terminüberwachung","Kostenkontrolle","Qualitätskontrolle","Rechnungsprüfung","Baustellenkoordination","Mängelmanagement","Dokumentation"].map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 02 — Planung */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>02</p>
          <h2 className={titleClass}>Planung</h2>
          <p className={descClass}>
            Gemeinsam mit unserem Partnerbüro Convex ZT GmbH bieten wir
            umfassende Ausführungsplanung.
          </p>
          <ul className={listClass}>
            {["Einreichplanung","Ausführungsplanung","Detailplanung","Tragwerksplanung"].map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 03 — Ausschreibung */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>03</p>
          <h2 className={titleClass}>Ausschreibung & Vergabe</h2>
          <p className={descClass}>
            Wir erstellen Ausschreibungen und begleiten den Vergabeprozess
            professionell und effizient.
          </p>
          <ul className={listClass}>
            {["Erstellung Leistungsverzeichnisse","Massenermittlung","Angebotsprüfung","Preisspiegel","Vergabeverhandlungen","Vergabevorschlag"].map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 — Digitale Baustelle */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>04</p>
          <h2 className={titleClass}>Digitale Baustelle</h2>
          <p className={descClass}>
            Unsere eigene Software Simple Site zur digitalen
            Baustellendokumentation — Fotodokumentation, Bautagebuch und
            Berichte, alles in einer App.
          </p>
          <ul className={listClass}>
            {["Fotodokumentation mit Planverortung","Bautagebuch","Mängelmanagement","Baufortschrittsdokumentation","Automatische Berichte","App & Web Plattform"].map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Warum clone:it */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>Warum clone:it</p>
          <h2 className={titleClass}>Baumanagement und digitale Baustelle aus einer Hand</h2>
          <p className={descClass}>
            Wir kombinieren klassische Bauleistungen mit digitaler
            Baustellendokumentation und Softwarelösungen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div>
              <p className={subLabelClass}>Unsere Leistungen</p>
              <ul className="space-y-3">
                {["Planung","Ausschreibung","Örtliche Bauaufsicht","Digitale Baustellendokumentation","Softwarelösungen für Bauprojekte"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className={subLabelClass}>Vorteil für Bauherren</p>
              <ul className="space-y-3">
                {["Ein Ansprechpartner","Klare Kommunikation","Digitale Dokumentation","Transparente Projektabwicklung","Terminsicherheit","Kostenkontrolle"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Referenzen */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>Referenzen</p>
          <h2 className={titleClass}>Referenzprojekte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div>
              <p className="text-base font-semibold text-white mb-2">Heizkraftwerk Süd – München</p>
              <p className="text-xs text-gray-600 mb-4">Großprojekt Industriebau</p>
              <ul className="space-y-3">
                {["Örtliche Bauaufsicht Hochbau","Koordination Gewerke","Termin- und Qualitätskontrolle"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-2">Schaukäserei Melk</p>
              <p className="text-xs text-gray-600 mb-4">Hochbau / Gewerbebau</p>
              <ul className="space-y-3">
                {["Örtliche Bauaufsicht","Ausschreibung","Projektbegleitung"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Software */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>Software</p>
          <h2 className={titleClass}>Unsere Software für die Baustelle</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <p className="text-base font-semibold text-white mb-2">Simple Site</p>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">Digitale Baustellendokumentation</p>
              <ul className="space-y-3">
                {["Fotos mit Planverortung","Bautagebuch","Mängelmanagement","Berichte automatisch erstellen","Echtzeit Synchronisation","Web & App"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-2">AR BIM Inspection</p>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">Pilotprojekte — seeking funding</p>
              <ul className="space-y-3">
                {["BIM Modelle auf der Baustelle anzeigen","Kontrolle von Bauteilen"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-2">IT & Softwareentwicklung</p>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">Digitale Lösungen für Bauprojekte</p>
              <ul className="space-y-3">
                {["Web- und App-Entwicklung","Technische Beratung"].map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>Team</p>
          <h2 className={titleClass}>Unser Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {[
              {
                name: "DI Paul Wegerer",
                role: "Baumeister | Projektleitung | Digitalisierung",
                bio: "Paul Wegerer studierte Baumanagement und Ingenieurbau an der FH Joanneum. Nach mehrjähriger Erfahrung in Planung, Bauüberwachung und Claim Management absolvierte er die Baumeisterprüfung.",
              },
              {
                name: "DI Liebhard Mattuschka",
                role: "Projektsteuerung | Bauüberwachung",
                bio: "Absolvent der FH Joanneum im Bereich Baumanagement. Erfahrung in der Bauüberwachung und Projektsteuerung bei Großprojekten wie dem Heizkraftwerk Süd in München und der Münchner Stammstrecke.",
              },
              {
                name: "Dr. Timur Uzunoglu",
                role: "Ziviltechniker | Experte Bauwesen",
                bio: "Lehrender an der FH Joanneum, Dr. techn. im Bauingenieurwesen und gerichtlich beeideter Ziviltechniker. Unterstützt clone:it als Experte und Berater für komplexe Fachthemen.",
              },
              {
                name: "Oleg Moshkovich",
                role: "Product Engineer | Softwareentwicklung",
                bio: "Spezialist für digitale Lösungen im Bauwesen. Erfahrung in internationalen Großprojekten wie dem Burj Khalifa und Infrastrukturprojekten in New York. Fokus auf Entwicklung smarter Tools für die Baustelle.",
              },
            ].map((person) => (
              <div key={person.name}>
                <p className="text-base font-semibold text-white mb-1">{person.name}</p>
                <p className="text-xs text-gray-600 mb-3">{person.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>Kontakt</p>
          <h2 className={titleClass}>Sie planen ein Bauprojekt?</h2>
          <p className={descClass}>
            Wir unterstützen Sie bei Planung, Bauaufsicht und digitaler
            Baustellendokumentation.
          </p>
          <a
            href="mailto:paul.wegerer@cloneit.at"
            className="inline-block text-sm text-black bg-white px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            Kontakt aufnehmen
          </a>
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 [&>footer]:mt-0 [&>footer]:mb-0 [&>footer]:pt-6 [&>footer]:pb-6">
        <Footer textColor="text-gray-300" />
      </div>
    </main>
  );
}
