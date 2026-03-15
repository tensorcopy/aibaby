"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

type TimelineEntry = {
  id: string;
  kind: string;
  occurredAt: string;
  title: string;
  status: string;
  detail: string;
};

type TimelineResponse = {
  babyProfile: null | {
    id: string;
    name: string;
    birthDate: string;
    feedingStyle: string;
    timezone: string;
    allergies: string[];
    supplements: string[];
    primaryCaregiver: string | null;
    updatedAt?: string;
  };
  selectedBabyId: string | null;
  date: string;
  timezone: string;
  entries: TimelineEntry[];
};

type ParsedCandidate = {
  mealType: string;
  summary: string;
  items: Array<{ foodName: string; amountText?: string | null }>;
};

export function DevShellPage({
  defaultOwnerUserId,
  defaultTimezone,
}: {
  defaultOwnerUserId: string;
  defaultTimezone: string;
}) {
  const [ownerUserId, setOwnerUserId] = useState(defaultOwnerUserId);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [babyId, setBabyId] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    birthDate: "",
    feedingStyle: "mixed",
    timezone: defaultTimezone,
    primaryCaregiver: "",
  });
  const [mealText, setMealText] = useState("");
  const [quickAction, setQuickAction] = useState("breakfast");
  const [lastParsedCandidate, setLastParsedCandidate] = useState<ParsedCandidate | null>(null);

  const canCreateProfile = profileForm.name.trim().length > 0 && profileForm.birthDate.trim().length > 0;
  const canSubmitMeal = babyId.trim().length > 0 && mealText.trim().length > 0;

  async function refreshTimeline(explicitBabyId?: string) {
    setIsRefreshing(true);
    setInlineError(null);

    try {
      const resolvedBabyId = explicitBabyId ?? babyId.trim();
      const query = new URLSearchParams({
        timezone: profileForm.timezone || defaultTimezone,
      });

      if (resolvedBabyId) {
        query.set("babyId", resolvedBabyId);
      }

      const response = await fetch(`/api/timeline?${query.toString()}`, {
        headers: {
          "x-aibaby-owner-user-id": ownerUserId,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load timeline");
      }

      setTimeline(payload);
      if (payload.selectedBabyId) {
        setBabyId(payload.selectedBabyId);
      }
      if (payload.babyProfile) {
        setProfileForm({
          name: payload.babyProfile.name,
          birthDate: payload.babyProfile.birthDate,
          feedingStyle: payload.babyProfile.feedingStyle,
          timezone: payload.babyProfile.timezone,
          primaryCaregiver: payload.babyProfile.primaryCaregiver || "",
        });
      }
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Failed to load timeline");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshTimeline();
  }, []);

  async function handleLoadCurrentProfile() {
    setInlineError(null);

    try {
      const response = await fetch("/api/babies", {
        headers: {
          "x-aibaby-owner-user-id": ownerUserId,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load current baby profile");
      }

      setBabyId(payload.id);
      setProfileForm({
        name: payload.name,
        birthDate: payload.birthDate,
        feedingStyle: payload.feedingStyle,
        timezone: payload.timezone,
        primaryCaregiver: payload.primaryCaregiver || "",
      });
      await refreshTimeline(payload.id);
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Failed to load current baby profile");
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setInlineError(null);

    try {
      const method = babyId.trim() ? "PATCH" : "POST";
      const path = babyId.trim() ? `/api/babies/${encodeURIComponent(babyId.trim())}` : "/api/babies";
      const response = await fetch(path, {
        method,
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": ownerUserId,
        },
        body: JSON.stringify({
          name: profileForm.name,
          birthDate: profileForm.birthDate,
          feedingStyle: profileForm.feedingStyle,
          timezone: profileForm.timezone,
          primaryCaregiver: profileForm.primaryCaregiver || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save baby profile");
      }

      setBabyId(payload.id);
      await refreshTimeline(payload.id);
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Failed to save baby profile");
    }
  }

  async function handleSubmitMeal(event: FormEvent) {
    event.preventDefault();
    setInlineError(null);

    try {
      const parsedResponse = await fetch("/api/messages/text-parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": ownerUserId,
        },
        body: JSON.stringify({
          babyId,
          text: mealText,
          quickAction,
          submittedAt: new Date().toISOString(),
        }),
      });
      const parsedPayload = await parsedResponse.json();

      if (!parsedResponse.ok) {
        throw new Error(parsedPayload.error || "Failed to parse meal note");
      }

      setLastParsedCandidate(parsedPayload.parsedCandidate);

      const draftResponse = await fetch("/api/meal-records/drafts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": ownerUserId,
        },
        body: JSON.stringify({
          babyId,
          sourceMessageId: parsedPayload.messageId,
        }),
      });
      const draftPayload = await draftResponse.json();

      if (!draftResponse.ok) {
        throw new Error(draftPayload.error || "Failed to generate draft meal record");
      }

      setMealText("");
      await refreshTimeline(babyId);
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Failed to submit meal note");
    }
  }

  const summaryText = useMemo(() => {
    if (!timeline?.babyProfile) {
      return "Create or load a baby profile, then use the meal form to add records into today's timeline.";
    }

    return `${timeline.babyProfile.name} is active. Timeline entries refresh from the same local-dev stores the API routes use.`;
  }, [timeline]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
      <section style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0369a1" }}>
            Manual Test Shell
          </p>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1 }}>Today timeline and input flows are testable in the browser.</h1>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{summaryText}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 20, alignItems: "start" }}>
          <div style={panelStyle}>
            <h2 style={sectionTitleStyle}>Session</h2>
            <label style={labelStyle}>
              Owner user id
              <input style={inputStyle} value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)} />
            </label>
            <label style={labelStyle}>
              Active baby id
              <input style={inputStyle} value={babyId} onChange={(event) => setBabyId(event.target.value)} placeholder="Set automatically after load/create" />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={buttonStyle} onClick={() => void handleLoadCurrentProfile()} type="button">Load current profile</button>
              <button style={secondaryButtonStyle} onClick={() => void refreshTimeline()} type="button">{isRefreshing ? "Refreshing..." : "Refresh timeline"}</button>
            </div>
            {inlineError ? <p style={errorStyle}>{inlineError}</p> : null}
          </div>

          <div style={panelStyle}>
            <h2 style={sectionTitleStyle}>Baby profile</h2>
            <form onSubmit={(event) => void handleSaveProfile(event)} style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Name
                <input style={inputStyle} value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label style={labelStyle}>
                Birth date
                <input style={inputStyle} type="date" value={profileForm.birthDate} onChange={(event) => setProfileForm((current) => ({ ...current, birthDate: event.target.value }))} />
              </label>
              <label style={labelStyle}>
                Feeding style
                <select style={inputStyle} value={profileForm.feedingStyle} onChange={(event) => setProfileForm((current) => ({ ...current, feedingStyle: event.target.value }))}>
                  <option value="breast_milk">breast_milk</option>
                  <option value="formula">formula</option>
                  <option value="mixed">mixed</option>
                  <option value="solids_started">solids_started</option>
                </select>
              </label>
              <label style={labelStyle}>
                Timezone
                <input style={inputStyle} value={profileForm.timezone} onChange={(event) => setProfileForm((current) => ({ ...current, timezone: event.target.value }))} />
              </label>
              <label style={labelStyle}>
                Primary caregiver
                <input style={inputStyle} value={profileForm.primaryCaregiver} onChange={(event) => setProfileForm((current) => ({ ...current, primaryCaregiver: event.target.value }))} />
              </label>
              <button disabled={!canCreateProfile} style={buttonStyle} type="submit">
                {babyId.trim() ? "Save profile changes" : "Create baby profile"}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          <div style={panelStyle}>
            <h2 style={sectionTitleStyle}>Text meal note</h2>
            <form onSubmit={(event) => void handleSubmitMeal(event)} style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Quick action
                <select style={inputStyle} value={quickAction} onChange={(event) => setQuickAction(event.target.value)}>
                  <option value="breakfast">breakfast</option>
                  <option value="lunch">lunch</option>
                  <option value="dinner">dinner</option>
                  <option value="snack">snack</option>
                  <option value="milk">milk</option>
                </select>
              </label>
              <label style={labelStyle}>
                Meal note
                <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={mealText} onChange={(event) => setMealText(event.target.value)} placeholder="Example: Breakfast: oatmeal, banana, and yogurt." />
              </label>
              <button disabled={!canSubmitMeal} style={buttonStyle} type="submit">Parse note and create draft</button>
            </form>
            {lastParsedCandidate ? (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", display: "grid", gap: 6 }}>
                <strong>Last parsed candidate</strong>
                <span>Meal type: {lastParsedCandidate.mealType}</span>
                <span>{lastParsedCandidate.summary}</span>
                <span>Items: {lastParsedCandidate.items.map((item) => item.foodName).join(", ")}</span>
              </div>
            ) : null}
          </div>

          <div style={panelStyle}>
            <h2 style={sectionTitleStyle}>Today timeline</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              {timeline?.babyProfile ? `Showing ${timeline.entries.length} entries for ${timeline.babyProfile.name} on ${timeline.date}.` : "No active baby selected yet."}
            </p>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {timeline?.entries.length ? timeline.entries.map((entry) => (
                <div key={entry.id} style={{ borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 14, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <strong>{entry.title}</strong>
                    <span style={{ fontSize: 12, color: "#334155", textTransform: "capitalize" }}>{entry.status}</span>
                  </div>
                  <span style={{ color: "#475569", lineHeight: 1.5 }}>{entry.detail}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{new Date(entry.occurredAt).toLocaleString()}</span>
                </div>
              )) : (
                <div style={{ borderRadius: 14, border: "1px dashed #cbd5e1", background: "#f8fafc", padding: 18, color: "#475569" }}>
                  No timeline entries yet for the selected baby and date.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const panelStyle: CSSProperties = {
  borderRadius: 20,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  padding: 20,
  display: "grid",
  gap: 12,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  padding: "12px 14px",
  fontSize: 14,
  color: "#0f172a",
  background: "#ffffff",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid #0369a1",
  background: "#0284c7",
  color: "#ffffff",
  fontWeight: 700,
  padding: "12px 16px",
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: "#b91c1c",
  lineHeight: 1.5,
};
