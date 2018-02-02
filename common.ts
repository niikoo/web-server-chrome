import { WebApplication, BaseHandler, FileSystem } from './webapp';
import { cloneDeep } from 'lodash';
import { EntryCache } from "./entrycache";
import { TextDecoder, EncoderBase } from "./encoding";

export class WSC {
  DEBUG = false
  VERBOSE = false
  encoderBase = new EncoderBase();

  entryCache: EntryCache = new EntryCache();
  entryFileCache: EntryCache = new EntryCache();
  WebApplication = new WebApplication(this);
  BaseHandler = new BaseHandler(this, this.WebApplication);

  getchromeversion() {
    let version;
    var match = navigator.userAgent.match(/Chrome\/([\d]+)/)
    if (match) {
      version = parseInt(match[1]);
    }
    return version;
  }

  maybePromise = function (maybePromiseObj, resolveFn, ctx) {
    if (maybePromiseObj && maybePromiseObj.then) {
      return maybePromiseObj.then(function (ret) { return resolveFn.call(ctx, ret); });
    } else {
      return resolveFn.call(ctx, maybePromiseObj);
    }
  }
  strformat = function (s) {
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    return s.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
  }
  parse_header = function (line) {
    debugger;
  }

  encode_header = function (name, d) {
    if (!d) {
      return name
    }
    var out = [name]
    for (var k in d) {
      var v = d[k]
      if (!v) {
        out.push(k)
      } else {
        // quote?
        this.outpush(k + '=' + v)
      }
    }
    return out.join('; ')
  }

  // common stuff

  recursiveGetEntry(filesystem, path, callback, allowFolderCreation) {
    var useCache = false
    // XXX duplication with jstorrent
    var cacheKey = filesystem.filesystem.name +
      filesystem.fullPath +
      '/' + path.join('/')
    var inCache = this.entryCache.get(cacheKey)
    if (useCache && inCache) {
      //console.log('cache hit');
      callback(inCache); return
    }

    var state = { e: filesystem, path: null }

    function recurse(e) {
      if (path.length == 0) {
        if (e.name == 'TypeMismatchError') {
          state.e.getDirectory(state.path, { create: false }, recurse, recurse)
        } else if (e.isFile) {
          if (useCache) this.entryCache.set(cacheKey, e)
          callback(e)
        } else if (e.isDirectory) {
          //console.log(filesystem,path,cacheKey,state)
          if (useCache) this.entryCache.set(cacheKey, e)
          callback(e)
        } else {
          callback({ error: 'path not found' })
        }
      } else if (e.isDirectory) {
        if (path.length > 1) {
          // this is not calling error callback, simply timing out!!!
          e.getDirectory(path.shift(), { create: !!allowFolderCreation }, recurse, recurse)
        } else {
          state.e = e;
          state.path = cloneDeep(path);
          e.getFile(path.shift(), { create: false }, recurse, recurse)
        }
      } else if (e.name == 'NotFoundError') {
        callback({ error: e.name, message: e.message })
      } else {
        callback({ error: 'file exists' })
      }
    }
    recurse(filesystem)
  }

  parseHeaders(lines) {
    var headers = {}
    var line
    // TODO - multi line headers?
    for (var i = 0; i < lines.length; i++) {
      line = lines[i]
      var j = line.indexOf(':')
      headers[line.slice(0, j).toLowerCase()] = line.slice(j + 1, line.length).trim()
    }
    return headers
  }
  ui82str(arr, startOffset) {
    console.assert(arr)
    if (!startOffset) { startOffset = 0 }
    var length = arr.length - startOffset // XXX a few random exceptions here
    var str = ""
    for (var i = 0; i < length; i++) {
      str += String.fromCharCode(arr[i + startOffset])
    }
    return str
  }
  ui82arr(arr, startOffset) {
    if (!startOffset) { startOffset = 0 }
    var length = arr.length - startOffset
    var outarr = []
    for (var i = 0; i < length; i++) {
      outarr.push(arr[i + startOffset])
    }
    return outarr
  }
  str2ab(s) {
    var arr = []
    for (var i = 0; i < s.length; i++) {
      arr.push(s.charCodeAt(i))
    }
    return new Uint8Array(arr).buffer
  }
  stringToUint8Array = function (string) {
    var encoder = new TextEncoder()
    return encoder.encode(string)
  };

  arrayBufferToString = function (buffer) {
    var decoder = new TextDecoder(this.encoderBase, undefined, {});
    return decoder.decode(buffer, {})
  };
  /*
      var logToScreen = function(log) {
          logger.textContent += log + "\n";
      }

  */

  parseUri(str) {
    return new URL(str) // can throw exception, watch out!
  }

}
