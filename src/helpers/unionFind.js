/**
 * This class implements a union find algorithm that is used to
 *    quickly classify groups of connected cells.
 */

export default class unionFind {
  constructor(N, options) {
    this.id = [];
    this.size = [];
    this.pathCompression = true;

    // Get options
    if (options) {
      const { pathCompression } = options;
      if (pathCompression === false) {
        this.pathCompression = false;
      }
    }

    // Sanitize inputs
    N = Math.floor(N);
    if (typeof N !== "number" || N < 1) {
      console.log("Uh-oh");
    }

    // Make each item its own root, and set size to 1
    for (let i = 0; i < N; i++) {
      this.id[i] = i;
      this.size[i] = 1;
    }
  }
  /**
   * *find()*
   *
   * Determine if two items have the same root
   * @param {number} p
   * @param {number} q
   */
  find(p, q) {
    return this.root(p) === this.root(q);
  }

  /**
   * *union()*
   *
   * Join the roots of the trees containing items p and q
   * @param {number} p
   * @param {number} q
   */
  union(p, q) {
    let root_p = this.root(p);
    let root_q = this.root(q);
    if (root_p === root_q) {
      return;
    }
    if (this.size[root_p] < this.size[root_q]) {
      this.id[root_p] = root_q;
      this.size[root_q] += this.size[root_p];
    } else {
      this.id[root_q] = root_p;
      this.size[root_p] += this.size[root_q];
    }
  }

  /**
   * *root()*
   *
   * Find the root of the tree containing item i
   * @param {number} i
   */
  root(i) {
    if (this.pathCompression) {
      while (i !== this.id[i]) {
        this.id[i] = this.id[this.id[i]];
        i = this.id[i];
      }
    } else {
      while (i !== this.id[i]) {
        i = this.id[i];
      }
    }
    return i;
  }

  segmentSize(i) {
    return this.size[i];
  }

  roots() {
    return Array.from(new Set(this.id));
  }
}
