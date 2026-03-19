const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], history: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function save(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const store = {
  users: {
    findByEmail: (email) => {
      const { users } = load();
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    findById: (id) => {
      const { users } = load();
      return users.find((u) => u.id === id) || null;
    },
    create: ({ name, email, passwordHash }) => {
      const data = load();
      const user = {
        id: crypto.randomUUID(),
        name,
        email: email.toLowerCase(),
        passwordHash,
        createdAt: Date.now(),
      };
      data.users.push(user);
      save(data);
      return user;
    },
  },

  history: {
    findByUserId: (userId) => {
      const { history } = load();
      return history
        .filter((h) => h.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    add: (record) => {
      const data = load();
      data.history.unshift(record);
      if (data.history.length > 500) {
        data.history = data.history.slice(0, 500);
      }
      save(data);
      return record;
    },
    clearByUserId: (userId) => {
      const data = load();
      data.history = data.history.filter((h) => h.userId !== userId);
      save(data);
    },
  },
};

module.exports = store;
