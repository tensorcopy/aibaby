function parseTextMealInput({ text, quickAction, submittedAt } = {}) {
  const normalizedText = normalizeRequiredText(text);
  const normalizedQuickAction = normalizeOptionalQuickAction(quickAction);
  const mealTypeSignal = inferMealType({ text: normalizedText, quickAction: normalizedQuickAction });
  const strippedText = stripMealLeadIn(normalizedText, mealTypeSignal.mealType, normalizedQuickAction);
  const itemPhrases = splitIntoItemPhrases(strippedText);
  const items = itemPhrases.map(parseItemPhrase).filter(Boolean);
  const hasItems = items.length > 0;
  const followUpQuestion = hasItems
    ? null
    : 'What foods or milk should be included in this record?';

  return {
    parserVersion: 'text-rule-v1',
    originalText: normalizedText,
    submittedAt: normalizeSubmittedAt(submittedAt),
    mealType: mealTypeSignal.mealType,
    mealTypeSource: mealTypeSignal.source,
    confidenceLabel: hasItems && mealTypeSignal.confident ? 'medium' : hasItems ? 'low' : 'low',
    requiresConfirmation: true,
    followUpQuestion,
    summary: buildSummary({ mealType: mealTypeSignal.mealType, items, followUpQuestion }),
    items,
  };
}

function normalizeRequiredText(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text input is required for text meal parsing.');
  }

  return text.trim().replace(/\s+/g, ' ');
}

function normalizeOptionalQuickAction(quickAction) {
  if (typeof quickAction !== 'string') {
    return undefined;
  }

  const normalized = quickAction.trim().toLowerCase();
  return mealTypeAliases[normalized] ? normalized : undefined;
}

function normalizeSubmittedAt(submittedAt) {
  if (typeof submittedAt !== 'string' || submittedAt.trim().length === 0) {
    return null;
  }

  const value = submittedAt.trim();
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function inferMealType({ text, quickAction }) {
  if (quickAction && mealTypeAliases[quickAction]) {
    return {
      mealType: mealTypeAliases[quickAction],
      source: 'quick_action',
      confident: true,
    };
  }

  const normalized = text.toLowerCase();

  for (const [candidate, patterns] of Object.entries(mealTypeKeywordPatterns)) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return {
        mealType: candidate,
        source: 'text',
        confident: true,
      };
    }
  }

  return {
    mealType: 'unknown',
    source: 'fallback',
    confident: false,
  };
}

function stripMealLeadIn(text, mealType, quickAction) {
  let working = text;

  if (quickAction && mealTypeAliases[quickAction] === mealType) {
    working = working.replace(/^for\s+\w+[:,\-]?\s*/i, '');
  }

  for (const pattern of leadInPatterns) {
    working = working.replace(pattern, '');
  }

  return working.trim();
}

function splitIntoItemPhrases(text) {
  const normalized = text
    .replace(/\s+(?:and|plus|with)\s+/gi, '|')
    .replace(/[，、；;]/g, '|')
    .replace(/,/g, '|')
    .replace(/\s+以及\s+/g, '|')
    .replace(/\s+和\s+/g, '|');

  return normalized
    .split('|')
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseItemPhrase(phrase) {
  const cleanedPhrase = phrase
    .replace(/^(?:she|he|they|baby)\s+(?:had|ate|drank|took)\s+/i, '')
    .replace(/^(?:had|ate|drank|took)\s+/i, '')
    .trim();

  if (!cleanedPhrase) {
    return null;
  }

  const amountMatch = cleanedPhrase.match(amountPrefixPattern);
  const amountText = amountMatch ? cleanupAmountText(amountMatch[1]) : null;
  let foodName = amountMatch ? cleanedPhrase.slice(amountMatch[0].length) : cleanedPhrase;

  foodName = foodName
    .replace(/^(?:of\s+)/i, '')
    .replace(/^(?:some\s+)/i, '')
    .replace(/^(?:a\s+little\s+bit\s+of\s+)/i, '')
    .replace(/[.。]+$/g, '')
    .trim();

  if (!foodName && amountText) {
    foodName = inferImplicitFoodName(amountText);
  }

  if (!foodName) {
    return null;
  }

  return {
    foodName,
    amountText,
    confidenceLabel: amountText ? 'medium' : 'low',
  };
}

function cleanupAmountText(amountText) {
  return amountText
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s+of$/i, '')
    .trim();
}

function inferImplicitFoodName(amountText) {
  const normalized = amountText.toLowerCase();

  if (normalized.includes('ml') || normalized.includes('oz') || normalized.includes('bottle')) {
    return 'milk';
  }

  return '';
}

function buildSummary({ mealType, items, followUpQuestion }) {
  const mealLabel = mealType === 'unknown' ? 'meal' : mealType;

  if (items.length === 0) {
    return `Captured a ${mealLabel} note, but the foods still need clarification.`;
  }

  const names = items.map((item) => item.foodName);
  const listedFoods = joinHumanList(names);
  const suffix = followUpQuestion ? ' More detail is still needed before this becomes a final record.' : ' Ready for draft record generation after confirmation.';

  return `Parsed a ${mealLabel} note with ${listedFoods}.${suffix}`;
}

function joinHumanList(items) {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const mealTypeAliases = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
  milk: 'milk',
};

const mealTypeKeywordPatterns = {
  breakfast: [/\bbreakfast\b/i, /早餐/],
  lunch: [/\blunch\b/i, /午餐/],
  dinner: [/\bdinner\b/i, /晚餐/],
  snack: [/\bsnack\b/i, /加餐/, /点心/],
  milk: [/\bformula\b/i, /\bmilk\b/i, /\bbottle\b/i, /奶/, /母乳/, /配方/],
  supplement: [/\bvitamin\b/i, /\bsupplement\b/i, /补充剂/, /维生素/],
};

const leadInPatterns = [
  /^(?:for\s+)?(?:breakfast|lunch|dinner|snack)[:,\-]?\s*/i,
  /^(?:for\s+)?(?:milk|formula|bottle)[:,\-]?\s*/i,
  /^(?:she|he|they|baby)\s+(?:had|ate|drank|took)\s+/i,
  /^(?:had|ate|drank|took)\s+/i,
  /^(?:today|this\s+morning|this\s+afternoon|tonight)[:,\-]?\s*/i,
];

const amountPrefixPattern = new RegExp(
  '^(' +
    '(?:about|around|roughly)?\\s*' +
    '(?:\\d+(?:\\/\\d+)?|one(?:-[a-z]+)?|two|three|four|five|six|seven|eight|nine|ten|half|quarter|a|an)' +
    '(?:\\s+(?:small|medium|large|tiny))?' +
    '(?:\\s+(?:a|an))?' +
    '(?:\\s+(?:piece|pieces|slice|slices|bowl|bowls|cup|cups|oz|ounce|ounces|ml|g|gram|grams|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|bottle|bottles|serving|servings|packet|packets|strip|strips|chunk|chunks))+' +
    '(?:\\s+of)?' +
  ')\\s+',
  'i',
);

module.exports = {
  parseTextMealInput,
};
