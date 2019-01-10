// Prisma

//  Required for Node.js
//  This file connects to the remote Prisma DB
//  Enables to query with JS
const { Prisma } = require('prisma-binding');

const db = new Prisma({
  typeDefs: 'src/generated/prisma.graphql',
  endpoint: process.env.PRISMA_ENDPOINT,
  secret: process.env.PRISMA_SECRET,
  debug: false,
})

module.exports = db;