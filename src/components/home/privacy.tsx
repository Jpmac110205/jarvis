import type React from "react";

export default function PrivacyPolicy(): React.JSX.Element {
  return (
    <div className="privacy-policy">
      {/* NAV */}
      <nav className="relative px-5 md:px-12 py-5 flex items-center justify-between bg-[var(--bg)]/85 backdrop-blur-md border-b border-[var(--line)]">
        <a href="/" className="font-sans font-semibold text-xl tracking-wider">
          PRODIGY<span className="text-[var(--accent)]">.</span>
        </a>
        <a
          href="/"
          className="text-[var(--muted)] text-sm tracking-wide flex items-center gap-1.5 transition-colors duration-200 hover:text-[var(--text)]"
        >
          <svg
            className="w-3.5 h-3.5 stroke-current fill-none stroke-2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to home
        </a>
      </nav>

      {/* MAIN WRAPPER */}
      <div className="relative z-10 max-w-[760px] mx-auto px-6 pt-10 pb-24">
        {/* HEADER */}
        <header className="reveal transition-all duration-500 ease-out mb-16 pb-10 border-b border-[var(--line)]">
          <p className="text-[11px] tracking-widest uppercase text-[var(--accent)] mb-4">
            Legal
          </p>
          <h1 className="font-sans font-semibold text-3xl md:text-5xl tracking-tight mb-5 leading-[1.05]">
            Privacy <span className="text-[var(--accent)]">Policy</span>
          </h1>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            <span className="text-[13px] text-[var(--muted)] flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-[var(--accent)] before:rounded-full">
              Effective: May 27, 2025
            </span>
            <span className="text-[13px] text-[var(--muted)] flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-[var(--accent)] before:rounded-full">
              Last updated: October 6, 2026
            </span>
            <span className="text-[13px] text-[var(--muted)] flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-[var(--accent)] before:rounded-full">
              Applies to: Prodigy Personal AI Assistant
            </span>
          </div>
        </header>

        {/* TABLE OF CONTENTS */}
        <div className="reveal transition-all duration-500 ease-out bg-[var(--surface)] border border-[var(--line)] rounded-xl p-7 md:p-8 mb-14">
          <p className="font-sans font-semibold text-[13px] tracking-wider uppercase text-[var(--muted)] mb-4">
            Contents
          </p>
          <ol className="list-none grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {tocData.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-[var(--muted)] text-[14px] flex items-center gap-2 transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  <span className="font-sans text-[11px] font-bold text-[var(--accent)] opacity-60 min-w-[16px]">
                    {item.num}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* 1. OVERVIEW */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="overview"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              01
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Overview
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed mb-4">
            Prodigy (also referred to as "JARVIS") is a personal AI assistant
            built and operated by an individual developer as a private project.
            This Privacy Policy describes how Prodigy collects, uses, and stores
            your information when you use the application.
          </p>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed">
            By signing in and using Prodigy, you agree to the practices
            described in this policy.
          </p>
        </section>

        {/* 2. INFORMATION WE COLLECT */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="data-collected"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              02
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Information we collect
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed mb-4">
            Prodigy collects only what is necessary to provide its
            functionality. Below is a breakdown of each data type.
          </p>

          <div className="space-y-6 mt-6">
            <div className="p-5 md:p-6 bg-[var(--accent-soft)] border border-[var(--line)] rounded-xl">
              <h3 className="font-sans font-semibold text-sm text-[var(--text)] mb-2.5">
                Google account information
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                When you sign in with Google, Prodigy collects your name, email
                address, and profile picture as provided by Google OAuth. This
                is stored in the account database and used to personalize your
                experience and associate your data with your account.
              </p>
            </div>
            <div className="p-5 md:p-6 bg-[var(--accent-soft)] border border-[var(--line)] rounded-xl">
              <h3 className="font-sans font-semibold text-sm text-[var(--text)] mb-2.5">
                Documents and files
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Uploaded PDFs, text and Markdown are retained as complete
                extracted text in your account database and indexed in Chroma
                Cloud. Attached documents are sent in full to the AI provider
                with your question. Removing an attachment excludes its full
                text from the question but does not delete the saved document.
              </p>
            </div>
            <div className="p-5 md:p-6 bg-[var(--accent-soft)] border border-[var(--line)] rounded-xl">
              <h3 className="font-sans font-semibold text-sm text-[var(--text)] mb-2.5">
                Conversation data
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Prodigy stores your conversation history to support persistent
                memory across sessions. This includes messages you send and
                AI-generated responses. Conversation summaries may also be
                stored in the vector database to support long-term memory
                retrieval. A separate user.md memory records facts and
                preferences from your messages. You can review, edit, clear,
                download or pause updates to this Markdown in Settings.
              </p>
            </div>
            <div className="p-5 md:p-6 bg-[var(--accent-soft)] border border-[var(--line)] rounded-xl">
              <h3 className="font-sans font-semibold text-sm text-[var(--text)] mb-2.5">
                Google Calendar data
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                With your explicit authorization via Google OAuth, Prodigy may
                read your upcoming calendar events to provide schedule-aware
                responses. This data is read to answer your queries. Event
                details mentioned in saved replies or memory summaries may
                remain in your account transcript and memory.
              </p>
            </div>
            <div className="p-5 md:p-6 bg-[var(--accent-soft)] border border-[var(--line)] rounded-xl">
              <h3 className="font-sans font-semibold text-sm text-[var(--text)] mb-2.5">
                Profile and preferences
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Information you enter on your profile page — such as your title,
                location, or a custom system prompt — is stored in the SQL
                database and used to personalize the AI's behavior for your
                account.
              </p>
            </div>
          </div>
        </section>

        {/* 3. HOW WE USE YOUR INFORMATION */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="how-used"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              03
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              How we use your information
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed mb-4">
            Your data is used solely to provide and improve Prodigy's core
            functionality:
          </p>
          <div className="flex flex-col gap-2.5 mt-4">
            {useCasesData.map((text, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-sm text-[var(--text)]"
              >
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* 4. THIRD-PARTY SERVICES */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="third-party"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              04
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Third-party services
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed mb-4">
            Prodigy integrates with the following third-party services to
            operate. Each is governed by its own privacy policy.
          </p>

          <div className="flex flex-col gap-3 mt-5">
            {thirdPartyData.map((tp, idx) => (
              <div
                key={idx}
                className="flex gap-3.5 p-4 md:p-5 bg-[var(--surface)] border border-[var(--line)] rounded-xl items-start transition-colors duration-200 hover:border-[var(--line)]"
              >
                <span className="font-sans font-bold text-[10px] tracking-wider uppercase text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--line)] rounded px-2 py-0.5 whitespace-nowrap mt-0.5">
                  {tp.badge}
                </span>
                <div>
                  <strong className="color-white font-normal block mb-1 text-[15px]">
                    {tp.title}
                  </strong>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {tp.desc}
                  </p>
                  {tp.link && (
                    <a
                      href={tp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] text-[13px] block mt-1.5 hover:underline"
                    >
                      {tp.linkLabel} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="mb-12 pb-12 border-b border-[var(--line)]"
          id="limited-use"
        >
          <h2>Google API data</h2>
          <p className="text-[var(--text)] leading-relaxed">
            Google Calendar and Google Tasks data is transmitted to OpenAI’s API
            to answer your queries. OpenAI does not use API data for model
            training by default. Provider retention depends on the applicable
            API data controls. Event or task details included in assistant
            replies may also be retained in your Prodigy conversation history
            and memory. Prodigy does not sell Google user data or use it to
            train AI models.
          </p>
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)]"
          >
            Google API Services User Data Policy
          </a>
        </section>

        {/* 5. DATA STORAGE & SECURITY */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="storage"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              05
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Data storage &amp; security
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed">
            Production account information, conversations, full extracted
            document text, user.md and memory summaries are stored in
            PostgreSQL. Document chunks and memory embeddings are stored in
            Chroma Cloud. Device preferences and optional unsent drafts,
            including attachment IDs and filenames, are stored in your browser.
          </p>
          <div className="mt-5 p-4.5 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-lg">
            <p className="text-sm text-[var(--muted)] italic">
              Prodigy is a personal project and is not designed or certified for
              storing sensitive, confidential, or regulated information. You use
              this application at your own discretion.
            </p>
          </div>
        </section>

        {/* 6. DATA SHARING */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="sharing"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              06
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Data sharing
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed">
            Your data is not sold, rented, or shared with any third parties for
            advertising or commercial purposes. Data is only transmitted to the
            services listed in Section 4 as strictly necessary to operate the
            application.
          </p>
        </section>

        {/* 7. DATA RETENTION */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="retention"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              07
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Data retention
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed">
            Your data is retained for as long as you maintain an account on
            Prodigy. Upon request, all stored data associated with your account
            — including documents, conversation history, and profile information
            — will be permanently removed. Contact the developer to request
            deletion (see Section 10).
          </p>
        </section>

        {/* 8. YOUR RIGHTS */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="rights"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              08
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Your rights
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed mb-4">
            You have the right to:
          </p>
          <div className="flex flex-col gap-2.5 mt-4">
            {rightsData.map((text, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-sm text-[var(--text)]"
              >
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
          <div className="mt-5 p-4.5 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-lg">
            <p className="text-sm text-[var(--muted)] italic">
              To revoke Google permissions independently of this app, visit{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                myaccount.google.com/permissions
              </a>
            </p>
          </div>
        </section>

        {/* 9. CHILDREN'S PRIVACY */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="children"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              09
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Children's privacy
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed">
            Prodigy is not intended for use by individuals under the age of 13.
            No data is knowingly collected from children. If you believe a minor
            has used this application and provided personal data, please contact
            the developer for immediate removal.
          </p>
        </section>

        {/* 10. CONTACT */}
        <section
          className="reveal transition-all duration-500 ease-out mb-12 pb-12 border-b border-[var(--line)]"
          id="contact"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              10
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Contact
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed">
            Prodigy is a personal project. If you have questions about this
            Privacy Policy, wish to exercise your data rights, or need to
            request account deletion, please contact the developer directly via
            the contact method provided upon your access to the application.
          </p>
        </section>

        {/* 11. CHANGES TO THIS POLICY */}
        <section
          className="reveal transition-all duration-500 ease-out"
          id="changes"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-sans font-bold text-xs text-[var(--accent)] opacity-70 min-w-[20px]">
              11
            </span>
            <h2 className="font-sans font-bold text-lg text-[var(--text)]">
              Changes to this policy
            </h2>
          </div>
          <p className="text-[var(--text)] text-[15.2px] leading-relaxed mb-4">
            This Privacy Policy may be updated from time to time. The "Last
            Updated" date at the top of this page reflects the most recent
            revision. Continued use of Prodigy after changes are posted
            constitutes acceptance of the updated policy.
          </p>
          <div className="mt-5 p-4.5 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-lg">
            <p className="text-sm text-[var(--muted)] italic">
              Prodigy is an independent personal project and is not affiliated
              with or endorsed by OpenAI, Google, or any other third-party
              service mentioned herein.
            </p>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[var(--line)] py-9 px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="font-sans font-semibold text-base tracking-wider">
          PRODIGY<span className="text-[var(--accent)]">.</span>
        </div>
        <p className="text-[var(--muted)] text-xs">
          Personal AI Assistant — built for one person, by one person.
        </p>
        <a
          href="/"
          className="text-[var(--muted)] text-xs transition-colors duration-200 hover:text-[var(--accent)]"
        >
          ← Back to home
        </a>
      </footer>
    </div>
  );
}

/* Privacy policy table of contents and explanatory text. */
const tocData = [
  { id: "overview", num: "01", label: "Overview" },
  { id: "data-collected", num: "02", label: "Information we collect" },
  { id: "how-used", num: "03", label: "How we use your information" },
  { id: "third-party", num: "04", label: "Third-party services" },
  { id: "storage", num: "05", label: "Data storage & security" },
  { id: "sharing", num: "06", label: "Data sharing" },
  { id: "retention", num: "07", label: "Data retention" },
  { id: "rights", num: "08", label: "Your rights" },
  { id: "children", num: "09", label: "Children's privacy" },
  { id: "contact", num: "10", label: "Contact" },
  { id: "changes", num: "11", label: "Changes to this policy" },
];

const useCasesData = [
  "Authenticate you and associate your data with your account",
  "Answer questions using your personal documents and notes via RAG",
  "Maintain conversational memory across sessions",
  "Provide schedule-aware responses using your calendar",
  "Personalize the AI's responses based on your profile settings",
  "Identify queries that need real-time information; live web search is currently unavailable",
];

const rightsData = [
  "Access the data stored about you",
  "Request correction of inaccurate data",
  "Request permanent deletion of your account and all associated data",
  "Revoke Google OAuth permissions at any time via your Google Account settings",
];

const thirdPartyData = [
  {
    badge: "OpenAI",
    title: "OpenAI API",
    desc: "Your messages and document content are sent to OpenAI's API to generate responses and create embeddings. This is subject to OpenAI's data usage policies.",
    link: "https://openai.com/policies/privacy-policy",
    linkLabel: "openai.com/policies/privacy-policy",
  },
  {
    badge: "Google",
    title: "Google OAuth & Calendar API",
    desc: "Sign-in and calendar access are handled by Google's OAuth 2.0 service and governed by Google's Privacy Policy.",
    link: "https://policies.google.com/privacy",
    linkLabel: "policies.google.com/privacy",
  },
  {
    badge: "Search",
    title: "Web Search (not connected)",
    desc: "Live web search is not connected. Queries are currently not sent to a search provider.",
    link: null,
    linkLabel: null,
  },
];
