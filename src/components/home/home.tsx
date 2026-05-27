import React, { useEffect } from 'react';

// Custom tailwind extend configurations or raw injects for your explicit animations:
// Note: To make the animations work precisely like your source file, ensure your 
// tailwind.config.js contains the 'pulse', 'scrollLine', and 'fadeUp' keyframes.

export default function ProdigyLanding(): React.JSX.Element {
  
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).classList.add('opacity-100', 'translate-y-0');
              (entry.target as HTMLElement).classList.remove('opacity-0', 'translate-y-6');
            }, i * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#050507] text-[#f0f0f5] font-sans font-light min-h-screen relative overflow-x-hidden antialiased selection:bg-blue-500/30
      before:content-[''] before:fixed before:inset-0 before:pointer-events-none before:z-0
      before:bg-[linear-gradient(rgba(59,130,246,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.035)_1px,transparent_1px)]
      before:bg-[size:60px_60px]"
    >
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-12 py-5 flex items-center justify-between bg-[#050507]/80 backdrop-blur-md border-b border-[rgba(59,130,246,0.15)]">
        <a href="/" className="font-['Syne'] font-extrabold text-da tracking-wider text-xl">
          PRODIGY<span className="text-[#3b82f6]">.</span>
        </a>
        <div className="flex gap-4 md:gap-8 items-center">
          <a href="#features" className="text-[#7a7a8c] text-sm tracking-wide transition-colors duration-200 hover:text-[#f0f0f5]">Features</a>
          <a href="#how-it-works" className="text-[#7a7a8c] text-sm tracking-wide transition-colors duration-200 hover:text-[#f0f0f5]">How it works</a>
          <a href="/privacy" className="text-[#7a7a8c] text-sm tracking-wide transition-colors duration-200 hover:text-[#f0f0f5]">Privacy</a>
          <a href="/app" className="bg-[#3b82f6] text-white px-5 py-2 rounded-md text-sm font-normal transition-all duration-200 hover:bg-[#2563eb] hover:-translate-y-[1px]">Launch App</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-[120px] pb-20 z-10">
        {/* Glow effect */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[600px] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12)_0%,transparent_70%)]" />

        <div className="inline-flex items-center gap-2 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] px-4 py-1.5 rounded-full text-[11px] tracking-widest uppercase text-[#3b82f6] mb-10 animate-[fadeUp_0.6s_ease_both]">
          <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-pulse" />
          Personal AI Assistant
        </div>

        <h1 className="font-['Syne'] font-extrabold text-5xl md:text-7xl lg:text-[6.5rem] leading-[1.0] tracking-tight mb-7 animate-[fadeUp_0.6s_0.1s_ease_both]">
          Meet <span className="text-[#3b82f6]">Prodigy</span>
          <span className="block text-[#7a7a8c] font-semibold text-3xl md:text-5xl lg:text-6xl mt-4">Your AI, your rules.</span>
        </h1>

        <p className="max-w-[560px] text-lg text-[#7a7a8c] leading-relaxed mb-12 animate-[fadeUp_0.6s_0.2s_ease_both]">
          A personal AI assistant that knows your documents, remembers your conversations, connects to your calendar, and gets smarter every time you use it.
        </p>

        <div className="flex gap-4 items-center flex-wrap justify-center animate-[fadeUp_0.6s_0.3s_ease_both]">
          <a href="/app" className="bg-[#3b82f6] text-white px-8 py-3.5 rounded-md text-[15px] font-normal transition-all duration-200 shadow-[0_0_28px_rgba(59,130,246,0.3)] hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(59,130,246,0.45)]">
            Get Started
          </a>
          <a href="#features" className="text-[#7a7a8c] px-6 py-3.5 rounded-md text-[15px] border border-white/10 transition-colors duration-200 hover:text-[#f0f0f5] hover:border-white/20">
            See what it can do →
          </a>
        </div>

        {/* Scroll Hint */}
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#7a7a8c] text-[10px] tracking-widest uppercase animate-[fadeUp_0.6s_0.6s_ease_both]">
          <span>Scroll</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-[#3b82f6] to-transparent origin-top animate-[scrollLine_2s_ease-in-out_infinite]" />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative z-10 py-24 px-6 max-w-[1100px] mx-auto" id="features">
        <p className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out text-[11px] tracking-widest uppercase text-[#3b82f6] mb-4">Capabilities</p>
        <h2 className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out font-['Syne'] font-bold text-3xl md:text-5xl leading-tight mb-16">
          Everything your AI<br />should actually do.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.15)] rounded-2xl overflow-hidden">
          {featuresData.map((feature, idx) => (
            <div key={idx} className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out bg-[#0c0c10] p-10 group relative transition-colors duration-300 hover:bg-[#0f0f15]
              before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(59,130,246,0.07),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
            >
              <div className="w-11 h-11 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] rounded-xl flex items-center justify-center mb-5 text-lg relative z-10">
                {feature.icon}
              </div>
              <h3 className="font-['Syne'] font-semibold text-base mb-2.5 tracking-wide relative z-10">{feature.title}</h3>
              <p className="text-sm text-[#7a7a8c] leading-relaxed relative z-10">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.15)] to-transparent mx-auto max-w-[1100px]" />

      {/* HOW IT WORKS SECTION */}
      <section className="relative z-10 py-24 px-6 max-w-[1100px] mx-auto" id="how-it-works">
        <p className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out text-[11px] tracking-widest uppercase text-[#3b82f6] mb-4">How it works</p>
        <h2 className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out font-['Syne'] font-bold text-3xl md:text-5xl leading-tight mb-16">
          Built different<br />from the ground up.
        </h2>

        <div className="flex flex-col relative md:before:content-[''] md:before:absolute md:before:left-[22px] md:before:top-11 md:before:bottom-11 md:before:w-[1px] md:before:bg-gradient-to-b md:before:from-[#3b82f6] md:before:to-transparent">
          {stepsData.map((step, idx) => (
            <div key={idx} className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out flex gap-8 items-start py-9 border-b border-white/5 last:border-b-0">
              <div className="flex-shrink-0 w-11 h-11 bg-[#050507] border border-[rgba(59,130,246,0.15)] rounded-full flex items-center justify-center font-['Syne'] font-bold text-xs text-[#3b82f6] relative z-10">
                {step.num}
              </div>
              <div className="pt-2">
                <h3 className="font-['Syne'] font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-[#7a7a8c] leading-relaxed max-w-[520px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <div className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out relative z-10 my-24 mx-6 max-w-[1100px] md:mx-auto border border-[rgba(59,130,246,0.15)] rounded-[20px] bg-[#0c0c10] py-18 px-12 text-center overflow-hidden
        before:content-[''] before:absolute before:top-[-80px] before:left-1/2 before:-translate-x-1/2 before:w-[600px] before:h-[300px] before:pointer-events-none before:bg-[radial-gradient(ellipse,rgba(59,130,246,0.1)_0%,transparent_70%)]"
      >
        <h2 className="font-['Syne'] font-bold text-3xl md:text-4xl lg:text-[2.8rem] leading-tight mb-4 relative z-10">Your AI. Your data.<br />Your assistant.</h2>
        <p className="text-[#7a7a8c] text-base mb-10 relative z-10">Unlike ChatGPT, Prodigy remembers everything you give it — permanently.</p>
        <a href="/app" className="bg-[#3b82f6] text-white px-8 py-3.5 rounded-md text-[15px] font-normal transition-all duration-200 inline-block relative z-10 hover:bg-[#2563eb]">Launch Prodigy →</a>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[rgba(59,130,246,0.15)] py-9 px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="font-['Syne'] font-extrabold text-base tracking-wider">
          PRODIGY<span className="text-[#3b82f6]">.</span>
        </div>
        <p className="text-[#7a7a8c] text-xs">Personal AI Assistant — built for one person, by one person.</p>
        <div className="flex gap-6">
          <a href="/privacy" className="text-[#7a7a8c] text-xs transition-colors duration-200 hover:text-[#3b82f6]">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}

/* Static Mock Data Objects for readability */
const featuresData = [
  { icon: '🧠', title: 'Persistent Memory', desc: 'Prodigy remembers your conversations across sessions — short-term context and long-term summaries, layered intelligently so nothing important is lost.' },
  { icon: '📄', title: 'Document-Aware Q&A', desc: 'Upload PDFs, notes, and research papers once. Ask questions about them forever. Prodigy retrieves the right context using semantic search across your entire knowledge base.' },
  { icon: '📅', title: 'Calendar Integration', desc: 'Connected to Google Calendar. Ask "What\'s on my schedule tomorrow?" or "When is my next deadline?" and get a real answer, not a generic response.' },
  { icon: '🔍', title: 'Web Search Routing', desc: 'Prodigy decides when to search the web vs. use your personal knowledge base — combining real-time information with your private context when it matters.' },
  { icon: '✅', title: 'Task Management', desc: 'Create and track tasks in plain English. "Add finish the OS assignment to my tasks" just works. View daily tasks, set deadlines, mark things done.' },
  { icon: '⚙️', title: 'Fully Personalized', desc: 'Set a custom system prompt, configure your profile, and tune how Prodigy responds. It\'s your assistant — it should behave the way you want.' }
];

const stepsData = [
  { num: '01', title: 'Sign in with Google', desc: 'Authenticate securely with your Google account. Your profile, calendar access, and data are linked to you — and only you.' },
  { num: '02', title: 'Upload your knowledge', desc: 'Drop in PDFs, notes, or project documentation. Prodigy parses, chunks, and embeds them into a private vector database for instant retrieval.' },
  { num: '03', title: 'Ask anything', desc: 'Prodigy routes each query to the right source — your documents, your calendar, its memory of past conversations, or the live web — and synthesizes a grounded answer.' },
  { num: '04', title: 'It gets better over time', desc: 'Conversations are summarized and stored. Frequently accessed information is prioritized. Prodigy learns the shape of how you work.' }
];