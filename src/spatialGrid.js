/**
 * Griglia Spaziale Uniforme (Spatial Hash Grid) & helper O(1) Swap-and-Pop
 * per mantenere 60 FPS stabili con 200+ entità senza allocazioni per-frame.
 */

export class SpatialHashGrid {
  constructor(cellSize = 112) {
    this.cellSize = Math.max(16, cellSize);
    this.invCellSize = 1 / this.cellSize;
    this.buckets = new Map();
    this.pool = [];
  }

  _hashCell(cx, cy) {
    return ((cx + 32768) * 65536) + (cy + 32768);
  }

  _cellCoord(val) {
    return Math.floor(val * this.invCellSize);
  }

  _allocBucket() {
    return this.pool.length > 0 ? this.pool.pop() : [];
  }

  insert(item, x, y) {
    if (!item) return;
    if (item._gridKey !== undefined && item._gridKey !== null) {
      this.remove(item);
    }
    const cx = this._cellCoord(x);
    const cy = this._cellCoord(y);
    const key = this._hashCell(cx, cy);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = this._allocBucket();
      this.buckets.set(key, bucket);
    }
    item._gridKey = key;
    item._gridIdx = bucket.length;
    bucket.push(item);
  }

  remove(item) {
    if (!item) return;
    const key = item._gridKey;
    if (key === undefined || key === null) return;
    const bucket = this.buckets.get(key);
    if (bucket) {
      const idx = item._gridIdx;
      if (idx >= 0 && idx < bucket.length && bucket[idx] === item) {
        const last = bucket.pop();
        if (idx < bucket.length && last) {
          bucket[idx] = last;
          last._gridIdx = idx;
        }
      }
      if (bucket.length === 0) {
        this.buckets.delete(key);
        this.pool.push(bucket);
      }
    }
    item._gridKey = null;
    item._gridIdx = -1;
  }

  update(item, x, y) {
    if (!item) return;
    const cx = this._cellCoord(x);
    const cy = this._cellCoord(y);
    const nextKey = this._hashCell(cx, cy);
    if (item._gridKey === nextKey) return;
    this.insert(item, x, y);
  }

  queryRadius(x, y, radius, outArray = []) {
    outArray.length = 0;
    const minCx = this._cellCoord(x - radius);
    const maxCx = this._cellCoord(x + radius);
    const minCy = this._cellCoord(y - radius);
    const maxCy = this._cellCoord(y + radius);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this._hashCell(cx, cy);
        const bucket = this.buckets.get(key);
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          outArray.push(bucket[i]);
        }
      }
    }
    return outArray;
  }

  clear() {
    for (const bucket of this.buckets.values()) {
      for (let i = 0; i < bucket.length; i++) {
        bucket[i]._gridKey = null;
        bucket[i]._gridIdx = -1;
      }
      bucket.length = 0;
      this.pool.push(bucket);
    }
    this.buckets.clear();
  }
}

/**
 * Inserisce un elemento in un array di pool attivo tenendo traccia dell'indice O(1).
 */
export function swapPopPush(arr, item, idxProp = '_poolIdx') {
  if (!item) return;
  const existingIdx = item[idxProp];
  if (existingIdx >= 0 && existingIdx < arr.length && arr[existingIdx] === item) {
    return;
  }
  item[idxProp] = arr.length;
  arr.push(item);
}

/**
 * Rimuove un elemento in O(1) tramite swap con l'ultimo elemento dell'array.
 */
export function swapPopRemove(arr, item, idxProp = '_poolIdx') {
  if (!item || arr.length === 0) return false;
  let idx = item[idxProp];
  if (idx === undefined || idx < 0 || idx >= arr.length || arr[idx] !== item) {
    idx = arr.indexOf(item);
    if (idx === -1) return false;
  }
  const last = arr.pop();
  if (idx < arr.length && last) {
    arr[idx] = last;
    last[idxProp] = idx;
  }
  item[idxProp] = -1;
  return true;
}
