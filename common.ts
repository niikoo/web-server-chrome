import { HTTPRequest } from './request';
import { DirectoryEntryHandler, RequestHandler } from './handlers';
import { WebApplication, BaseHandler, FileSystem } from './webapp';
import { clone } from 'lodash';
import { EntryCache } from "./entrycache";

declare var TextEncoder: any;
declare var TextDecoder: any;

export class WSC {
  static DEBUG = true;
  static VERBOSE = false;
  static peerSockMap = {};
  static app = {
    opts: {
      optStatic: null,
      optRenderIndex: null,
      optAllInterfaces: null,
      optModRewriteEnable: false,
      optModRewriteNegate: false,
      optModRewriteRegexp: false,
      optModRewriteTo: null,
      optPreventSleep: null,
      optStopIdleServer: null,
      optDoPortMapping: null,
      optBackground: null,
      optCORS: null,
      optIPV6: null,
      host: null,
      auth: null
    }
  }

  static template_data;

  static entryCache: EntryCache = new EntryCache();
  static entryFileCache: EntryCache = new EntryCache();
  static WebApplication = WebApplication;
  static DirectoryEntryHandler = DirectoryEntryHandler;
  static FileSystem: any;

  static prepareHandler(handler, ...params) {
    return () => new handler(...params);
  }

  static outpush(arg0: any): any {
    throw new Error("Method not implemented.");
  }

  static getchromeversion() {
    let version;
    var match = navigator.userAgent.match(/Chrome\/([\d]+)/)
    if (match) {
      version = parseInt(match[1]);
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
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    return s.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
  }
  static parse_header(line) {
    debugger;
  }

  static encode_header(name, d) {
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
        WSC.outpush(k + '=' + v)
      }
    }
    return out.join('; ')
  }

  // common stuff

  static recursiveGetEntry(filesystem, path, callback, allowFolderCreation) {
    var useCache = false
    // XXX duplication with jstorrent
    var cacheKey = filesystem.filesystem.name +
      filesystem.fullPath +
      '/' + path.join('/')
    var inCache = WSC.entryCache.get(cacheKey)
    if (useCache && inCache) {
      //console.log('cache hit');
      callback(inCache); return
    }

    var state = { e: filesystem, path: null }

    let recurse = (e) => {
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
          state.path = clone(path);
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

  static parseHeaders(lines) {
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
  static ui82str(arr, startOffset) {
    console.assert(arr)
    if (!startOffset) { startOffset = 0 }
    var length = arr.length - startOffset // XXX a few random exceptions here
    var str = ""
    for (var i = 0; i < length; i++) {
      str += String.fromCharCode(arr[i + startOffset])
    }
    return str
  }
  static ui82arr(arr, startOffset) {
    if (!startOffset) { startOffset = 0 }
    var length = arr.length - startOffset
    var outarr = []
    for (var i = 0; i < length; i++) {
      outarr.push(arr[i + startOffset])
    }
    return outarr
  }
  static str2ab(s) {
    var arr = []
    for (var i = 0; i < s.length; i++) {
      arr.push(s.charCodeAt(i))
    }
    return new Uint8Array(arr).buffer
  }
  static stringToUint8Array = function (string) {
    var encoder = new TextEncoder(this.encoderBase)
    return encoder.encode(string, null)
  };

  static arrayBufferToString = function (buffer) {
    var decoder = new TextDecoder();
    return decoder.decode(buffer, null)
  };
  /*
      var logToScreen = function(log) {
          logger.textContent += log + "\n";
      }

  */

  static parseUri(str) {
    return new URL(str) // can throw exception, watch out!
  }

}

