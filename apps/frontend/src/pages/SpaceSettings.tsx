import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

import {
  useSpace,
  useUpdateSpace,
  useDeleteSpace,
  useShareSpace,
  useUnshareSpace,
  useRules,
  useCreateRule,
  useDeleteRule,
  useMembers,
  useInviteMember,
  useRemoveMember,
} from "../api/hooks";
import type { RuleRow, MemberRow } from "../api/hooks";

type Section = "general" | "rules" | "collaborators" | "sharing";

const navItems: { label: string; value: Section }[] = [
  { label: "General", value: "general" },
  { label: "Categorization", value: "rules" },
  { label: "Collaborators", value: "collaborators" },
  { label: "Public sharing", value: "sharing" },
];

export default function SpaceSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: space, isLoading: spaceLoading } = useSpace(id);
  const { data: rulesData } = useRules(id);
  const { data: membersData } = useMembers(id);

  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();
  const shareSpace = useShareSpace();
  const unshareSpace = useUnshareSpace();
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  const [section, setSection] = useState<Section>("general");
  const [spaceName, setSpaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (space) setSpaceName(space.name);
  }, [space]);

  const rules: RuleRow[] = rulesData?.data ?? [];
  const members: MemberRow[] = membersData?.data ?? [];

  if (spaceLoading) {
    return <div className="p-10 text-[var(--text-muted)]">Loading...</div>;
  }

  if (!space) return <div className="p-10 text-[var(--text-muted)]">Space not found.</div>;

  const handleCopy = () => {
    if (space.share_token) {
      void navigator.clipboard.writeText(`https://brainfeed.app/p/${space.share_token}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[800px] animate-fade-in p-6">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-1.5">
        <Link to={`/spaces/${id}`} className="text-[13px] text-[var(--accent)]">{space.name}</Link>
        <span className="text-[13px] text-[var(--text-muted)]">&rsaquo;</span>
        <span className="text-[13px] text-[var(--text-muted)]">Settings</span>
      </div>

      <h1 className="mb-6 font-display text-[22px] font-medium text-[var(--text-primary)]">
        Space Settings
      </h1>

      <div className="flex gap-7">
        {/* Nav */}
        <nav className="w-40 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setSection(item.value)}
              className={cn(
                "mb-0.5 block w-full rounded-[7px] px-2.5 py-[7px] text-left font-ui text-[13px] transition-[background] duration-[var(--transition-fast)]",
                section === item.value
                  ? "bg-[var(--bg-surface)] font-medium text-[var(--text-primary)]"
                  : "bg-transparent text-[var(--text-secondary)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {section === "general" && (
            <div>
              <div className="mb-5">
                <label className="text-label mb-[5px] block text-[var(--text-secondary)]">Space name</label>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="h-[38px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-ui text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="mb-7">
                <label className="text-label mb-[5px] block text-[var(--text-secondary)]">Description</label>
                <textarea
                  defaultValue={space.description ?? ""}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 font-ui text-sm leading-[1.5] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <button
                onClick={() => updateSpace.mutate({ id: id!, name: spaceName })}
                className="mb-12 h-9 cursor-pointer rounded-lg bg-[var(--accent)] px-[18px] font-ui text-[13px] font-medium text-white hover:bg-terra-600"
              >
                Save changes
              </button>

              {/* Danger zone */}
              <div className="border-t border-[var(--border-subtle)] pt-6">
                <p className="text-label mb-2 text-error">Danger zone</p>
                <p className="mb-3.5 text-[13px] text-[var(--text-muted)]">
                  Deleting this Space removes all its bookmarks and cannot be undone.
                </p>
                <button
                  onClick={() => {
                    deleteSpace.mutate(id!, { onSuccess: () => navigate("/spaces") });
                  }}
                  className="h-9 cursor-pointer rounded-lg border border-error bg-transparent px-[18px] font-ui text-[13px] font-medium text-error hover:bg-error/10"
                >
                  Delete Space
                </button>
              </div>
            </div>
          )}

          {section === "rules" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-medium">Categorization rules</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Auto-assign bookmarks matching these rules to this Space.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">AI auto-categorize</span>
                  <div
                    onClick={() => updateSpace.mutate({ id: id!, ai_auto_categorize: !space.ai_auto_categorize })}
                    className={cn(
                      "relative h-5 w-9 cursor-pointer rounded-[10px] transition-[background] duration-[var(--transition-fast)]",
                      space.ai_auto_categorize ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]",
                    )}
                  >
                    <div
                      className="absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white transition-[left] duration-[var(--transition-fast)]"
                      style={{ left: space.ai_auto_categorize ? 19 : 3 }}
                    />
                  </div>
                </div>
              </div>

              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 font-ui text-[13px] text-[var(--text-secondary)]"
                >
                  <code className="font-mono text-xs text-[var(--accent)]">{rule.rule_type}</code>
                  <span>contains</span>
                  <code className="font-mono text-xs text-[var(--text-primary)]">&quot;{rule.rule_value}&quot;</code>
                  <button
                    onClick={() => deleteRule.mutate({ spaceId: id!, ruleId: rule.id })}
                    className="ml-auto text-[11px] text-error hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button className="mt-1 flex h-[34px] items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-[var(--border-strong)] bg-transparent px-3.5 font-ui text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
                + Add rule
              </button>
            </div>
          )}

          {section === "collaborators" && (
            <div>
              <h3 className="mb-4 font-display text-base font-medium">Collaborators</h3>

              <div className="mb-6 flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-[38px] flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-ui text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={() => {
                    if (inviteEmail) {
                      inviteMember.mutate(
                        { spaceId: id!, email: inviteEmail, role: "viewer" },
                        { onSuccess: () => setInviteEmail("") },
                      );
                    }
                  }}
                  className="h-[38px] shrink-0 cursor-pointer rounded-lg bg-[var(--accent)] px-4 font-ui text-[13px] font-medium text-white hover:bg-terra-600"
                >
                  Invite
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full font-ui text-xs font-medium text-white"
                      style={{ background: `hsl(${(m.profiles.id.charCodeAt(1) * 37) % 360}, 40%, 55%)` }}
                    >
                      {m.profiles.display_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{m.profiles.display_name}</p>
                      <p className="text-meta">{m.role}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 font-ui text-2xs font-medium capitalize",
                        m.role === "owner"
                          ? "border border-terra-100 bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                          : "border border-[var(--border-subtle)] bg-[var(--bg-raised)] text-[var(--text-secondary)]",
                      )}
                    >
                      {m.role}
                    </span>
                    {m.role !== "owner" && (
                      <button
                        onClick={() => removeMember.mutate({ spaceId: id!, memberId: m.id })}
                        className="px-1 text-[11px] text-[var(--text-muted)] hover:text-error"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "sharing" && (
            <div>
              <h3 className="mb-1 font-display text-base font-medium">Public sharing</h3>
              <p className="mb-5 text-xs text-[var(--text-muted)]">
                Share a read-only view of this Space with anyone — no account needed.
              </p>

              {space.share_token ? (
                <div className="mb-3.5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <p className="text-label mb-2 text-[var(--text-muted)]">Share link</p>
                  <div className="flex gap-2">
                    <code className="flex-1 truncate rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
                      https://brainfeed.app/p/{space.share_token}
                    </code>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "h-9 shrink-0 rounded-[7px] border border-[var(--border-subtle)] px-3.5 font-ui text-xs font-medium transition-all duration-[var(--transition-fast)]",
                        copied
                          ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                          : "bg-[var(--bg-raised)] text-[var(--text-secondary)]",
                      )}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => shareSpace.mutate(id!)}
                  className="mb-3.5 h-9 cursor-pointer rounded-lg bg-[var(--accent)] px-[18px] font-ui text-[13px] font-medium text-white hover:bg-terra-600"
                >
                  Generate share link
                </button>
              )}

              {space.share_token && (
                <button
                  onClick={() => unshareSpace.mutate(id!)}
                  className="h-[34px] cursor-pointer rounded-[7px] border border-error bg-transparent px-3.5 font-ui text-xs text-error hover:bg-error/10"
                >
                  Revoke link
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
