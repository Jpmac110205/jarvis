import React, { useEffect } from 'react';

export default function PrivacyPolicy(): React.JSX.Element {
  
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).classList.add('opacity-100', 'translate-y-0');
              (entry.target as HTMLElement).classList.remove('opacity-0', 'translate-y-4');
            }, i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#050507] text-[#f0f0f5] font-sans font-light min-h-screen relative overflow-x-hidden antialiased selection:bg-blue-500/30
      before:content-[''] before:fixed before:inset-0 before:pointer-events-none before:z-0
      before:bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)]
      before:bg-[size:60px_60px]"
    >
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-12 py-5 flex items-center justify-between bg-[#050507]/85 backdrop-blur-md border-b border-[rgba(59,130,246,0.15)]">
        <a href="/" className="font-['Syne'] font-extrabold text-xl tracking-wider">
          PRODIGY<span className="text-[#3b82f6]">.</span>
        </a>
        <a href="/" className="text-[#7a7a8c] text-sm tracking-wide flex items-center gap-1.5 transition-colors duration-200 hover:text-[#f0f0f5]">
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to home
        </a>
      </nav>

      {/* MAIN WRAPPER */}
      <div className="relative z-10 max-w-[760px] mx-auto px-6 pt-[140px] pb-24">
        
        {/* HEADER */}
        <header className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-16 pb-10 border-b border-white/5">
          <p className="text-[11px] tracking-widest uppercase text-[#3b82f6] mb-4">Legal</p>
          <h1 className="font-['Syne'] font-extrabold text-3xl md:text-5xl tracking-tight mb-5 leading-[1.05]">
            Privacy <span className="text-[#3b82f6]">Policy</span>
          </h1>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            <span className="text-[13px] text-[#7a7a8c] flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-[#3b82f6] before:rounded-full">Effective: May 27, 2025</span>
            <span className="text-[13px] text-[#7a7a8c] flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-[#3b82f6] before:rounded-full">Last updated: May 27, 2025</span>
            <span className="text-[13px] text-[#7a7a8c] flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-[#3b82f6] before:rounded-full">Applies to: Prodigy Personal AI Assistant</span>
          </div>
        </header>

        {/* TABLE OF CONTENTS */}
        <div className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out bg-[#0c0c10] border border-[rgba(59,130,246,0.15)] rounded-xl p-7 md:p-8 mb-14">
          <p className="font-['Syne'] font-semibold text-[13px] tracking-wider uppercase text-[#7a7a8c] mb-4">Contents</p>
          <ol className="list-none grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {tocData.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-[#7a7a8c] text-[14px] flex items-center gap-2 transition-colors duration-200 hover:text-[#3b82f6]">
                  <span className="font-['Syne'] text-[11px] font-bold text-[#3b82f6] opacity-60 min-w-[16px]">{item.num}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* 1. OVERVIEW */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="overview">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">01</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Overview</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed mb-4">Prodigy (also referred to as "JARVIS") is a personal AI assistant built and operated by an individual developer as a private project. This Privacy Policy describes how Prodigy collects, uses, and stores your information when you use the application.</p>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed">By signing in and using Prodigy, you agree to the practices described in this policy.</p>
        </section>

        {/* 2. INFORMATION WE COLLECT */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="data-collected">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">02</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Information we collect</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed mb-4">Prodigy collects only what is necessary to provide its functionality. Below is a breakdown of each data type.</p>

          <div className="space-y-6 mt-6">
            <div className="p-5 md:p-6 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded-xl">
              <h3 className="font-['Syne'] font-semibold text-sm text-white mb-2.5">Google account information</h3>
              <p className="text-sm text-[#7a7a8c] leading-relaxed">When you sign in with Google, Prodigy collects your name, email address, and profile picture as provided by Google OAuth. This is stored in a local SQL database and used to personalize your experience and associate your data with your account.</p>
            </div>
            <div className="p-5 md:p-6 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded-xl">
              <h3 className="font-['Syne'] font-semibold text-sm text-white mb-2.5">Documents and files</h3>
              <p className="text-sm text-[#7a7a8c] leading-relaxed">You may upload PDFs and notes. These are parsed, chunked, and stored as vector embeddings in a ChromaDB vector database. File content may be retained to support accurate retrieval and question-answering.</p>
            </div>
            <div className="p-5 md:p-6 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded-xl">
              <h3 className="font-['Syne'] font-semibold text-sm text-white mb-2.5">Conversation data</h3>
              <p className="text-sm text-[#7a7a8c] leading-relaxed">Prodigy stores your conversation history to support persistent memory across sessions. This includes messages you send and AI-generated responses. Conversation summaries may also be stored in the vector database to support long-term memory retrieval.</p>
            </div>
            <div className="p-5 md:p-6 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded-xl">
              <h3 className="font-['Syne'] font-semibold text-sm text-white mb-2.5">Google Calendar data</h3>
              <p className="text-sm text-[#7a7a8c] leading-relaxed">With your explicit authorization via Google OAuth, Prodigy may read your upcoming calendar events to provide schedule-aware responses. This data is used only to answer your queries and is not stored permanently beyond the active session context.</p>
            </div>
            <div className="p-5 md:p-6 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded-xl">
              <h3 className="font-['Syne'] font-semibold text-sm text-white mb-2.5">Profile and preferences</h3>
              <p className="text-sm text-[#7a7a8c] leading-relaxed">Information you enter on your profile page — such as your title, location, or a custom system prompt — is stored in the SQL database and used to personalize the AI's behavior for your account.</p>
            </div>
          </div>
        </section>

        {/* 3. HOW WE USE YOUR INFORMATION */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="how-used">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">03</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">How we use your information</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed mb-4">Your data is used solely to provide and improve Prodigy's core functionality:</p>
          <div className="flex flex-col gap-2.5 mt-4">
            {useCasesData.map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-[#c8c8d4]">
                <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* 4. THIRD-PARTY SERVICES */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="third-party">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">04</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Third-party services</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed mb-4">Prodigy integrates with the following third-party services to operate. Each is governed by its own privacy policy.</p>
          
          <div className="flex flex-col gap-3 mt-5">
            {thirdPartyData.map((tp, idx) => (
              <div key={idx} className="flex gap-3.5 p-4 md:p-5 bg-[#0c0c10] border border-white/5 rounded-xl items-start transition-colors duration-200 hover:border-[rgba(59,130,246,0.15)]">
                <span className="font-['Syne'] font-bold text-[10px] tracking-wider uppercase text-[#3b82f6] bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded px-2 py-0.5 whitespace-nowrap mt-0.5">{tp.badge}</span>
                <div>
                  <strong className="color-white font-normal block mb-1 text-[15px]">{tp.title}</strong>
                  <p className="text-sm text-[#7a7a8c] leading-relaxed">{tp.desc}</p>
                  {tp.link && (
                    <a href={tp.link} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] text-[13px] block mt-1.5 hover:underline">
                      {tp.linkLabel} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. DATA STORAGE & SECURITY */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="storage">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">05</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Data storage &amp; security</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed">Your data is stored locally or on a private server controlled by the developer. Vector embeddings are stored in ChromaDB. User account and conversation data are stored in a SQL database.</p>
          <div className="mt-5 p-4.5 border-l-2 border-[#3b82f6] bg-[rgba(59,130,246,0.07)] rounded-r-lg">
            <p className="text-sm text-[#7a7a8c] italic">Prodigy is a personal project and is not designed or certified for storing sensitive, confidential, or regulated information. You use this application at your own discretion.</p>
          </div>
        </section>

        {/* 6. DATA SHARING */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="sharing">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">06</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Data sharing</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed">Your data is not sold, rented, or shared with any third parties for advertising or commercial purposes. Data is only transmitted to the services listed in Section 4 as strictly necessary to operate the application.</p>
        </section>

        {/* 7. DATA RETENTION */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="retention">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">07</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Data retention</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed">Your data is retained for as long as you maintain an account on Prodigy. Upon request, all stored data associated with your account — including documents, conversation history, and profile information — will be permanently removed. Contact the developer to request deletion (see Section 10).</p>
        </section>

        {/* 8. YOUR RIGHTS */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="rights">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">08</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Your rights</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed mb-4">You have the right to:</p>
          <div className="flex flex-col gap-2.5 mt-4">
            {rightsData.map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-[#c8c8d4]">
                <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
          <div className="mt-5 p-4.5 border-l-2 border-[#3b82f6] bg-[rgba(59,130,246,0.07)] rounded-r-lg">
            <p className="text-sm text-[#7a7a8c] italic">
              To revoke Google permissions independently of this app, visit{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">
                myaccount.google.com/permissions
              </a>
            </p>
          </div>
        </section>

        {/* 9. CHILDREN'S PRIVACY */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="children">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">09</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Children's privacy</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed">Prodigy is not intended for use by individuals under the age of 13. No data is knowingly collected from children. If you believe a minor has used this application and provided personal data, please contact the developer for immediate removal.</p>
        </section>

        {/* 10. CONTACT */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out mb-12 pb-12 border-b border-white/5" id="contact">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">10</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Contact</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed">Prodigy is a personal project. If you have questions about this Privacy Policy, wish to exercise your data rights, or need to request account deletion, please contact the developer directly via the contact method provided upon your access to the application.</p>
        </section>

        {/* 11. CHANGES TO THIS POLICY */}
        <section className="reveal opacity-0 translate-y-4 transition-all duration-500 ease-out" id="changes">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-['Syne'] font-bold text-xs text-[#3b82f6] opacity-70 min-w-[20px]">11</span>
            <h2 className="font-['Syne'] font-bold text-lg text-[#f0f0f5]">Changes to this policy</h2>
          </div>
          <p className="text-[#c8c8d4] text-[15.2px] leading-relaxed mb-4">This Privacy Policy may be updated from time to time. The "Last Updated" date at the top of this page reflects the most recent revision. Continued use of Prodigy after changes are posted constitutes acceptance of the updated policy.</p>
          <div className="mt-5 p-4.5 border-l-2 border-[#3b82f6] bg-[rgba(59,130,246,0.07)] rounded-r-lg">
            <p className="text-sm text-[#7a7a8c] italic">Prodigy is an independent personal project and is not affiliated with or endorsed by OpenAI, Google, or any other third-party service mentioned herein.</p>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[rgba(59,130,246,0.15)] py-9 px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="font-['Syne'] font-extrabold text-base tracking-wider">
          PRODIGY<span className="text-[#3b82f6]">.</span>
        </div>
        <p className="text-[#7a7a8c] text-xs">Personal AI Assistant — built for one person, by one person.</p>
        <a href="/" className="text-[#7a7a8c] text-xs transition-colors duration-200 hover:text-[#3b82f6]">← Back to home</a>
      </footer>
    </div>
  );
}

/* Static Mapped Mock Data Structure */
const tocData = [
  { id: 'overview', num: '01', label: 'Overview' },
  { id: 'data-collected', num: '02', label: 'Information we collect' },
  { id: 'how-used', num: '03', label: 'How we use your information' },
  { id: 'third-party', num: '04', label: 'Third-party services' },
  { id: 'storage', num: '05', label: 'Data storage & security' },
  { id: 'sharing', num: '06', label: 'Data sharing' },
  { id: 'retention', num: '07', label: 'Data retention' },
  { id: 'rights', num: '08', label: 'Your rights' },
  { id: 'children', num: '09', label: 'Children\'s privacy' },
  { id: 'contact', num: '10', label: 'Contact' },
  { id: 'changes', num: '11', label: 'Changes to this policy' }
];

const useCasesData = [
  'Authenticate you and associate your data with your account',
  'Answer questions using your personal documents and notes via RAG',
  'Maintain conversational memory across sessions',
  'Provide schedule-aware responses using your calendar',
  'Personalize the AI\'s responses based on your profile settings',
  'Route queries to web search when real-time information is needed'
];

const rightsData = [
  'Access the data stored about you',
  'Request correction of inaccurate data',
  'Request permanent deletion of your account and all associated data',
  'Revoke Google OAuth permissions at any time via your Google Account settings'
];

const thirdPartyData = [
  {
    badge: 'OpenAI',
    title: 'OpenAI API',
    desc: 'Your messages and document content are sent to OpenAI\'s API to generate responses and create embeddings. This is subject to OpenAI\'s data usage policies.',
    link: 'https://openai.com/policies/privacy-policy',
    linkLabel: 'openai.com/policies/privacy-policy'
  },
  {
    badge: 'Google',
    title: 'Google OAuth & Calendar API',
    desc: 'Sign-in and calendar access are handled by Google\'s OAuth 2.0 service and governed by Google\'s Privacy Policy.',
    link: 'https://policies.google.com/privacy',
    linkLabel: 'policies.google.com/privacy'
  },
  {
    badge: 'Search',
    title: 'Web Search (Brave / Tavily)',
    desc: 'When a query requires real-time information, it may be forwarded to a third-party search API. No personally identifiable information is included in these requests.',
    link: null,
    linkLabel: null
  }
];