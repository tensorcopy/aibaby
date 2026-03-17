let prismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

module.exports = {
  getPrismaClient,
};
