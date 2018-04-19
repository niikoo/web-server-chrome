import { WSCOptions } from './options';
import { HTTPRequest } from './request';
import { DirectoryEntryHandler, RequestHandler } from './handlers';
import { WebApplication, BaseHandler, FileSystem } from './webapp';
import { clone, isArray, isObject, isNil, isString } from 'lodash';
import { EntryCache } from './entrycache';
export { FileSystem };

declare let TextEncoder: any;
declare let TextDecoder: any;

export class WSC {
  static DEBUG = false;
  static VERBOSE = false;
  static peerSockMap = {};
  static get app() {
    return {
      opts: this.opts
    };
  }
  static opts = new WSCOptions();

  static template_data;

  static entryCache: EntryCache = new EntryCache();
  static entryFileCache: EntryCache = new EntryCache();
  static WebApplication = WebApplication;
  static DirectoryEntryHandler = DirectoryEntryHandler;
  static FileSystem = FileSystem;

  static prepareHandler(handler, ...params) {
    return () => new handler(...params);
  }
  static prepareTypedHandler<T>(handler, ...params): () => T {
    return () => new handler(...params) as T;
  }

  static outpush(arg0: any): any {
    console.error('Method not implemented; received:', arg0);
  }

  static getchromeversion() {
    let version;
    let match = navigator.userAgent.match(/Chrome\/([\d]+)/)
    if (match) {
      version = parseInt(match[1], 10);
    }
    return version;
  }

  static maybePromise(maybePromiseObj, resolveFn, ctx) {
    if (maybePromiseObj && maybePromiseObj.then) {
      return maybePromiseObj.then(function (ret) { return resolveFn.call(ctx, ret); });
    } else {
      return resolveFn.call(ctx, maybePromiseObj);
    }
  }
  static strformat(s) {
    let args = Array.prototype.slice.call(arguments, 1, arguments.length);
    return s.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] !== 'undefined'
        ? args[number]
        : match;
    });
  }
  static parse_header(line) {
    console.warn('Function parse_header not implemented yet. Tried to parse: ', line);
  }

  static encode_header(name, data) {
    if (!data) {
      return name;
    }
    let out = [name]
    for (let key of Object.keys(data)) {
      let val = data[key];
      if (!val) {
        out.push(key);
      } else {
        // quote?
        WSC.outpush(key + '=' + val);
      }
    }
    return out.join('; ');
  }

  // common stuff

  static recursiveGetEntry(filesystem: DirectoryEntry, path, callback, allowFolderCreation) {
    if (WSC.DEBUG) {
      console.log('Getting: ' + path);
    }
    let useCache = false;
    // XXX duplication with jstorrent
    let cacheKey = filesystem.filesystem.name +
      filesystem.fullPath +
      '/' + path.join('/')
    let inCache = WSC.entryCache.get(cacheKey)
    if (useCache && inCache) {
      //console.log('cache hit');
      callback(inCache); return
    }
    let state = { entry: <DirectoryEntry | FileEntry>filesystem, path: null };
    path = path || [''];

    let data = {
      path,
      callback,
      useCache,
      allowFolderCreation,
      state,
      cacheKey,
      fs: filesystem
    };


    try {
      this.recurse(filesystem, data);
    } catch (ex) {
      console.error('Recursion failed');
      console.log('Recursion exception info', ex);
    }
  }

  static onRecusionError(error, data) {
    // console.log('onRecursionError', error, 'data', data, '');
    let matches = (!isNil(data.cacheKey) && isString(data.cacheKey))
      ? data.cacheKey.match(/^(.*\/)([^\/]*)$/i)
      : undefined;
    if (matches) {
      if (matches[2]) {
        let match: string = matches[2];
        if (match.includes('.')) {
          // File
          data.callback(null); // 404
          return;
        } else {
          // Directory -> serve index file if modrewrite enabled
          if (WSC.opts.optRewriteOnDirectoryNotFound) {
            data.path = WSC.opts.optRewriteOnDirectoryNotFoundTo;
            this.recursiveGetEntry(data.fs, [data.path], data.callback, false);
            return;
          } else {
            data.callback(null); // 404
            return;
          }
        }

      }
    }
    data.callback(null);
  }

  static recurse(entry: DirectoryEntry | FileEntry, data: { path, callback, useCache, allowFolderCreation, state, cacheKey, fs }) {
    data.allowFolderCreation = false; // Force off
    if (data.path.length === 0) {
      if (entry.name === 'TypeMismatchError') {
        (<DirectoryEntry>data.state.entry).getDirectory(data.state.path, { create: false }, (newEntry) => WSC.recurse(newEntry, data), (errorMsg) => WSC.onRecusionError({ msg: errorMsg, pathState: data.state.path, type: 'dir', path: data.path }, data));
      } else if (entry.isFile) {
        if (data.useCache) { this.entryCache.set(data.cacheKey, entry) };
        data.callback(entry)
      } else if (entry.isDirectory) {
        //console.log(filesystem,path,cacheKey,state)
        if (data.useCache) { this.entryCache.set(data.cacheKey, entry) };
        data.callback(entry)
      } else {
        data.callback({ error: 'path not found' })
      }
    } else if (entry.isDirectory) {
      if (data.path.length > 1) {
        // this is not calling error callback, simply timing out!!!
        (<DirectoryEntry>entry).getDirectory(data.path.shift(), { create: data.allowFolderCreation }, (newEntry) => WSC.recurse(newEntry, data), (errorMsg) => WSC.onRecusionError({ msg: errorMsg, pathState: data.state.path, type: 'dir', path: data.path }, data));
      } else {
        data.state.entry = entry;
        data.state.path = clone(data.path).join('/');
        (<DirectoryEntry>entry).getFile(data.path.shift(), { create: false }, (newEntry) => WSC.recurse(newEntry, data), (errorMsg) => WSC.onRecusionError({ msg: errorMsg, pathState: data.state.path, type: 'file', path: data.path }, data));
      }
    } else if (entry.name === 'NotFoundError') {
      data.callback({ error: entry.name, message: entry['message'] });
    } else {
      data.callback({ error: 'file exists' });
    }
  }

  static parseHeaders(lines) {
    let headers = {}
    let line
    // TODO - multi line headers?
    for (let i = 0; i < lines.length; i++) {
      line = lines[i]
      let j = line.indexOf(':')
      headers[line.slice(0, j).toLowerCase()] = line.slice(j + 1, line.length).trim()
    }
    return headers
  }
  static ui82str(arr, startOffset) {
    if (!startOffset) { startOffset = 0 }
    let length = arr.length - startOffset // XXX a few random exceptions here
    let str = ''
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(arr[i + startOffset])
    }
    return str
  }
  static ui82arr(arr, startOffset) {
    if (!startOffset) { startOffset = 0 }
    let length = arr.length - startOffset
    let outarr = []
    for (let i = 0; i < length; i++) {
      outarr.push(arr[i + startOffset])
    }
    return outarr
  }
  static str2ab(s) {
    let arr = []
    for (let i = 0; i < s.length; i++) {
      arr.push(s.charCodeAt(i))
    }
    return new Uint8Array(arr).buffer
  }
  static stringToUint8Array = function (string) {
    let encoder = new TextEncoder(this.encoderBase)
    return encoder.encode(string, null)
  };

  static arrayBufferToString = function (buffer) {
    let decoder = new TextDecoder();
    return decoder.decode(buffer, null)
  };
  /*
      let logToScreen = function(log) {
          logger.textContent += log + "\n";
      }

  */

  static parseUri(str) {
    return new URL(str) // can throw exception, watch out!
  }

}

export interface RecursionData {
  path: string[];
  state: { entry: DirectoryEntry | FileEntry, path: string };
  useCache: boolean;
  cacheKey: string;
  callback: (entry: DirectoryEntry | FileEntry) => void;
  allowFolderCreation: boolean;
}
