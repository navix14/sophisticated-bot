function extractString(str, left, right) {
  const indexLeft = str.indexOf(left);
  const indexRight = str.lastIndexOf(right);

  return str.substring(indexLeft + 1, indexRight);
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
  extractString,
  delay,
};
