const fs = require('node:fs/promises');
const path = require('node:path');

const { NotFoundRouteError, UnauthorizedRouteError } = require('../baby-profile/errors');
const { getDataFilePath: getBabyProfileDataFilePath } = require('../baby-profile/local-store');
const { getDataFilePath: getMealDataFilePath } = require('../text-meal/local-store');
const {
  getDataFilePath: getUploadDataFilePath,
  getUploadBlobRootPath,
} = require('../uploads/local-store');
const { fromBabyProfileRow, getBabyAgeSummary } = require('../../../../../packages/db/src/baby-profile.js');
const { fromMealItemRow, fromMealRecordRow } = require('../../../../../packages/db/src/meal-record.js');
const { buildDailySummary } = require('../../../../../packages/ai/src/daily-summary.js');

const defaultExportRootPath = path.resolve(__dirname, '../../../.data/exports');

async function createMarkdownExportBundle({ ownerUserId, babyId, exportedAt }) {
  const profile = await loadOwnedBabyProfile({ ownerUserId, babyId });
  const exportedAtIso = normalizeExportedAt(exportedAt);
  const exportTimestampSlug = exportedAtIso.replace(/[:.]/g, '-');
  const babySlug = slugify(profile.name);
  const bundleName = `ai-baby-export-${babySlug}-${exportTimestampSlug}`;
  const bundleRootPath = path.resolve(getExportRootPath(), bundleName);
  const [mealStore, uploadStore] = await Promise.all([readMealStore(), readUploadStore()]);
  const meals = hydrateMealsForBaby(mealStore, profile.ownerUserId, profile.id);
  const copiedMediaAssets = await copyMediaAssetsForBaby({
    ownerUserId: profile.ownerUserId,
    babyId: profile.id,
    uploadStore,
    bundleRootPath,
  });
  const mediaByDate = groupByDate(copiedMediaAssets, 'date');
  const mealsByDate = groupByDate(
    meals.map((meal) => ({
      ...meal,
      date: meal.eatenAt.slice(0, 10),
    })),
    'date',
  );
  const noteDates = [...new Set([...Object.keys(mealsByDate), ...Object.keys(mediaByDate)])].sort();

  await fs.mkdir(path.join(bundleRootPath, 'diary'), { recursive: true });
  await fs.mkdir(path.join(bundleRootPath, 'metadata'), { recursive: true });

  const dailyIndex = [];

  for (const noteDate of noteDates) {
    const dayMeals = (mealsByDate[noteDate] || []).sort((left, right) => left.eatenAt.localeCompare(right.eatenAt));
    const dayMedia = (mediaByDate[noteDate] || []).sort((left, right) => left.exportPath.localeCompare(right.exportPath));
    const summary = buildDailyExportSummary({
      noteDate,
      timezone: profile.timezone,
      meals: dayMeals,
    });
    const notePath = path.join(bundleRootPath, 'diary', `${noteDate}-baby-${babySlug}.md`);
    const noteContent = buildDailyDiaryMarkdown({
      profile,
      noteDate,
      exportedAtIso,
      meals: dayMeals,
      mediaAssets: dayMedia,
      summary,
      noteDatesBefore: noteDates.filter((date) => date < noteDate),
      allMealsByDate: mealsByDate,
    });

    await fs.writeFile(notePath, noteContent);
    dailyIndex.push({
      date: noteDate,
      note_path: path.relative(bundleRootPath, notePath),
      record_count: dayMeals.length,
      media_count: dayMedia.length,
    });
  }

  const manifest = {
    export_version: '1',
    exported_at: exportedAtIso,
    baby_id: profile.id,
    baby_name: profile.name,
    timezone: profile.timezone,
    note_count: noteDates.length,
    media_count: copiedMediaAssets.length,
    media_mode: 'copied',
    generator: 'ai-baby-mvp',
  };
  const manifestPath = path.join(bundleRootPath, 'manifest.json');
  const readmePath = path.join(bundleRootPath, 'README.md');
  const dailyIndexPath = path.join(bundleRootPath, 'metadata', 'daily-index.json');
  const mediaIndexPath = path.join(bundleRootPath, 'metadata', 'media-index.json');

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await fs.writeFile(readmePath, buildExportReadme({ profile, manifest }));
  await fs.writeFile(dailyIndexPath, JSON.stringify(dailyIndex, null, 2) + '\n');
  await fs.writeFile(
    mediaIndexPath,
    JSON.stringify(
      copiedMediaAssets.map((asset) => ({
        id: asset.id,
        date: asset.date,
        exported_path: asset.exportRelativePath,
        original_storage_path: asset.storagePath,
        mime_type: asset.mimeType,
      })),
      null,
      2,
    ) + '\n',
  );

  return {
    bundleName,
    exportPath: bundleRootPath,
    manifest,
    files: {
      readmePath,
      manifestPath,
      diaryPaths: dailyIndex.map((entry) => path.join(bundleRootPath, entry.note_path)),
      mediaPaths: copiedMediaAssets.map((asset) => asset.exportPath),
      metadataPaths: [dailyIndexPath, mediaIndexPath],
    },
  };
}

async function loadOwnedBabyProfile({ ownerUserId, babyId }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const store = await readBabyProfileStore();

  const row = store.babyProfiles.find(
    (candidate) =>
      candidate.id === normalizedBabyId && candidate.owner_user_id === normalizedOwnerUserId,
  );

  if (!row) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return fromBabyProfileRow(row);
}

async function copyMediaAssetsForBaby({ ownerUserId, babyId, uploadStore, bundleRootPath }) {
  const normalizedOwnerUserId = normalizeRequiredOwnerUserId(ownerUserId);
  const normalizedBabyId = normalizeRequiredBabyId(babyId);
  const uploadBlobRootPath = getUploadBlobRootPath();
  const eligibleAssets = uploadStore.mediaAssets
    .filter(
      (asset) =>
        asset.owner_user_id === normalizedOwnerUserId &&
        asset.baby_id === normalizedBabyId &&
        asset.upload_status === 'uploaded',
    )
    .sort((left, right) => String(left.created_at || '').localeCompare(String(right.created_at || '')));
  const sequenceByDateAndLabel = new Map();
  const copiedAssets = [];

  for (const asset of eligibleAssets) {
    const assetDate = String(asset.created_at || '').slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(assetDate)) {
      continue;
    }

    const sourcePath = path.resolve(uploadBlobRootPath, asset.storage_path);

    try {
      await fs.access(sourcePath);
    } catch {
      continue;
    }

    const label = inferMediaLabel(asset.file_name);
    const sequenceKey = `${assetDate}:${label}`;
    const nextSequence = (sequenceByDateAndLabel.get(sequenceKey) || 0) + 1;
    sequenceByDateAndLabel.set(sequenceKey, nextSequence);

    const extension = path.extname(asset.file_name || asset.storage_path || '').replace(/^\./, '') || 'jpg';
    const exportRelativePath = path.join(
      'media',
      assetDate.slice(0, 4),
      `${assetDate}-${label}-${String(nextSequence).padStart(2, '0')}.${extension}`,
    );
    const exportPath = path.join(bundleRootPath, exportRelativePath);

    await fs.mkdir(path.dirname(exportPath), { recursive: true });
    await fs.copyFile(sourcePath, exportPath);

    copiedAssets.push({
      id: asset.id,
      date: assetDate,
      exportPath,
      exportRelativePath,
      markdownRelativePath: `../${exportRelativePath.replaceAll(path.sep, '/')}`,
      storagePath: asset.storage_path,
      mimeType: asset.mime_type,
      fileName: asset.file_name,
    });
  }

  return copiedAssets;
}

function buildDailyExportSummary({ noteDate, timezone, meals }) {
  const mealEntries = meals.filter((meal) => !['milk', 'supplement'].includes(meal.mealType));
  const milkRecords = meals.filter((meal) => meal.mealType === 'milk');
  const supplementRecords = meals.filter((meal) => meal.mealType === 'supplement');

  return buildDailySummary({
    reportDate: noteDate,
    timezone,
    meals: mealEntries,
    milkRecords,
    supplementRecords,
  });
}

function buildDailyDiaryMarkdown({
  profile,
  noteDate,
  exportedAtIso,
  meals,
  mediaAssets,
  summary,
  noteDatesBefore,
  allMealsByDate,
}) {
  const ageMonths = safeAgeMonths(profile.birthDate, noteDate);
  const newFoods = collectNewFoodsForDate(noteDate, allMealsByDate, noteDatesBefore);
  const frontmatter = buildFrontmatter({
    title: `${profile.name} Daily Diary - ${noteDate}`,
    date: noteDate,
    babyName: profile.name,
    babyId: profile.id,
    timezone: profile.timezone,
    summaryStatus: summary ? 'generated' : 'missing',
    ageMonths,
    recordCount: meals.length,
    mediaCount: mediaAssets.length,
  });
  const mealEntries = meals.filter((meal) => !['milk', 'supplement'].includes(meal.mealType));
  const milkAndSupplements = meals.filter((meal) => ['milk', 'supplement'].includes(meal.mealType));

  return [
    frontmatter,
    `# ${profile.name} Daily Diary`,
    '',
    '## Summary',
    '',
    summary?.renderedSummary || 'No generated summary was available for this day.',
    '',
    '## Meals',
    '',
    mealEntries.length > 0 ? renderMealEntries(mealEntries) : 'No meal entries were exported for this day.',
    '',
    '## Milk and Supplements',
    '',
    milkAndSupplements.length > 0
      ? renderMealEntries(milkAndSupplements)
      : 'No milk or supplement entries were exported for this day.',
    '',
    '## Notes and Follow-ups',
    '',
    renderNotesAndFollowUps({ newFoods, summary, meals }),
    '',
    '## Media',
    '',
    mediaAssets.length > 0
      ? mediaAssets.map((asset) => `![${asset.fileName || 'Uploaded media'}](${asset.markdownRelativePath})`).join('\n')
      : 'No media files were exported for this day.',
    '',
    '## Metadata',
    '',
    `- Export timestamp: ${exportedAtIso}`,
    `- Record count: ${meals.length}`,
    `- Media count: ${mediaAssets.length}`,
    '- Generation method: ai-baby-mvp markdown export',
    '',
  ].join('\n');
}

function renderMealEntries(entries) {
  return entries
    .map((meal) => {
      const foodList = meal.items.map((item) => item.foodName).join(', ') || 'Unknown';
      const amountList =
        meal.items.map((item) => item.amountText).filter(Boolean).join(', ') || 'Not specified';

      return [
        `### ${formatMealHeading(meal.mealType)} - ${formatMealTime(meal.eatenAt)}`,
        `- Foods: ${foodList}`,
        `- Amounts: ${amountList}`,
        `- Source: ${meal.rawText ? 'text note' : 'structured record'}`,
        `- Status: ${meal.status}`,
        `- AI note: ${meal.aiSummary}`,
      ].join('\n');
    })
    .join('\n\n');
}

function renderNotesAndFollowUps({ newFoods, summary, meals }) {
  const lines = [];

  if (newFoods.length > 0) {
    lines.push(`- New foods tried: ${newFoods.join(', ')}`);
  }

  if (summary?.suggestionsText) {
    lines.push(`- Suggested next step: ${summary.suggestionsText}`);
  }

  if (meals.some((meal) => meal.status !== 'confirmed')) {
    lines.push('- Some exported records were still draft status at export time.');
  }

  return lines.length > 0 ? lines.join('\n') : 'No follow-up notes were generated for this day.';
}

function buildFrontmatter({
  title,
  date,
  babyName,
  babyId,
  timezone,
  summaryStatus,
  ageMonths,
  recordCount,
  mediaCount,
}) {
  const lines = [
    '---',
    `title: "${escapeYamlString(title)}"`,
    `date: ${date}`,
    `baby_name: "${escapeYamlString(babyName)}"`,
    `baby_id: "${escapeYamlString(babyId)}"`,
    'export_type: "daily_diary"',
    `timezone: "${escapeYamlString(timezone)}"`,
    `summary_status: "${summaryStatus}"`,
    'source_app: "AI Baby"',
    'source_version: "mvp"',
  ];

  if (typeof ageMonths === 'number') {
    lines.push(`age_months: ${ageMonths}`);
  }

  lines.push(`record_count: ${recordCount}`);
  lines.push(`media_count: ${mediaCount}`);
  lines.push('tags:');
  lines.push('  - ai-baby');
  lines.push('  - daily-diary');
  lines.push('  - feeding');
  lines.push('---');
  return lines.join('\n');
}

function buildExportReadme({ profile, manifest }) {
  return [
    '# AI Baby Markdown Export',
    '',
    `This export contains diary notes for ${profile.name}.`,
    '',
    '- `diary/` contains one Markdown diary note per exported day',
    '- `media/` contains copied local media when uploaded blobs were available',
    '- `metadata/` contains structured daily and media indexes for later import or validation',
    '',
    `Generated at: ${manifest.exported_at}`,
    `Media mode: ${manifest.media_mode}`,
    '',
  ].join('\n');
}

async function readBabyProfileStore() {
  return readJsonStore(getBabyProfileDataFilePath(), (store) => ({
    babyProfiles: Array.isArray(store?.babyProfiles) ? store.babyProfiles : [],
  }));
}

async function readMealStore() {
  return readJsonStore(getMealDataFilePath(), (store) => ({
    messages: Array.isArray(store?.messages) ? store.messages : [],
    mealRecords: Array.isArray(store?.mealRecords) ? store.mealRecords : [],
    mealItems: Array.isArray(store?.mealItems) ? store.mealItems : [],
  }));
}

async function readUploadStore() {
  return readJsonStore(getUploadDataFilePath(), (store) => ({
    mediaAssets: Array.isArray(store?.mediaAssets) ? store.mediaAssets : [],
  }));
}

async function readJsonStore(filePath, normalize) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return normalize(JSON.parse(raw));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return normalize({});
    }

    throw error;
  }
}

function hydrateMealsForBaby(store, ownerUserId, babyId) {
  return store.mealRecords
    .map((row) => {
      const meal = fromMealRecordRow(row);
      const sourceMessage = store.messages.find(
        (message) =>
          message.id === meal.sourceMessageId &&
          message.owner_user_id === ownerUserId &&
          message.baby_id === babyId,
      );

      if (!sourceMessage || meal.babyId !== babyId) {
        return null;
      }

      return {
        ...meal,
        items: store.mealItems
          .filter((item) => item.meal_record_id === meal.id)
          .map(fromMealItemRow),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.eatenAt.localeCompare(right.eatenAt));
}

function groupByDate(entries, dateKey) {
  return entries.reduce((grouped, entry) => {
    grouped[entry[dateKey]] = grouped[entry[dateKey]] || [];
    grouped[entry[dateKey]].push(entry);
    return grouped;
  }, {});
}

function collectNewFoodsForDate(noteDate, allMealsByDate, noteDatesBefore) {
  const previousFoods = new Set(
    noteDatesBefore.flatMap((date) =>
      (allMealsByDate[date] || []).flatMap((meal) =>
        meal.items.map((item) => String(item.foodName || '').trim().toLowerCase()),
      ),
    ),
  );

  return (allMealsByDate[noteDate] || [])
    .flatMap((meal) => meal.items)
    .map((item) => String(item.foodName || '').trim().toLowerCase())
    .filter((foodName, index, foods) => foodName && !previousFoods.has(foodName) && foods.indexOf(foodName) === index);
}

function formatMealHeading(mealType) {
  return String(mealType || 'meal')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMealTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
}

function safeAgeMonths(birthDate, noteDate) {
  try {
    return getBabyAgeSummary(birthDate, new Date(`${noteDate}T12:00:00Z`)).months;
  } catch {
    return undefined;
  }
}

function slugify(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'baby';
}

function inferMediaLabel(fileName) {
  const normalized = String(fileName || '').toLowerCase();

  if (normalized.includes('breakfast')) return 'breakfast';
  if (normalized.includes('lunch')) return 'lunch';
  if (normalized.includes('dinner')) return 'dinner';
  return 'media';
}

function normalizeExportedAt(exportedAt) {
  if (typeof exportedAt === 'string' && exportedAt.trim()) {
    return exportedAt.trim();
  }

  return new Date().toISOString();
}

function getExportRootPath() {
  return process.env.AIBABY_EXPORT_ROOT || defaultExportRootPath;
}

function normalizeRequiredOwnerUserId(ownerUserId) {
  if (typeof ownerUserId !== 'string' || ownerUserId.trim().length === 0) {
    throw new UnauthorizedRouteError('An authenticated owner user id is required');
  }

  return ownerUserId.trim();
}

function normalizeRequiredBabyId(babyId) {
  if (typeof babyId !== 'string' || babyId.trim().length === 0) {
    throw new NotFoundRouteError('Baby profile not found');
  }

  return babyId.trim();
}

function escapeYamlString(value) {
  return String(value || '').replace(/"/g, '\\"');
}

module.exports = {
  createMarkdownExportBundle,
  getExportRootPath,
};
