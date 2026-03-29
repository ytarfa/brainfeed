import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";

import { useProfile, useUpdateProfile, useDeleteAccount } from "../api/hooks";

type Tab = "profile" | "accounts" | "notifications" | "danger";

const tabs: { label: string; value: Tab }[] = [
  { label: "Profile", value: "profile" },
  { label: "Connected accounts", value: "accounts" },
  { label: "Notifications", value: "notifications" },
  { label: "Danger zone", value: "danger" },
];

const accountsList = [
  { icon: "G", label: "Google", connected: true, color: "#4285F4" },
  { icon: "\u25B6", label: "YouTube", connected: false, color: "#ff0000" },
  { icon: "\u266A", label: "Spotify", connected: false, color: "#1db954" },
  { icon: "\u25CE", label: "Reddit", connected: false, color: "#ff4500" },
];

const notificationPrefs = [
  { label: "AI categorization activity", desc: "When AI adds items to your Spaces", enabled: true },
  { label: "Sync errors", desc: "When a sync source fails to connect", enabled: true },
  { label: "Collaborator activity", desc: "When someone joins or edits your Spaces", enabled: false },
  { label: "Weekly digest", desc: "A summary of what's been saved", enabled: false },
];

export default function UserSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="max-w-[740px] p-6">
        <p className="text-[var(--text-muted)]">Loading settings...</p>
      </div>
    );
  }

  const avatarInitial = (profile?.display_name ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-[740px] animate-fade-in p-6">
      <h1 className="mb-6 font-display text-2xl font-medium text-[var(--text-primary)]">Settings</h1>

      <div className="flex gap-7">
        {/* Nav */}
        <nav className="w-40 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "mb-0.5 block w-full rounded-[7px] px-2.5 py-[7px] text-left font-ui text-[13px] transition-[background] duration-[var(--transition-fast)]",
                tab === t.value
                  ? "bg-[var(--bg-surface)] font-medium"
                  : "bg-transparent",
                t.value === "danger"
                  ? "text-error opacity-75"
                  : tab === t.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {tab === "profile" && (
            <div>
              {/* Avatar */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-ui text-[22px] font-medium text-white">
                  {avatarInitial}
                </div>
                <div>
                  <p className="mb-0.5 text-sm font-medium text-[var(--text-primary)]">
                    {profile?.display_name ?? ""}
                  </p>
                  <button className="p-0 font-ui text-xs text-[var(--accent)] hover:underline">
                    Upload photo
                  </button>
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-label mb-[5px] block text-[var(--text-secondary)]">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-[38px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-ui text-sm text-[var(--text-primary)] outline-none transition-[border-color] duration-[var(--transition-fast)] focus:border-[var(--accent)]"
                />
              </div>
              <div className="mb-6">
                <label className="text-label mb-[5px] block text-[var(--text-secondary)]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[38px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-ui text-sm text-[var(--text-primary)] outline-none transition-[border-color] duration-[var(--transition-fast)] focus:border-[var(--accent)]"
                />
              </div>
              <button
                onClick={() => updateProfile.mutate({ display_name: name })}
                className="h-9 cursor-pointer rounded-lg bg-[var(--accent)] px-[18px] font-ui text-[13px] font-medium text-white hover:bg-terra-600"
              >
                Save changes
              </button>
            </div>
          )}

          {tab === "accounts" && (
            <div>
              <h3 className="mb-1 font-display text-base font-medium">Connected accounts</h3>
              <p className="mb-5 text-xs text-[var(--text-muted)]">
                These accounts can sync content to your Spaces.
              </p>
              {accountsList.map((acc) => (
                <div
                  key={acc.label}
                  className="mb-2 flex items-center gap-3 rounded-[9px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{ background: acc.color + "18", color: acc.color }}
                  >
                    {acc.icon}
                  </div>
                  <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)]">
                    {acc.label}
                  </span>
                  {acc.connected ? (
                    <div className="flex items-center gap-1.5">
                      <span className="h-[7px] w-[7px] rounded-full bg-success" />
                      <span className="text-xs text-success">Connected</span>
                      <button className="ml-2 text-[11px] text-[var(--text-muted)] hover:text-error">
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button className="h-7 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 font-ui text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)]">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "notifications" && (
            <div>
              <h3 className="mb-5 font-display text-base font-medium">Notification preferences</h3>
              {notificationPrefs.map((pref) => (
                <div
                  key={pref.label}
                  className="flex items-center gap-3 border-b border-[var(--border-subtle)] py-3"
                >
                  <div className="flex-1">
                    <p className="mb-0.5 text-[13px] font-medium text-[var(--text-primary)]">{pref.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{pref.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "relative h-5 w-9 shrink-0 cursor-pointer rounded-[10px] transition-[background] duration-[var(--transition-fast)]",
                      pref.enabled ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]",
                    )}
                  >
                    <div
                      className="absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white transition-[left] duration-[var(--transition-fast)]"
                      style={{ left: pref.enabled ? 19 : 3 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "danger" && (
            <div>
              <div className="rounded-[10px] border border-error/20 bg-error/[0.04] p-5">
                <h3 className="mb-1.5 text-[15px] font-medium text-error">Delete account</h3>
                <p className="mb-4 text-[13px] leading-[1.5] text-[var(--text-muted)]">
                  This permanently deletes your account, all Spaces, and all saved content. This cannot be undone.
                </p>
                <button
                  onClick={() => deleteAccount.mutate()}
                  className="h-9 cursor-pointer rounded-lg bg-error px-[18px] font-ui text-[13px] font-medium text-white hover:opacity-90"
                >
                  Delete my account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
