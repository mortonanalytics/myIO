export function linearRegression(data, yVar, xVar) {
  const x = data.map(function(d) {
    return d[xVar];
  });
  const y = data.map(function(d) {
    return d[yVar];
  });

  const lr = {};
  const n = y.length;
  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_xx = 0;
  let sum_yy = 0;

  for (let i = 0; i < y.length; i++) {
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += x[i] * y[i];
    sum_xx += x[i] * x[i];
    sum_yy += y[i] * y[i];
  }

  lr.slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
  lr.intercept = (sum_y - lr.slope * sum_x) / n;
  lr.r2 = Math.pow(
    (n * sum_xy - sum_x * sum_y) /
      Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)),
    2
  );
  lr.fn = function(xValue) {
    return this.slope * xValue + this.intercept;
  };

  return lr;
}

export function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
