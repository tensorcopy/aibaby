const fs = require("node:fs/promises");

const { getDataFilePath: getBabyProfilesFilePath } = require("../baby-profile/local-store.js");
const { getDataFilePath: getTextMealFilePath } = require("../text-meal/local-store.js");
const { getDataFilePath: getMealDraftsFilePath } = require("../meal-drafts/local-store.js");
const { getDataFilePath: getUploadsFilePath } = require("../uploads/local-store.js");

async function buildTodayTimelineSnapshot({ ownerUserId, babyId, timezone = "UTC", date }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const targetDate = normalizeDate(date) || getCurrentDateInTimezone(timezone);

  const [profilesStore, textMealStore, mealDraftStore, uploadsStore] = await Promise.all([
    readJsonFile(getBabyProfilesFilePath(), { babyProfiles: [] }),
    readJsonFile(getTextMealFilePath(), { messages: [], ingestionEvents: [] }),
    readJsonFile(getMealDraftsFilePath(), { mealRecords: [], mealItems: [], ingestionEvents: [] }),
    readJsonFile(getUploadsFilePath(), { messages: [], mediaAssets: [], ingestionEvents: [] }),
  ]);

  const profiles = asArray(profilesStore.babyProfiles)
    .filter((profile) => profile.owner_user_id === normalizedOwnerUserId)
    .sort((left, right) => String(right.updated_at || "").localeCompare(String(left.updated_at || "")));

  const selectedProfile = selectProfile(profiles, babyId);

  if (!selectedProfile) {
    return {
      babyProfile: null,
      selectedBabyId: normalizeOptionalString(babyId) || null,
      date: targetDate,
      timezone,
      entries: [],
    };
  }

  const selectedBabyId = selectedProfile.id;
  const entries = [
    ...buildTextEntries(textMealStore, normalizedOwnerUserId, selectedBabyId, timezone, targetDate),
    ...buildUploadEntries(uploadsStore, normalizedOwnerUserId, selectedBabyId, timezone, targetDate),
    ...buildMealDraftEntries(mealDraftStore, normalizedOwnerUserId, selectedBabyId, timezone, targetDate),
  ].sort((left, right) => String(right.occurredAt).localeCompare(String(left.occurredAt)));

  return {
    babyProfile: toBabyProfileSummary(selectedProfile),
    selectedBabyId,
    date: targetDate,
    timezone,
    entries,
  };
}

function buildTextEntries(store, ownerUserId, babyId, timezone, targetDate) {
  return asArray(store.messages)
    .filter(
      (message) =>
        message.owner_user_id === ownerUserId &&
        message.baby_id === babyId &&
        normalizeDateForTimezone(message.created_at, timezone) === targetDate,
    )
    .map((message) => ({
      id: `text:${message.id}`,
      kind: "text_message",
      occurredAt: message.created_at,
      title: "Text meal note",
      status: message.ingestion_status,
      detail: message.text,
      metadata: {
        messageId: message.id,
      },
    }));
}

function buildUploadEntries(store, ownerUserId, babyId, timezone, targetDate) {
  return asArray(store.messages)
    .filter(
      (message) =>
        message.owner_user_id === ownerUserId &&
        message.baby_id === babyId &&
        normalizeDateForTimezone(message.created_at, timezone) === targetDate,
    )
    .map((message) => {
      const mediaAssets = asArray(store.mediaAssets).filter((asset) => asset.message_id === message.id);
      const uploadedCount = mediaAssets.filter((asset) => asset.upload_status === "uploaded").length;

      return {
        id: `upload:${message.id}`,
        kind: "image_upload",
        occurredAt: message.created_at,
        title: "Photo upload",
        status: message.ingestion_status,
        detail: `${uploadedCount}/${mediaAssets.length} asset${mediaAssets.length === 1 ? "" : "s"} uploaded`,
        metadata: {
          messageId: message.id,
          assetCount: mediaAssets.length,
        },
      };
    });
}

function buildMealDraftEntries(store, ownerUserId, babyId, timezone, targetDate) {
  return asArray(store.mealRecords)
    .filter(
      (record) =>
        record.owner_user_id === ownerUserId &&
        record.baby_id === babyId &&
        normalizeDateForTimezone(record.eaten_at || record.created_at, timezone) === targetDate,
    )
    .map((record) => {
      const items = asArray(store.mealItems)
        .filter((item) => item.meal_record_id === record.id)
        .map((item) => item.food_name)
        .filter(Boolean);

      return {
        id: `meal:${record.id}`,
        kind: "meal_record",
        occurredAt: record.eaten_at || record.created_at,
        title: `${capitalize(record.status || "draft")} ${record.meal_type || "meal"} record`,
        status: record.status,
        detail: record.ai_summary || items.join(", "),
        metadata: {
          mealRecordId: record.id,
          itemNames: items,
          sourceMessageId: record.source_message_id,
        },
      };
    });
}

function toBabyProfileSummary(profile) {
  return {
    id: profile.id,
    name: profile.name,
    birthDate: profile.birth_date,
    feedingStyle: profile.feeding_style,
    timezone: profile.timezone,
    allergies: asArray(profile.allergies_json),
    supplements: asArray(profile.supplements_json),
    primaryCaregiver: profile.primary_caregiver || null,
    updatedAt: profile.updated_at,
  };
}

function selectProfile(profiles, babyId) {
  const normalizedBabyId = normalizeOptionalString(babyId);

  if (!normalizedBabyId) {
    return profiles[0] || null;
  }

  return profiles.find((profile) => profile.id === normalizedBabyId) || null;
}

async function readJsonFile(filePath, emptyValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return emptyValue;
    }

    throw error;
  }
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  const normalized = normalizeOptionalString(ownerUserId);

  if (!normalized) {
    throw new Error("An authenticated owner user id is required");
  }

  return normalized;
}

function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeDateForTimezone(value, timezone) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getDateInTimezone(date, timezone);
}

function getCurrentDateInTimezone(timezone) {
  return getDateInTimezone(new Date(), timezone);
}

function getDateInTimezone(date, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  buildTodayTimelineSnapshot,
};
