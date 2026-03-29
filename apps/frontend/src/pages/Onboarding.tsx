import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Puzzle, Play, Music, CircleDot, Rss, ArrowRight, ArrowLeft } from "lucide-react";

import Logo from "../components/Logo";
import { cn } from "../lib/utils";

type Step = 0 | 1 | 2 | 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");

  const steps = [
    { label: "Create Space" },
    { label: "Browser extension" },
    { label: "Sync source" },
    { label: "Done" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(212,132,90,0.08)_0%,transparent_70%)]" />
        <div className="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(74,122,91,0.06)_0%,transparent_70%)]" />
      </div>

      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-9 w-full max-w-[480px] shadow-[0_8px_40px_rgba(30,28,26,0.07)] animate-fade-in relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo variant="full" size="lg" />
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className={cn("flex items-center gap-1.5", i === steps.length - 1 && "flex-1")}>
                <div
                  className={cn(
                    "w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-ui font-medium shrink-0 transition-all",
                    i <= step
                      ? "bg-[var(--accent)] border-[1.5px] border-[var(--accent)] text-white"
                      : "bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-subtle)] text-[var(--text-muted)]",
                  )}
                >
                  {i < step ? <Check size={10} /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-ui whitespace-nowrap",
                    i === step ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px transition-colors",
                    i < step ? "bg-[var(--accent)]" : "bg-[var(--border-subtle)]",
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div key={step} className="animate-slide-in-up">
          {step === 0 && (
            <div>
              <h2 className="font-display font-medium text-xl mb-2">
                Create your first Space
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] mb-6">
                Spaces are folders for your saved content. Give this one a name.
              </p>
              <div className="mb-3.5">
                <label className="text-label block mb-1.5 text-[var(--text-secondary)]">
                  Space name
                </label>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="e.g. Dev tools, Recipes, Reading list..."
                  className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-ui text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="text-label block mb-1.5 text-[var(--text-secondary)]">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  placeholder="What will you save here?"
                  className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-ui text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!spaceName.trim()}
                className={cn(
                  "w-full h-10 border-none rounded-[9px] text-sm font-ui font-medium cursor-pointer transition-colors",
                  spaceName.trim()
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--terra-600)]"
                    : "bg-[var(--border-subtle)] text-[var(--text-muted)] cursor-default",
                )}
              >
                Create Space <ArrowRight size={14} className="inline ml-1 -mt-0.5" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display font-medium text-xl mb-2">
                Install the browser extension
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] mb-6">
                Save any page to brainfeed in one click, directly from your browser.
              </p>
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[10px] mb-6 flex items-center gap-3.5">
                <Puzzle size={28} className="text-[var(--text-muted)] shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[var(--text-primary)] mb-0.5">
                    Chrome / Edge / Brave
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Available on the Chrome Web Store</p>
                </div>
                <button className="h-8 px-3.5 bg-[var(--accent)] border-none rounded-[7px] text-xs font-ui font-medium text-white cursor-pointer shrink-0 transition-colors hover:bg-[var(--terra-600)]">
                  Install
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 h-[38px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[9px] text-[13px] font-ui text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--border-strong)]"
                >
                  <ArrowLeft size={12} className="inline mr-1 -mt-0.5" /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-[2] h-[38px] bg-[var(--accent)] border-none rounded-[9px] text-[13px] font-ui font-medium text-white cursor-pointer transition-colors hover:bg-[var(--terra-600)]"
                >
                  Next <ArrowRight size={12} className="inline ml-1 -mt-0.5" />
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                className="block w-full mt-2.5 bg-transparent border-none text-xs text-[var(--text-muted)] cursor-pointer font-ui hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display font-medium text-xl mb-2">
                Connect a sync source
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] mb-6">
                Automatically pull content from YouTube, Reddit, Spotify, or RSS feeds.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { icon: <Play size={16} />, label: "YouTube", color: "#ff0000", desc: "Saved videos, liked videos, watch later" },
                  { icon: <Music size={16} />, label: "Spotify", color: "#1db954", desc: "Saved podcasts and playlists" },
                  { icon: <CircleDot size={16} />, label: "Reddit", color: "#ff4500", desc: "Saved posts and upvoted content" },
                  { icon: <Rss size={16} />, label: "RSS / Atom", color: "#f79c42", desc: "Any blog or feed via URL" },
                ].map((src) => (
                  <div
                    key={src.label}
                    className="flex items-center gap-3 py-3 px-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[9px]"
                  >
                    <span style={{ color: src.color }}>{src.icon}</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">{src.label}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{src.desc}</p>
                    </div>
                    <button className="h-7 px-3 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-md text-[11px] font-ui font-medium text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--border-strong)]">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-[38px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[9px] text-[13px] font-ui text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--border-strong)]"
                >
                  <ArrowLeft size={12} className="inline mr-1 -mt-0.5" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-[2] h-[38px] bg-[var(--accent)] border-none rounded-[9px] text-[13px] font-ui font-medium text-white cursor-pointer transition-colors hover:bg-[var(--terra-600)]"
                >
                  Done <ArrowRight size={12} className="inline ml-1 -mt-0.5" />
                </button>
              </div>
              <button
                onClick={() => setStep(3)}
                className="block w-full mt-2.5 bg-transparent border-none text-xs text-[var(--text-muted)] cursor-pointer font-ui hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent-subtle)] rounded-full flex items-center justify-center mx-auto mb-5">
                <Check size={28} className="text-[var(--accent)]" />
              </div>
              <h2 className="font-display font-medium text-[22px] mb-2">
                You're all set!
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] max-w-[280px] mx-auto mb-7">
                Your Space <strong className="text-[var(--text-secondary)]">{spaceName}</strong> is ready.
                Start saving.
              </p>
              <button
                onClick={() => navigate("/library")}
                className="h-[42px] px-8 bg-[var(--accent)] border-none rounded-[10px] text-sm font-ui font-medium text-white cursor-pointer transition-colors hover:bg-[var(--terra-600)]"
              >
                Go to my library <ArrowRight size={14} className="inline ml-1 -mt-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
