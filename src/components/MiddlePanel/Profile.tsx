import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useState as reactUseState } from 'react';
import { useGoogleConnection } from "../../contexts/GoogleConnectionProvider";

export function ProfilePanel() {
  return (
    <div className="w-full max-w-3xl px-6 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">Profile</h2>
          <p className="text-sm text-neutral-400">Manage your account info, identity, and connections.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl border border-neutral-700/60 text-neutral-200 hover:border-blue-500/30 hover:text-white transition-all">
            Reset
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 active:scale-95">
            Save Changes
          </button>
        </div>
      </div>

      {/* Top summary */}
      <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5 shadow-lg backdrop-blur flex gap-4 items-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 grid place-items-center text-xl font-bold text-white shadow-lg shadow-blue-500/30">
          JM
        </div>
        <div className="flex-1">
          <p className="text-sm text-neutral-400">Workspace member</p>
          <p className="text-lg font-semibold text-neutral-50">James McAllister</p>
          <p className="text-xs text-neutral-400">Joined NULL</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm text-neutral-300">
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">Tasks</p>
            <p className="text-lg font-semibold text-neutral-50">NULL</p>
          </div>
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">Chats</p>
            <p className="text-lg font-semibold text-neutral-50">NULL</p>
          </div>
          <div className="rounded-xl border border-neutral-800/70 bg-neutral-800/40 px-3 py-2">
            <p className="text-xs text-neutral-400">AI Actions</p>
            <p className="text-lg font-semibold text-neutral-50">NULL</p>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Profile</h3>
            <span className="text-[11px] text-neutral-400">Public</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Display name</label>
              <input
                type="text"
                defaultValue="Jimmy"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Title</label>
              <input
                type="text"
                defaultValue="AI Engineer Intern"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Location</label>
              <input
                type="text"
                defaultValue="Feasterville, PA"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
          </div>
        </section>

        <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Account</h3>
            <span className="text-[11px] text-neutral-400">Private</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Email</label>
              <input
                type="email"
                defaultValue="jpmac1102@outlook.com"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-300 rounded-xl border border-neutral-700/60 bg-neutral-800/50 px-3 py-2">
              <span>Two-factor authentication</span>
              <button className="px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-100 hover:bg-blue-500/15 transition-all text-xs">
                Enable
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Connections */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Connections</h3>
          <span className="text-[11px] text-neutral-400">OAuth</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GoogleButton />
          <AppleButton />
        </div>
      </section>

      {/* Custom System Prompt */}
      <section className="bg-neutral-800/60 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/50 flex flex-col gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wide">Custom System Prompt</h3>
          <span className="text-[11px] text-neutral-400">AI Behavior</span>
        </div>
        <textarea
          placeholder="E.g., You are an expert in software engineering and you like helping with homework and being a friendly companion."
          className="w-full h-32 bg-neutral-700/40 text-neutral-100 border border-neutral-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500 resize-none font-mono text-sm"
        />
      </section>
    </div>
  );
}
function GoogleButton () {
  const { connectedToGoogle } = useGoogleConnection();
  if (!connectedToGoogle) {
    return (<button
  className="w-full py-3 px-4 rounded-xl border border-neutral-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
  type="button"
  onClick={() => window.location.href = "https://accounts.google.com/o/oauth2/v2/auth" +
  "?client_id=709562874886-ercnvc3464agumo82b3osvkqriihofgq.apps.googleusercontent.com" +
  "&redirect_uri=https://prodigyaiassistant.onrender.com/auth/google/callback" +
  "&response_type=code" +
  "&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ftasks" +
  "&access_type=offline" +
  "&prompt=consent"}
>
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.27 0 6.2 1.13 8.52 3.35l6.36-6.36C34.9 2.47 29.86 0 24 0 14.64 0 6.4 5.38 2.52 13.22l7.53 5.85C11.62 13.07 17.27 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.57-.14-3.09-.39-4.55H24v9.02h12.7c-.55 2.97-2.2 5.49-4.69 7.18l7.36 5.71C43.78 38.24 46.5 31.88 46.5 24.5z" />
              <path fill="#FBBC05" d="M10.05 28.07A14.5 14.5 0 019.5 24c0-1.4.24-2.76.55-4.07l-7.53-5.85A23.93 23.93 0 000 24c0 3.8.9 7.38 2.52 10.92l7.53-5.85z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.79l-7.36-5.71c-2.04 1.38-4.66 2.2-8.53 2.2-6.73 0-12.38-3.57-14.95-8.92l-7.53 5.85C6.4 42.62 14.64 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>Connect Google</span>
          </button>);  }
    else {
      return (
        <button
      className="w-full py-3 px-4 rounded-xl border border-green-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
      type="button"
    >
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#34A853" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z" />
                <path fill="#34A853" d="M34.59 15.41l-11.3 11.3-5.88-5.88a2 2 0 10-2.83 2.83l7.29 7.29a2 2 0 002.83 0l12.71-12.71a2 2 0 10-2.83-2.83z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>Google Connected</span>
            </button>
      )
    }
}
function AppleButton() {
  const [connectedToApple] = reactUseState(false);

  if (!connectedToApple){
    return (
    <button
            className="w-full py-3 px-4 rounded-xl border border-neutral-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
            type="button"
          >
            <DevicePhoneMobileIcon className="w-5 h-5" />
            <span>Connect Apple ID</span>
          </button>
    );
  }
  else {
    return (
      <button
      className="w-full py-3 px-4 rounded-xl border border-green-700/60 bg-neutral-800/60 hover:bg-neutral-800/80 text-neutral-50 font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
      type="button"
    >
      <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#34A853" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z" />
                <path fill="#34A853" d="M34.59 15.41l-11.3 11.3-5.88-5.88a2 2 0 10-2.83 2.83l7.29 7.29a2 2 0 002.83 0l12.71-12.71a2 2 0 10-2.83-2.83z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
      <span>Apple ID Connected</span>
    </button>
    )
  }
}

