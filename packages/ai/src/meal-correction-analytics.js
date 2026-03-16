const CATEGORY_KEYS = [
  'meal_type_changed',
  'item_added',
  'item_removed',
  'food_name_changed',
  'amount_text_changed',
];

function summarizeMealCorrections(input) {
  const normalized = normalizeInput(input);
  const categoryCounts = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, 0]));
  const foodCounts = new Map();
  let editedEventCount = 0;
  let unchangedConfirmationCount = 0;

  for (const event of normalized.events) {
    if (event.status !== 'edited') {
      unchangedConfirmationCount += 1;
      continue;
    }

    editedEventCount += 1;

    if (event.originalMealType !== event.confirmedMealType) {
      categoryCounts.meal_type_changed += 1;
    }

    const maxLength = Math.max(event.originalItems.length, event.confirmedItems.length);

    for (let index = 0; index < maxLength; index += 1) {
      const originalItem = event.originalItems[index] || null;
      const confirmedItem = event.confirmedItems[index] || null;

      if (!originalItem && confirmedItem) {
        categoryCounts.item_added += 1;
        incrementFood(foodCounts, confirmedItem.foodName);
        continue;
      }

      if (originalItem && !confirmedItem) {
        categoryCounts.item_removed += 1;
        incrementFood(foodCounts, originalItem.foodName);
        continue;
      }

      if (!originalItem || !confirmedItem) {
        continue;
      }

      if (normalizeText(originalItem.foodName) !== normalizeText(confirmedItem.foodName)) {
        categoryCounts.food_name_changed += 1;
        incrementFood(foodCounts, confirmedItem.foodName);
      }

      if (normalizeText(originalItem.amountText) !== normalizeText(confirmedItem.amountText)) {
        categoryCounts.amount_text_changed += 1;
        incrementFood(foodCounts, confirmedItem.foodName);
      }
    }
  }

  const repeatedCategories = Object.entries(categoryCounts)
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([category, count]) => ({
      category,
      count,
    }));

  const topFoods = [...foodCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([foodName, changeCount]) => ({
      foodName,
      changeCount,
    }));

  return {
    version: 'v1',
    totalEvents: normalized.events.length,
    editedEventCount,
    unchangedConfirmationCount,
    categoryCounts,
    repeatedCategories,
    topFoods,
    renderedSummary: buildRenderedSummary({
      editedEventCount,
      unchangedConfirmationCount,
      categoryCounts,
      repeatedCategories,
    }),
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Meal correction analytics input must be an object');
  }

  return {
    events: asArray(input.events).map(normalizeEvent),
  };
}

function normalizeEvent(event) {
  return {
    status: event?.status === 'edited' ? 'edited' : 'confirmed',
    originalMealType: normalizeText(event?.originalMealType),
    confirmedMealType: normalizeText(event?.confirmedMealType),
    originalItems: asArray(event?.originalItems).map(normalizeItem),
    confirmedItems: asArray(event?.confirmedItems).map(normalizeItem),
  };
}

function normalizeItem(item) {
  return {
    foodName: normalizeText(item?.foodName),
    amountText: normalizeText(item?.amountText),
  };
}

function incrementFood(foodCounts, foodName) {
  const normalizedFoodName = normalizeText(foodName);
  if (!normalizedFoodName) return;
  foodCounts.set(normalizedFoodName, (foodCounts.get(normalizedFoodName) || 0) + 1);
}

function buildRenderedSummary({ editedEventCount, unchangedConfirmationCount, categoryCounts, repeatedCategories }) {
  const activeCategories = Object.entries(categoryCounts)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([category]) => humanizeCategory(category));

  const lines = [];

  if (editedEventCount > 0) {
    lines.push(`Reviewed ${editedEventCount} edited meal confirmations.`);
  }

  if (activeCategories.length > 0) {
    lines.push(`The most common correction categories were ${joinLabels(activeCategories)}.`);
  }

  if (unchangedConfirmationCount > 0) {
    lines.push(`${unchangedConfirmationCount} confirmations did not change the draft structure.`);
  }

  if (repeatedCategories.length > 0) {
    const repeated = repeatedCategories.map(({ category, count }) => `${humanizeCategory(category)} (${count})`);
    lines.push(`Repeated edit patterns centered on ${joinLabels(repeated)}.`);
  }

  return lines.join(' ');
}

function humanizeCategory(category) {
  return category.replaceAll('_', ' ');
}

function joinLabels(labels) {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports = {
  summarizeMealCorrections,
};
