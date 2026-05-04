function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = {
  formatDate,
};
