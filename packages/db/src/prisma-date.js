function toPrismaDateOnly(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('A YYYY-MM-DD date string is required');
  }

  return new Date(`${value.trim()}T00:00:00.000Z`);
}

function fromPrismaDateOnly(value) {
  const date = normalizeDate(value);
  return date.toISOString().slice(0, 10);
}

function toPrismaDateTime(value) {
  if (value == null) {
    return value;
  }

  return normalizeDate(value);
}

function fromPrismaDateTime(value) {
  if (value == null) {
    return value;
  }

  return normalizeDate(value).toISOString();
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('A valid date value is required');
  }

  return date;
}

module.exports = {
  fromPrismaDateOnly,
  fromPrismaDateTime,
  toPrismaDateOnly,
  toPrismaDateTime,
};
