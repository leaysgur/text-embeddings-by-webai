/** @type {(x: number[], y: number[]) => number} */
const dot = (x, y) => {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * y[i];

  return sum;
};

/** @type {(arr: number[]) => number} */
const l2norm = (arr) => {
  let s = 1;
  let t = 0;
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    const abs = val < 0 ? -val : val;
    if (abs > 0) {
      if (abs > t) {
        const r = t / val;
        s = 1 + s * r * r;
        t = abs;
      } else {
        const r = val / t;
        s = s + r * r;
      }
    }
  }

  return t * Math.sqrt(s);
};

/** @type {(a: number[], b: number[]) => number} */
export const cosineSimilarity = (a, b) => dot(a, b) / (l2norm(a) * l2norm(b));
