"use client";

import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { allPosts } from "content-collections";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/translations";

const sectionClass =
  "flex items-center w-full";
/** Same horizontal padding as `Footer` (`px-3 sm:px-8`) so the Kontakt block and Impressum align. */
const innerClass =
  "w-[90%] sm:w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 py-24";
const labelClass = "text-xs text-gray-600 uppercase tracking-widest mb-4";
const titleClass =
  "text-3xl sm:text-7xl font-semibold text-white leading-tight mb-6";
const descClass =
  "text-sm sm:text-2xl text-gray-400 max-w-xl leading-relaxed mb-10";
const subLabelClass = "text-xs text-gray-600 uppercase tracking-widest mb-3";
const listItemClass = "text-lg text-gray-500 flex items-center gap-3";

function Dot() {
  return <span className="w-1 h-1 bg-gray-600 rounded-full flex-shrink-0" />;
}

const pageContent = {
  en: {
    nav: {
      software: "Our Software",
      blog: "Blog",
      signIn: "Sign in",
      signUp: "Sign up",
    },
    hero: {
      label: "Construction Management | Planning | Tendering | Software",
      title: "We coordinate construction projects.",
      subtitle: "Costs, progress and quality always in view.",
      descBefore: "We support building owners and companies in the implementation of construction projects – from planning and tendering to construction supervision and completion.",
      descBefore2: "With our own software ",
      descAfter: ", we additionally digitise the construction site and project communication.",
      anchors: [
        { label: "Construction Management", href: "#leistungen" },
        { label: "Planning", href: "#planung" },
        { label: "Tendering", href: "#ausschreibung" },
        { label: "Software Dev", href: "#digital" },
        { label: "References", href: "#referenzen" },
        { label: "Personal Projects", href: "#teamerfahrung" },
        { label: "Software", href: "#software" },
        { label: "Team", href: "#team" },
        { label: "Awards", href: "#presse" },
        { label: "Contact", href: "#kontakt" },
      ],
    },
    blog: {
      heading: "Blog",
      allPosts: "All posts →",
    },
    bauaufsicht: {
      title: "Construction Management",
      desc: "We represent the interests of the building owner on the construction site and monitor schedule, costs and quality.",
      items: ["Schedule monitoring", "Cost control", "Quality control", "Invoice verification", "Site coordination", "Defect management", "Documentation", "ÖBA/Construction supervision", "Claim management"],
    },
    planung: {
      title: "Planning",
      descBefore: "In collaboration with our partner office ",
      descAfter: " we offer planning from the draft to the execution planning",
      descHighlight: "also for the most complex projects.",
      items: ["Submission planning", "Execution planning", "Structural engineering"],
      sublabel: "Project overview",
      linkText: "Project overview of convex ZT GmbH →",
    },
    ausschreibung: {
      title: "Tendering & Procurement",
      desc: "We prepare tenders and support the procurement process.",
      items: ["Bills of quantities", "Quantity take-off", "Bid evaluation", "Price comparison", "Contract negotiations", "Contract award proposal"],
    },
    digital: {
      title: "Software Development",
      desc: "We develop tailored software solutions for the construction and infrastructure industry. Drawing on our experience in construction practice, we quickly understand requirements and implement them as efficient digital solutions. Development is done entirely in-house.",
      leistungenLabel: "Services:",
      items: ["Web-based applications", "Mobile apps (Android & iOS)", "AI integrations and automations", "3D models, BIM applications and databases"],
    },
    warum: {
      label: "Why clone:it",
      title: "Construction management and digital construction site from a single source",
      desc: "We combine classic construction services with digital construction site documentation and software solutions.",
      leistungenLabel: "Our Services",
      leistungenItems: ["Planning", "Tendering", "Construction Site Supervision", "Digital Construction Site Documentation", "Software Solutions for Construction Projects"],
      vorteilLabel: "Advantage for Building Owners",
      vorteilItems: ["One point of contact", "Clear communication", "Digital documentation", "Transparent project handling", "Schedule reliability", "Cost control"],
    },
    referenzen: {
      label: "References",
      title: "Reference Projects",
      project1: {
        name: "Heizkraftwerk Süd – Munich",
        type: "Large-scale industrial construction",
        link: "/blog/heizkraftwerk_sued_baudienstleistung",
        items: ["Construction site supervision – civil works", "Trade coordination", "Schedule and quality control"],
      },
      project2: {
        name: "Schaukäserei Melk",
        type: "Commercial construction",
        link: "/blog/schaukaserei_melk",
        items: ["Construction site supervision", "Tendering", "Project support"],
      },
    },
    teamReferenzen: {
      label: "Team Experience",
      title: "Personal Projects",
      note: "Selected projects of our team members from previous roles",
      members: [
        {
          name: "DI Liebhard Mattuschka",
          projects: [
            {
              name: "Heizkraftwerk Süd Munich",
              desc: "Tendering, procurement, execution planning, construction supervision and cost accounting for numerous conversion and new construction measures at HKW-Süd (service phases 6–9).",
            },
            {
              name: "TRAM – Westtangente Munich",
              desc: "Construction supervision of scheduling and planning services for traffic planning.",
            },
            {
              name: "Tübbing Production – Brenner Base Tunnel",
              desc: "On-site quality control at Max Bögl in Sengenthal for the production of approximately 45,000 tübbing segments. Coordination to align production schedule and quality for installation at the Brenner site.",
            },
            {
              name: "Mobility Innovation Campus",
              desc: "New construction of a test site for autonomous driving including parking garage. Project management of construction supervision on behalf of the general planner (service phases 6–9).",
            },
            {
              name: "Rehabilitation of A9 Pyhrnautobahn – 10 km",
              desc: "Construction supervision of 9 reinforced concrete bridges, road construction & noise barrier.",
            },
            {
              name: "Jesuitenrefektorium Graz & Feuerwache Graz-Ost",
              desc: "Project management: project control meetings, scheduling, cost planning and cost control.",
            },
          ],
        },
        {
          name: "DI Paul Wegerer",
          projects: [
            {
              name: "Heizkraftwerk Süd Munich",
              desc: "Construction supervision, trade coordination, schedule and quality control on a major industrial construction project.",
            },
            {
              name: "Munich Main Line (Stammstrecke)",
              desc: "Construction supervision and project management on one of Germany's most complex infrastructure projects.",
            },
            {
              name: "Schaukäserei Melk",
              desc: "Construction supervision, tendering and project support for commercial construction.",
            },
            {
              name: "ÖBB – 4-Track Expansion Linz–Wels",
              desc: "First test deployment of Simple Site on an ÖBB infrastructure project. The high documentation requirements drove key improvements to the app.",
              link: "/blog/simple_site_oebb_linz_wels",
            },
          ],
        },
        {
          name: "Oleg Moshkovich M.Eng",
          projects: [
            {
              name: "East Side Access – MTA New York",
              desc: "Led BIM strategy and modelling for the MTA's largest infrastructure programme in 50 years — a $18B underground transit expansion. Delivered a master model of 50 components covering 4 miles of tunnels and a three-level station 150 feet below Midtown Manhattan.",
            },
            {
              name: "New York City High-Rise Residential Complex",
              desc: "Developed BIM models and established coordination and issue resolution workflows across design and construction phases of a large-scale high-rise residential project.",
            },
            {
              name: "Virtual Design and Construction Textbook",
              desc: "Co-authored a textbook covering team structure, software selection, and production workflows for effective Virtual Design and Construction practice.",
              link: "https://www.amazon.de/-/en/Implementing-Virtual-Design-Construction-Using/dp/1032923725/",
            },
          ],
        },
      ],
    },
    software: {
      label: "Software",
      title: "Our Software for the Construction Site",
      simpleSiteDesc: "Digital construction site documentation",
      simpleSiteItems: ["Photos with plan location", "Construction diary", "Defect management", "Automatic report generation", "Real-time synchronisation", "Web & App"],
      arLabel: "AR BIM Inspection",
      arDesc: "Pilot projects — Seeking funding",
      arItems: ["Display BIM models on site", "Component inspection", "Pilot projects"],
      itLabel: "Software Development",
      itDesc: "We develop tailored software solutions for the construction and infrastructure industry. Our experience in construction practice allows us to quickly understand requirements and translate them into efficient digital solutions. Development is carried out entirely in-house.",
      itItems: ["Web-based applications", "Mobile Apps (Android & iOS)", "AI integrations and automation", "3D models, BIM applications and databases"],
    },
    team: {
      label: "Team",
      title: "Our Team",
      members: [
        {
          name: "DI Paul Wegerer",
          role: "Master Builder | Project Management | Digitalisation",
          bio: "Paul Wegerer studied Construction Management and Civil Engineering at FH Joanneum. After several years of experience in planning, construction supervision and claim management, he passed the master builder examination.",
          image: "/images/Paul.webp",
        },
        {
          name: "DI Liebhard Mattuschka",
          role: "Site Management – Project Management – Project Control",
          bio: "Liebhard studied Civil Engineering (Bachelor) in Graz and completed a Master’s in Construction Management and Civil Engineering in cooperation between Graz and a university in the USA, including a semester abroad. He has extensive experience from numerous projects in Austria and Germany.",
          image: "/images/Liebhard.webp",
        },
        {
          name: "Dr. Timur Uzunoglu",
          role: "Civil Engineer | Construction Expert",
          bio: "Lecturer at FH Joanneum, Dr. techn. in civil engineering and court-certified civil engineer. Supports clone:it as an expert and consultant for complex technical topics.",
          image: "/images/Timur.webp",
        },
        {
          name: "Oleg Moshkovich M.Eng",
          role: "Product Engineer | Software Development",
          bio: "Specialist in digital solutions for the construction industry. Experience in international large-scale projects such as the Burj Khalifa and infrastructure projects in New York. Focus on developing smart tools for construction sites.",
          image: "/images/Oleg.webp",
        },
      ],
    },
    presse: {
      label: "Press & Awards",
      title: "Awards",
      items: [
        { label: "Paul Wegerer: Forbes Top 30 under 30", link: "/blog/forbes_30_under_30_paul_wegerer" },
        { label: "Finalist: Austrian Startup Award", link: "/blog/austrian_startuo_worldcup" },
        { label: "Winner: BIM Löwe & Digital Bau Award", link: "/blog/cloneit_bim_loewen_2023" },
        { label: "Selected by DB Mindbox (Deutsche Bahn) for pilot projects", link: "/blog/cloneit_poc_dbmindbox" },
      ],
    },
    kontakt: {
      label: "Contact",
      title: "Planning a construction project?",
      desc: "We are happy to support you with planning, tendering, construction site supervision and digitalisation.",
      cta: "Get in touch",
    },
  },
  de: {
    nav: {
      software: "Unsere Software",
      blog: "Blog",
      signIn: "Anmelden",
      signUp: "Registrieren",
    },
    hero: {
      label: "Baumanagement | Planung | Ausschreibung | Software",
      title: "Wir koordinieren Bauprojekte.",
      subtitle: "Kosten, Fortschritt und Qualität immer im Blick.",
      descBefore: "Wir unterstützen Bauherren und Unternehmen bei der Umsetzung von Bauprojekten – von der Planung über die Ausschreibung bis zur Bauüberwachung und Fertigstellung. ",
      descBefore2: "Mit unserer eigenen Software ",
      descAfter: " digitalisieren wir zusätzlich die Baustelle und Projektkommunikation.",
      anchors: [
        { label: "Baumanagement", href: "#leistungen" },
        { label: "Planung", href: "#planung" },
        { label: "Ausschreibung", href: "#ausschreibung" },
        { label: "Softwareentwicklung", href: "#digital" },
        { label: "Referenzen", href: "#referenzen" },
        { label: "Teamerfahrung", href: "#teamerfahrung" },
        { label: "Software", href: "#software" },
        { label: "Team", href: "#team" },
        { label: "Auszeichnungen", href: "#presse" },
        { label: "Kontakt", href: "#kontakt" },
      ],
    },
    blog: {
      heading: "Blog",
      allPosts: "All posts →",
    },
    bauaufsicht: {
      title: "Baumanagement",
      desc: "Wir vertreten die Interessen des Bauherrn auf der Baustelle und überwachen Termin, Kosten und Qualität.",
      items: ["Terminüberwachung", "Kostenkontrolle", "Qualitätskontrolle", "Rechnungsprüfung", "Baustellenkoordination", "Mängelmanagement", "Dokumentation", "ÖBA/Bauüberwachung", "Nachtragsprüfungen"],
    },
    planung: {
      title: "Planung",
      descBefore: "In Zusammenarbeit mit unserem Partnerbüro ",
      descAfter: " bieten wir Planung vom Entwurf bis zur Ausführungsplanung",
      descHighlight: "auch für komplexeste Projekte.",
      items: ["Einreichplanung", "Ausführungsplanung", "Tragwerksplanung"],
      sublabel: "Projektübersicht",
      linkText: "Projektübersicht der convex ZT GmbH →",
    },
    ausschreibung: {
      title: "Ausschreibung & Vergabe",
      desc: "Wir erstellen Ausschreibungen und begleiten den Vergabeprozess.",
      items: ["Erstellung Leistungsverzeichnisse", "Massenermittlung", "Angebotsprüfung", "Preisspiegel", "Vergabeverhandlungen", "Vergabevorschlag"],
    },
    digital: {
      title: "Softwareentwicklung",
      desc: "Wir entwickeln maßgeschneiderte Softwarelösungen für die Bau- und Infrastrukturbranche. Durch unsere Erfahrung in der Baupraxis verstehen wir Anforderungen schnell und setzen diese in effiziente digitale Lösungen um. Die Entwicklung erfolgt vollständig in-house.",
      leistungenLabel: "Leistungen:",
      items: ["Webbasierte Anwendungen", "Mobile Apps (Android & iOS)", "KI-Integrationen und Automatisierungen", "3D-Modelle, BIM-Anwendungen und Datenbanken"],
    },
    warum: {
      label: "Warum clone:it",
      title: "Baumanagement und digitale Baustelle aus einer Hand",
      desc: "Wir kombinieren klassische Bauleistungen mit digitaler Baustellendokumentation und Softwarelösungen.",
      leistungenLabel: "Unsere Leistungen",
      leistungenItems: ["Planung", "Ausschreibung", "Örtliche Bauaufsicht", "Digitale Baustellendokumentation", "Softwarelösungen für Bauprojekte"],
      vorteilLabel: "Vorteil für Bauherren",
      vorteilItems: ["Ein Ansprechpartner", "Klare Kommunikation", "Digitale Dokumentation", "Transparente Projektabwicklung", "Terminsicherheit", "Kostenkontrolle"],
    },
    referenzen: {
      label: "Referenzen",
      title: "Referenzprojekte",
      project1: {
        name: "Heizkraftwerk Süd – München",
        type: "Großprojekt Industriebau",
        link: "/blog/heizkraftwerk_sued_baudienstleistung",
        items: ["Örtliche Bauaufsicht Hochbau", "Koordination Gewerke", "Termin- und Qualitätskontrolle"],
      },
      project2: {
        name: "Schaukäserei Melk",
        type: "Hochbau / Gewerbebau",
        link: "/blog/schaukaserei_melk",
        items: ["Örtliche Bauaufsicht", "Ausschreibung", "Projektbegleitung"],
      },
    },
    teamReferenzen: {
      label: "Teamerfahrung",
      title: "Persönliche Projekte",
      note: "Ausgewählte Projekte unserer Teammitglieder aus früheren Tätigkeiten",
      members: [
        {
          name: "DI Liebhard Mattuschka",
          projects: [
            {
              name: "Heizkraftwerk Süd München",
              desc: "Ausschreibung, Vergabe, Ausführungsplanung, Bauüberwachung und Kostenrechnung für zahlreiche Um- und Neubaumaßnahmen am HKW-Süd (Leistungsphasen 6 bis 9).",
            },
            {
              name: "TRAM – Westtangente München",
              desc: "Bauüberwachung von Termin- und Planungsleistungen der Verkehrsplanung.",
            },
            {
              name: "Tübbing Produktion – Brenner Basistunnel",
              desc: "Qualitätskontrolle vor Ort bei der Firma Max Bögl in Sengenthal für die Produktion von insgesamt etwa 45.000 Tübbing-Segmenten. Gesamtabstimmung, sodass die terminliche Produktionsleistung sowie die Qualität für den späteren Einbau vor Ort am Brenner übereinstimmen.",
            },
            {
              name: "Neubau Mobility Innovation Campus",
              desc: "Testfeld für autonomes Fahren inklusive Parkgarage. Projektleitung Bauüberwachung im Namen des Generalplaners (Leistungsphasen 6 bis 9).",
            },
            {
              name: "Generalsanierung A9 Pyhrnautobahn – 10 km",
              desc: "Bauüberwachung von 9 Stahlbetonbrücken, Straßenbau & Lärmschutzwand.",
            },
            {
              name: "Jesuitenrefektorium Graz & Feuerwache Graz-Ost",
              desc: "Projektmanagement: Abhaltung von Projektsteuersitzungen, Terminplanung, Kostenplanung und Kostenkontrolle.",
            },
          ],
        },
        {
          name: "DI Paul Wegerer",
          projects: [
            {
              name: "Heizkraftwerk Süd München",
              desc: "Bauüberwachung, Koordination Gewerke, Termin- und Qualitätskontrolle bei einem Großprojekt im Industriebau.",
            },
            {
              name: "Münchner Stammstrecke",
              desc: "Bauüberwachung und Projektsteuerung bei einem der komplexesten Infrastrukturprojekte Deutschlands.",
            },
            {
              name: "Schaukäserei Melk",
              desc: "Örtliche Bauaufsicht, Ausschreibung und Projektbegleitung im Gewerbebau.",
            },
            {
              name: "ÖBB – 4-gleisiger Ausbau Linz–Wels",
              desc: "Erster Testeinsatz von Simple Site auf einem ÖBB-Infrastrukturprojekt. Die hohen Dokumentationsanforderungen gaben den entscheidenden Anstoß für die Weiterentwicklung der App.",
              link: "/blog/simple_site_oebb_linz_wels",
            },
          ],
        },
        {
          name: "Oleg Moshkovich M.Eng",
          projects: [
            {
              name: "East Side Access – MTA New York",
              desc: "Leitung der BIM-Strategie und Modellierung für das größte MTA-Infrastrukturprogramm der letzten 50 Jahre — ein 18-Milliarden-Dollar Untergrundprojekt. Mastermodell mit 50 Komponenten, 6,4 km Tunnel und einer dreigeschossigen Station 45 Meter unter der Innenstadt Manhattans.",
            },
            {
              name: "Hochhaus-Wohnkomplex New York City",
              desc: "Entwicklung von BIM-Modellen sowie Koordinations- und Problemlösungsprozessen über alle Design- und Bauphasen eines großmaßstäblichen Hochhausprojekts.",
            },
            {
              name: "Fachbuch Virtual Design and Construction",
              desc: "Mitautor eines Fachbuchs über Teamstruktur, Softwareauswahl und Produktions-Workflows für effektive Virtual Design and Construction (VDC) Prozesse.",
              link: "https://www.amazon.de/-/en/Implementing-Virtual-Design-Construction-Using/dp/1032923725/",
            },
          ],
        },
      ],
    },
    software: {
      label: "Software",
      title: "Unsere Software für die Baustelle",
      simpleSiteDesc: "Digitale Baustellendokumentation",
      simpleSiteItems: ["Fotos mit Planverortung", "Bautagebuch", "Mängelmanagement", "Berichte automatisch erstellen", "Echtzeit Synchronisation", "Web & App"],
      arLabel: "AR BIM Inspection",
      arDesc: "Pilotprojekte — Seeking funding",
      arItems: ["BIM Modelle auf der Baustelle anzeigen", "Kontrolle von Bauteilen", "Pilotprojekte"],
      itLabel: "Softwareentwicklung",
      itDesc: "Wir entwickeln maßgeschneiderte Softwarelösungen für die Bau- und Infrastrukturbranche. Durch unsere Erfahrung in der Baupraxis verstehen wir Anforderungen schnell und setzen diese in effiziente digitale Lösungen um. Die Entwicklung erfolgt vollständig in-house.",
      itItems: ["Webbasierte Anwendungen", "Mobile Apps (Android & iOS)", "KI-Integrationen und Automatisierungen", "3D-Modelle, BIM-Anwendungen und Datenbanken"],
    },
    team: {
      label: "Team",
      title: "Unser Team",
      members: [
        {
          name: "DI Paul Wegerer",
          role: "Baumeister | Projektleitung | Digitalisierung",
          bio: "Paul Wegerer studierte Baumanagement und Ingenieurbau an der FH Joanneum. Nach mehrjähriger Erfahrung in Planung, Bauüberwachung und Claim Management absolvierte er die Baumeisterprüfung.",
          image: "/images/Paul.webp",
        },
        {
          name: "DI Liebhard Mattuschka",
          role: "Bauleitung – Projektleitung – Projektsteuerung",
          bio: "Liebhard studierte in Graz Bauingenieurwesen im Bachelor und absolvierte anschließend einen Master in Baumanagement und Ingenieurbau, den er in Kooperation zwischen Graz und einer Universität in den USA mit einem Auslandssemester erfolgreich abschloss. Er verfügt über umfangreiche Erfahrung aus zahlreichen Projekten in Österreich und Deutschland.",
          image: "/images/Liebhard.webp",
        },
        {
          name: "Dr. Timur Uzunoglu",
          role: "Ziviltechniker | Experte Bauwesen",
          bio: "Lehrender an der FH Joanneum, Dr. techn. im Bauingenieurwesen und gerichtlich beeideter Ziviltechniker. Unterstützt clone:it als Experte und Berater für komplexe Fachthemen.",
          image: "/images/Timur.webp",
        },
        {
          name: "M.Eng. Oleg Moshkovich",
          role: "Product Engineer | Softwareentwicklung",
          bio: "Spezialist für digitale Lösungen im Bauwesen. Erfahrung in internationalen Großprojekten wie dem Burj Khalifa und Infrastrukturprojekten in New York. Fokus auf Entwicklung smarter Tools für die Baustelle.",
          image: "/images/Oleg.webp",
        },
      ],
    },
    presse: {
      label: "Presse & Auszeichnungen",
      title: "Auszeichnungen",
      items: [
        { label: "Paul Wegerer: Forbes Top 30 under 30", link: "/blog/forbes_30_under_30_paul_wegerer" },
        { label: "Finalist: Austrian Startup Award", link: "/blog/austrian_startuo_worldcup" },
        { label: "Gewinner: BIM Löwe & Digital Bau Award", link: "/blog/cloneit_bim_loewen_2023" },
        { label: "Auswahl durch DB Mindbox (Deutsche Bahn) für Pilotprojekte", link: "/blog/cloneit_poc_dbmindbox" },
      ],
    },
    kontakt: {
      label: "Kontakt",
      title: "Sie planen ein Bauprojekt?",
      desc: "Wir unterstützen Sie gerne bei Planung, Ausschreibung, Örtlicher Bauaufsicht und Digitalisierung.",
      cta: "Kontakt aufnehmen",
    },
  },
};

function LangSwitcher({ language, setLanguage }: { language: "de" | "en"; setLanguage: (l: "de" | "en") => void }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage("de")}
        className={`${language === "de" ? "text-white" : "text-gray-600 hover:text-gray-400"} transition-colors`}
      >
        DE
      </button>
      <span className="text-gray-800">|</span>
      <button
        onClick={() => setLanguage("en")}
        className={`${language === "en" ? "text-white" : "text-gray-600 hover:text-gray-400"} transition-colors`}
      >
        EN
      </button>
    </div>
  );
}

export default function ServicesPage() {
  const { language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const c = pageContent[language];

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-black">
      {/* Sticky navbar */}
      <nav className="fixed top-0 z-50 w-full bg-black">
        <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-3 sm:px-8 h-16">
          <Link href="/" className="text-md font-bold text-white bg-black px-3 py-1 border border-gray-800">
            clone:it
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/software" className="text-sm text-gray-400 hover:text-white transition-colors">
              {c.nav.software}
            </Link>
            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
              {c.nav.blog}
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              {c.nav.signIn}
            </Link>
            <LangSwitcher language={language} setLanguage={setLanguage} />
          </div>

          {/* Hamburger */}
          <button
            className="sm:hidden flex items-center justify-center w-8 h-8"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <line x1="0" y1="1" x2="16" y2="1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="6" x2="16" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="11" x2="16" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Full-screen mobile menu overlay */}
        {menuOpen && (
          <div className="sm:hidden fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header row */}
            <div className="flex justify-between items-center px-3 h-16">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-md font-bold text-white bg-black px-3 py-1 border border-gray-800">
                clone:it
              </Link>
              <button
                className="flex items-center justify-center w-8 h-8"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="1" y1="1" x2="15" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="15" y1="1" x2="1" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {/* Links */}
            <div className="flex flex-col gap-6 px-3 pt-8">
              <Link href="/software" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                {c.nav.software}
              </Link>
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                {c.nav.blog}
              </Link>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                {c.nav.signIn}
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                {c.nav.signUp}
              </Link>
              <LangSwitcher language={language} setLanguage={setLanguage} />
            </div>
          </div>
        )}
      </nav>

      {/* 00 — Hero */}
      <section className="min-h-screen flex items-center w-full">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 py-24">
          <p className={labelClass}>
            <span className="block">{c.hero.label}</span>
          </p>
          <h1 className={titleClass}>{c.hero.title}</h1>
          <p className="text-sm sm:text-2xl text-gray-400 leading-relaxed mb-5">
            {c.hero.subtitle}
          </p>
          <p className="text-sm sm:text-lg text-gray-500 max-w-2xl leading-relaxed mb-10 sm:pr-30">
            {c.hero.descBefore}
            <br className="sm:hidden" />
            {c.hero.descBefore2}<Link href="/software" className="text-gray-500 underline underline-offset-2 hover:text-white transition-colors">Simple Site</Link>
            {c.hero.descAfter}
          </p>
          {/* Mobile layout: 2 / 3 / 3 / 2 */}
          <div className="flex flex-col gap-3 sm:hidden">
            {[c.hero.anchors.slice(0, 2), c.hero.anchors.slice(2, 5), c.hero.anchors.slice(5, 8), c.hero.anchors.slice(8)].map((group, i) => (
              <div key={i} className="flex gap-3">
                {group.map(({ label, href }) => (
                  <a key={label} href={href} className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 hover:border-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          {/* Desktop layout: 5 / 5 */}
          <div className="hidden sm:flex flex-col gap-3">
            {[c.hero.anchors.slice(0, 5), c.hero.anchors.slice(5)].map((group, i) => (
              <div key={i} className="flex gap-3">
                {group.map(({ label, href }) => (
                  <a key={label} href={href} className="text-sm text-gray-400 border border-gray-700 px-4 py-2 hover:border-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog scroll */}
      <section className="w-full">
        <div className="w-[90%] sm:w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 pt-16 pb-8">
          <div className="flex items-center justify-between mb-8">
            <p className={labelClass}>{c.blog.heading}</p>
            <Link href="/blog" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              {c.blog.allPosts}
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
                      {new Date(post.published).toLocaleDateString(language === "en" ? "en-US" : "de-AT", { year: "numeric", month: "short", day: "numeric" })}
                    </time>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* 01 — Örtliche Bauaufsicht */}
      <section id="leistungen" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>01</p>
          <h2 className={titleClass}>{c.bauaufsicht.title}</h2>
          <p className={descClass}>{c.bauaufsicht.desc}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            {c.bauaufsicht.items.map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 02 — Planung */}
      <section id="planung" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>02</p>
          <h2 className={titleClass}>{c.planung.title}</h2>
          <p className="text-sm sm:text-2xl text-gray-400 max-w-3xl leading-relaxed mb-10">
            {c.planung.descBefore}
            <a
              href="https://www.convex.at/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 underline underline-offset-4 hover:text-white transition-colors"
            >
              convex ZT GmbH
            </a>
            {c.planung.descAfter}
            {" "}<span className="text-gray-400">{c.planung.descHighlight}</span>
          </p>
          <div className="flex flex-col gap-8">
            <ul className="space-y-3">
              {c.planung.items.map((item) => (
                <li key={item} className={listItemClass}><Dot />{item}</li>
              ))}
            </ul>
            <div>
              <p className={subLabelClass}>{c.planung.sublabel}</p>
              <a
                href="https://www.convex.at/projekt/projektliste/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
              >
                {c.planung.linkText}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Ausschreibung */}
      <section id="ausschreibung" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>03</p>
          <h2 className={titleClass}>{c.ausschreibung.title}</h2>
          <p className={descClass}>{c.ausschreibung.desc}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            {c.ausschreibung.items.map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 — Softwareentwicklung */}
      <section id="digital" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>04</p>
          <h2 className={titleClass}>{c.digital.title}</h2>
          <p className="text-sm sm:text-2xl text-gray-400 max-w-2xl leading-relaxed mb-10">{c.digital.desc}</p>
          <p className="text-sm sm:text-2xl text-gray-400 max-w-2xl leading-relaxed mb-10">{c.digital.leistungenLabel}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            {c.digital.items.map((item) => (
              <li key={item} className={listItemClass}><Dot />{item}</li>
            ))}
          </ul>

          {/* Software product links */}
          <div className="flex gap-6 mt-12">
            <Link href="/software" className="text-sm text-gray-400 border border-gray-700 px-4 py-2 hover:border-gray-400 hover:text-white transition-colors">
              Simple Site →
            </Link>
            <Link href="/ar" className="text-sm text-gray-400 border border-gray-700 px-4 py-2 hover:border-gray-400 hover:text-white transition-colors">
              AR BIM Inspection →
            </Link>
          </div>

          {/* Blog scroll – SimpleSite posts */}
          {(() => {
            const softwarePosts = allPosts
              .filter((p) => p.tags?.includes("SimpleSite"))
              .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
            return softwarePosts.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 mt-10" style={{ scrollbarWidth: "none" }}>
                {softwarePosts.map((post) => (
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
                        {new Date(post.published).toLocaleDateString(language === "en" ? "en-US" : "de-AT", { year: "numeric", month: "short", day: "numeric" })}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* Referenzen */}
      <section id="referenzen" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.referenzen.label}</p>
          <h2 className={titleClass}>{c.referenzen.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div>
              <p className="text-base font-semibold text-white mb-2">
                {"link" in c.referenzen.project1 && c.referenzen.project1.link ? (
                  <Link href={c.referenzen.project1.link} className="underline underline-offset-2 hover:text-gray-300 transition-colors">
                    {c.referenzen.project1.name}
                  </Link>
                ) : (
                  c.referenzen.project1.name
                )}
              </p>
              <p className="text-xs text-gray-600 mb-4">{c.referenzen.project1.type}</p>
              <ul className="space-y-3">
                {c.referenzen.project1.items.map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-2">
                {"link" in c.referenzen.project2 && c.referenzen.project2.link ? (
                  <Link href={c.referenzen.project2.link} className="underline underline-offset-2 hover:text-gray-300 transition-colors">
                    {c.referenzen.project2.name}
                  </Link>
                ) : (
                  c.referenzen.project2.name
                )}
              </p>
              <p className="text-xs text-gray-600 mb-4">{c.referenzen.project2.type}</p>
              <ul className="space-y-3">
                {c.referenzen.project2.items.map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Personal Projects (with descriptions) */}
      {/* <section className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.teamReferenzen.label}</p>
          <h2 className={titleClass}>{c.teamReferenzen.title}</h2>
          <p className="text-xs text-gray-600 mb-10">{c.teamReferenzen.note}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
            {c.teamReferenzen.members.map((member) => (
              <div key={member.name}>
                <p className="text-base font-semibold text-white mb-6">{member.name}</p>
                <div className="space-y-6">
                  {member.projects.map((project) => (
                    <div key={project.name}>
                      <p className="text-sm text-white mb-1 flex items-start gap-2"><Dot />
                        {"link" in project && project.link ? (
                          <a href={project.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-300 transition-colors">{project.name}</a>
                        ) : (
                          <span>{project.name}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 leading-relaxed pl-3">{project.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Team Personal Projects (names only) */}
      <section id="teamerfahrung" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.teamReferenzen.label}</p>
          <h2 className={titleClass}>{c.teamReferenzen.title}</h2>
          <p className="text-xs text-gray-600 mb-10">{c.teamReferenzen.note}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
            {c.teamReferenzen.members.map((member) => (
              <div key={member.name}>
                <p className="text-base font-semibold text-white mb-6">{member.name}</p>
                <div className="space-y-3">
                  {member.projects.map((project) => (
                    <p key={project.name} className="text-sm text-gray-400 flex items-start gap-2">
                      <Dot />
                      {"link" in project && project.link ? (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-200 transition-colors">{project.name}</a>
                      ) : (
                        <span>{project.name}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Blog scroll – Bauprojekt posts */}
          {(() => {
            const bauprojektPosts = allPosts
              .filter((p) => p.tags?.includes("Bauprojekt") || p.tags?.includes("Baustelle"))
              .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
            return bauprojektPosts.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 mt-14" style={{ scrollbarWidth: "none" }}>
                {bauprojektPosts.map((post) => (
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
                        {new Date(post.published).toLocaleDateString(language === "en" ? "en-US" : "de-AT", { year: "numeric", month: "short", day: "numeric" })}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* Software */}
      <section id="software" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.software.label}</p>
          <h2 className={titleClass}>{c.software.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <Link href="/software" className="text-base font-semibold text-white mb-2 underline underline-offset-4 hover:text-gray-300 transition-colors inline-block">Simple Site</Link>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{c.software.simpleSiteDesc}</p>
              <ul className="space-y-3">
                {c.software.simpleSiteItems.map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <Link href="/ar" className="text-base font-semibold text-white mb-2 underline underline-offset-2 hover:text-gray-300 transition-colors">{c.software.arLabel}</Link>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{c.software.arDesc}</p>
              <ul className="space-y-3">
                {c.software.arItems.map((item) => (
                  <li key={item} className={listItemClass}><Dot />{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Blog scroll – SimpleSite posts */}
          {(() => {
            const simpleSitePosts = allPosts
              .filter((p) => p.tags?.includes("SimpleSite"))
              .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
            return simpleSitePosts.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 mt-14" style={{ scrollbarWidth: "none" }}>
                {simpleSitePosts.map((post) => (
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
                        {new Date(post.published).toLocaleDateString(language === "en" ? "en-US" : "de-AT", { year: "numeric", month: "short", day: "numeric" })}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* Team */}
      <section id="team" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.team.label}</p>
          <h2 className={titleClass}>{c.team.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {c.team.members.map((person) => (
              <div key={person.name}>
                <div className="w-16 h-16 rounded-full overflow-hidden mb-4 bg-gray-800">
                  <Image
                    src={person.image}
                    alt={person.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <p className="text-base font-semibold text-white mb-1">{person.name}</p>
                <p className="text-xs text-gray-600 mb-3">{person.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Presse & Auszeichnungen */}
      <section id="presse" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.presse.label}</p>
          <h2 className={titleClass}>{c.presse.title}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            {c.presse.items.map((item) => (
              <li key={item.label} className={listItemClass}>
                <Dot />
                <Link href={item.link} className="hover:text-white transition-colors underline underline-offset-2">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section id="kontakt" className={sectionClass}>
        <div className={innerClass}>
          <p className={labelClass}>{c.kontakt.label}</p>
          <h2 className={titleClass}>{c.kontakt.title}</h2>
          <p className={descClass}>{c.kontakt.desc}</p>
          <div className="mb-6">
            <Image src="/images/Baumeister-Logo-weiss.png" alt="Baumeister" width={50} height={50} className="w-[40px] h-[40px] sm:w-[60px] sm:h-[60px]" />
          </div>
          <a
            href="mailto:paul.wegerer@cloneit.at"
            className="inline-block text-sm text-black bg-white px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            {c.kontakt.cta}
          </a>
        </div>
      </section>

      <div className="w-[90%] sm:w-full max-w-6xl mx-auto border-t border-gray-800 [&>footer]:mt-0 [&>footer]:mb-0 [&>footer]:pt-6 [&>footer]:pb-6">
        <Footer textColor="text-gray-300" />
      </div>
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-black border border-gray-800 flex items-center justify-center hover:border-gray-600 transition-colors"
          aria-label="Scroll to top"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 11V3M7 3L3 7M7 3L11 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </main>
  );
}
