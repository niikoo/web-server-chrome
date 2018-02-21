export class EntryCache {
  cache = {};

  clearKey(skey) {
    let todelete = []
    for (let key in this.cache) {
      if (key.startsWith(skey)) {
        todelete.push(key)
      }
    }
    for (let i = 0; i < todelete.length; i++) {
      delete this.cache[todelete[i]]
    }
  }

  clear() {
    this.cache = {}
  }

  unset(k) {
    delete this.cache[k]
  }

  set(k, v) {
    this.cache[k] = { v: v };
    // Copy the last-modified date for later verification.
    if (v.lastModifiedDate) {
      this.cache[k].lastModifiedDate = v.lastModifiedDate;
    }
  }

  get(k) {
    if (this.cache[k]) {
      let v = this.cache[k].v;
      // If the file was modified, then the file object's last-modified date
      // will be different (greater than) the copied date. In this case the
      // file object will have stale contents so we must invalidate the cache.
      // This happens when reading files from Google Drive.
      if (v.lastModifiedDate && this.cache[k].lastModifiedDate < v.lastModifiedDate) {
        console.log('invalidate file by lastModifiedDate');
        this.unset(k);
        return null;
      } else {
        return v;
      }
    }
  }
}
