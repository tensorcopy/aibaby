const { resolveOwnerUserIdFromRequest } = require('../baby-profile/auth');
const {
  generateAgeStageReminder,
  listAgeStageReminders,
} = require('./local-store');

let routeDependencies = createDefaultRouteDependencies();

function getReminderRouteDependencies() {
  return routeDependencies;
}

function setReminderRouteDependenciesForTest(overrides) {
  routeDependencies = {
    ...createDefaultRouteDependencies(),
    ...overrides,
  };
}

function resetReminderRouteDependencies() {
  routeDependencies = createDefaultRouteDependencies();
}

function createDefaultRouteDependencies() {
  return {
    async getOwnerUserId(request) {
      return resolveOwnerUserIdFromRequest(request);
    },
    generateAgeStageReminder,
    listAgeStageReminders,
  };
}

module.exports = {
  getReminderRouteDependencies,
  resetReminderRouteDependencies,
  setReminderRouteDependenciesForTest,
};
