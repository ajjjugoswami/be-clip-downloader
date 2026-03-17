exports.check = (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
};
