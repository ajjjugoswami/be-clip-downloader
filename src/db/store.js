/**
 * Unified data-access layer.
 *
 * All methods are async. Controllers already use async/await, so no
 * other files need changing — they just need to `await` these calls.
 */
const User    = require("./models/User");
const History = require("./models/History");

const store = {
  users: {
    findByEmail: (email) =>
      User.findOne({ email: email.toLowerCase().trim() }).lean(),

    findById: (id) =>
      User.findById(id).lean(),

    create: ({ name, email, passwordHash }) =>
      User.create({ name, email, passwordHash }),
  },

  history: {
    findByUserId: (userId) =>
      History.find({ userId }).sort({ timestamp: -1 }).limit(500).lean(),

    add: (record) => History.create(record),

    clearByUserId: (userId) => History.deleteMany({ userId }),
  },
};

module.exports = store;
