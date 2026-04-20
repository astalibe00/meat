export function parseWeightKg(value?: string) {
  if (!value) {
    return 1;
  }

  const matches = value.match(/(\d+(?:\.\d+)?)/g);
  if (!matches?.length) {
    return 1;
  }

  const numeric = Number(matches[matches.length - 1]);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

export function formatWeightKg(value: number) {
  return `${Number(value.toFixed(2)).toString().replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")} kg`;
}

export function getLineWeightKg(weightOption?: string, fallbackWeight?: string) {
  return parseWeightKg(weightOption ?? fallbackWeight);
}

export function getProductMaxUnits(stockKg: number, weightOption?: string, fallbackWeight?: string) {
  const unitKg = getLineWeightKg(weightOption, fallbackWeight);
  return Math.max(0, Math.floor(stockKg / unitKg));
}
