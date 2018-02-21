/// <reference path='./../../node_modules/@types/chrome/index.d.ts' />
/// <reference path='./../../node_modules/@types/chrome/chrome-app.d.ts' />
/// <reference path='./../../node_modules/@types/chrome/chrome-webview.d.ts' />
import { WSCOptions } from './options';
import { Destructor } from './destructor';
import { HttpRequest } from '@angular/common/http';
import { isNil, isFunction } from 'lodash';
import { WSC } from './common';
import { HTTPRequest } from './request';
import { MIMETYPES } from './mime';
import { UPNP } from './upnp';
import { IOStream } from './stream';
import { DirectoryEntryHandler, RequestHandler, DefaultHandler } from './handlers';
import { HTTPConnection } from './connection';
import { HTTPRESPONSES } from './httplib';

declare let TextEncoder: any;

export class WebApplication implements Destructor {
  id: string;
  get opts(): WSCOptions {
    return WSC.app.opts;
  }
  set opts(opts: WSCOptions) {
    WSC.app.opts = opts;
  }
  handlers = [];
  sockInfo;
  lasterr;
  stopped;
  starting;
  start_callback;
  _stop_callback;
  started;
  fs;
  streams;
  upnp: UPNP;
  sockets = chrome.sockets;
  host = '127.0.0.1';
  port = 8080;
  _idle_timeout_id = undefined;
  on_status_change = undefined;
  interfaces = [];
  interface_retry_count = 0;
  urls = [];
  extra_urls = undefined;
  acceptQueue = undefined;
  handlersMatch: [RegExp, any][] = [];

  constructor (opts: WSCOptions) {
    // need to support creating multiple WebApplication...
    if (WSC.DEBUG) {
      console.log('initialize webapp with opts', opts)
    }
    if (opts.optDebug) {
      WSC.DEBUG = true;
    }
    if (opts.optVerbose) {
      WSC.DEBUG = true;
      WSC.VERBOSE = true;
    }
    WSC.FileSystem = FileSystem;
    this.opts = opts || new WSCOptions();
    this.id = Math.random().toString();
    this.handlers = opts.handlers || [];
    this.sockInfo = null;
    this.lasterr = null;
    this.stopped = false;
    this.starting = false;
    this.start_callback = null;
    this._stop_callback = null;
    this.started = false;
    this.fs = null;
    this.streams = {};
    this.upnp = null;
    this.init_handlers();
    if (opts.retainStr) {
      // special option to setup a handler
      chrome.fileSystem.restoreEntry(opts.retainStr, (entry) => {
        if (entry) {
          this.on_entry(entry)
        } else {
          this.error('error setting up retained entry')
        }
      });
    }
    if (opts.entry) {
      this.on_entry(opts.entry)
    }
    this.host = this.get_host();
    this.port = opts.port || 8887;

    this._idle_timeout_id = null;

    this.on_status_change = null;
    this.interfaces = [];
    this.interface_retry_count = 0;
    this.urls = [];
    this.extra_urls = [];
    if (this.port > 65535 || this.port < 1024) {
      let err = 'bad port: ' + this.port
      this.error(err);
    }
    this.acceptQueue = []
  }

  onDestroy() {
    this.sockets.tcpServer.onAcceptError.removeListener(() => { });
    this.sockets.tcpServer.onAccept.removeListener(() => { });
    this.upnp.onDestroy();
  }

  processAcceptQueue() {
    console.log('process accept queue len', this.acceptQueue.length)
    while (this.acceptQueue.length > 0) {
      let sockInfo = this.acceptQueue.shift()
      this.onAccept(sockInfo)
    }
  }
  updateOption(k, v) {
    this.opts[k] = v
    switch (k) {
      case 'optDoPortMapping':
        if (!v) {
          if (this.upnp) {
            this.upnp.removeMapping(this.port, 'TCP', (result) => {
              console.log('result of removing port mapping', result)
              this.extra_urls = []
              this.upnp = null
              //this.init_urls() // misleading because active connections are not terminated
              //this.change()
            });
          }
        }
        break;
    }
  }
  get_info() {
    return {
      interfaces: this.interfaces,
      urls: this.urls,
      opts: this.opts,
      started: this.started,
      starting: this.starting,
      stopped: this.stopped,
      lasterr: this.lasterr
    }
  }
  updatedSleepSetting() {
    if (!this.started) {
      chrome.power.releaseKeepAwake()
      return
    }
    if (this.opts.optPreventSleep) {
      console.log('requesting keep awake system')
      chrome.power.requestKeepAwake(chrome.power['Level'].SYSTEM)
    } else {
      console.log('releasing keep awake system')
      chrome.power.releaseKeepAwake()
    }
  }
  on_entry(entry) {
    let fs = new FileSystem(entry)
    this.fs = fs;
    this.add_handler(['.*', WSC.prepareHandler(DirectoryEntryHandler, fs, null)])
    this.init_handlers();
    if (WSC.DEBUG) {
      console.log('setup handler for entry', entry)
    }
    if (this.opts.optBackground) {
      this.start(() => { });
    }
  }
  get_host() {
    let host
    if (WSC.getchromeversion() >= 44 && this.opts.optAllInterfaces) {
      if (this.opts.optIPV6) {
        host = this.opts.host || '::'
      } else {
        host = this.opts.host || '0.0.0.0'
      }
    } else {
      host = this.opts.host || '127.0.0.1'
    }
    return host
  }
  add_handler(handler) {
    this.handlers.push(handler)
  }
  init_handlers() {
    this.handlersMatch = []
    for (let handler of this.handlers) {
      this.handlersMatch.push([new RegExp(handler[0]), handler[1]]);
    }
    this.change();
  }
  change() {
    if (this.on_status_change) { this.on_status_change() }
  }
  start_success(data) {
    if (this.opts.optPreventSleep) {
      console.log('requesting keep awake system')
      chrome.power.requestKeepAwake(chrome.power['level'].system)
    }
    let callback = this.start_callback
    this.start_callback = null
    this.registerIdle()
    if (callback && isFunction(callback)) {
      callback(this.get_info())
    }
    this.change()
  }
  error(data) {
    if (this.opts.optPreventSleep) {
      chrome.power.releaseKeepAwake()
    }
    this.interface_retry_count = 0
    let callback = this.start_callback
    this.starting = false
    this.stopped = true
    this.start_callback = null
    console.error('webapp error:', data)
    this.lasterr = data
    this.change()
    if (callback) {
      callback({ error: data })
    }
  }
  stop(reason, callback) {
    this.lasterr = ''
    this.urls = []
    this.change()
    if (callback) { this._stop_callback = callback }
    console.log('webserver stop:', reason)
    if (this.starting) {
      console.error('cant stop, currently starting')
      return
    }
    this.clearIdle()

    if (true || this.opts.optPreventSleep) {
      if (WSC.VERBOSE) {
        console.log('trying release keep awake')
      }
      if (chrome.power) {
        chrome.power.releaseKeepAwake()
      }
    }
    // TODO: remove hidden.html ensureFirewallOpen
    // also - support multiple instances.

    if (!this.started) {
      // already stopped, trying to double stop
      console.warn('webserver already stopped...')
      this.change()
      return
    }

    this.started = false
    this.stopped = true
    chrome.sockets.tcpServer.disconnect(this.sockInfo.socketId, this.onDisconnect.bind(this, reason))
    for (let key in this.streams) {
      this.streams[key].close()
    }
    this.change()
    // also disconnect any open connections...
  }
  onClose(reason, info) {
    let err = chrome.runtime.lastError
    if (err) { console.warn(err) }
    this.stopped = true
    this.started = false
    if (this._stop_callback) {
      this._stop_callback(reason)
    }
    if (WSC.VERBOSE) {
      console.log('tcpserver onclose', info)
    }
  }
  onDisconnect(reason, info) {
    let err = chrome.runtime.lastError
    if (err) { console.warn(err) }
    this.stopped = true
    this.started = false
    if (WSC.VERBOSE) {
      console.log('tcpserver ondisconnect', info)
    }
    if (this.sockInfo) {
      chrome.sockets.tcpServer.close(this.sockInfo.socketId, () => this.onClose.bind(this, reason, info))
    }
  }
  onStreamClose(stream: IOStream) {
    console.assert(stream.sockId);
    if (this.opts.optStopIdleServer) {
      for (let key of this.streams) {
        this.registerIdle()
        break;
      }
    }
    stream.onDestroy();
    delete this.streams[stream.sockId]
  }
  clearIdle() {
    if (WSC.VERBOSE) {
      console.log('clearIdle')
    }
    if (this._idle_timeout_id) {
      clearTimeout(this._idle_timeout_id)
      this._idle_timeout_id = null
    }
  }
  registerIdle() {
    if (this.opts.optStopIdleServer) {
      console.log('registerIdle')
      this._idle_timeout_id = setTimeout(() => this.checkIdle(), this.opts.optStopIdleServer)
    }
  }
  checkIdle() {
    if (this.opts.optStopIdleServer) {
      if (WSC.VERBOSE) {
        console.log('checkIdle')
      }
      for (let key of this.streams) {
        console.log('hit checkIdle, but had streams. returning')
        return
      }
      this.stop('idle', undefined)
    }
  }
  start(callback) {
    this.lasterr = null
    /*
    if (clear_urls === undefined) { clear_urls = true }
    if (clear_urls) {
        this.urls = []
    }*/
    if (this.starting || this.started) {
      console.error('already starting or started')
      return
    }
    this.start_callback = callback
    this.stopped = false
    this.starting = true
    this.change()

    // need to setup some things
    if (this.interfaces.length === 0 && this.opts.optAllInterfaces) {
      this.getInterfaces({ interface_retry_count: 0 }, () => this.startOnInterfaces());
    } else {
      this.startOnInterfaces();
    }
  }
  startOnInterfaces() {
    // this.interfaces should be populated now (or could be empty, but we tried!)
    this.tryListenOnPort({ port_attempts: 0 }, (info) => this.onListenPortReady(info));
  }
  onListenPortReady(info) {
    if (info.error) {
      this.error(info);
    } else {
      if (WSC.VERBOSE) {
        console.log('listen port ready', info);
      }
      this.port = info.port;
      if (this.opts.optAllInterfaces && this.opts.optDoPortMapping) {
        console.log('WSC', 'doing port mapping');
        this.upnp = new UPNP({ port: this.port, udp: false, searchtime: 2000 });
        this.upnp.reset((result) => this.onPortmapResult(result));
      } else {
        this.onReady();
      }
    }
  }
  onPortmapResult(result) {
    let gateway = this.upnp.validGateway;
    console.log('portmap result', result, gateway)
    if (result && !result.error) {
      if (gateway.device && gateway.device.externalIP) {
        let extIP = gateway.device.externalIP
        this.extra_urls = [{ url: 'http://' + extIP + ':' + this.port }]
      }
    }
    this.onReady()
  }
  onReady() {
    this.ensureFirewallOpen()
    //console.log('onListen',result)
    this.starting = false
    this.started = true
    console.log('Listening on', 'http://' + this.get_host() + ':' + this.port + '/')
    this.bindAcceptCallbacks()
    this.init_urls()
    this.start_success({ urls: this.urls }) // initialize URLs ?
  }
  init_urls() {
    this.urls = [].concat(this.extra_urls)
    this.urls.push({ url: 'http://127.0.0.1:' + this.port })
    for (let i = 0; i < this.interfaces.length; i++) {
      let iface = this.interfaces[i]
      if (iface.prefixLength > 24) {
        this.urls.push({ url: 'http://[' + iface.address + ']:' + this.port })
      } else {
        this.urls.push({ url: 'http://' + iface.address + ':' + this.port })
      }
    }
    return this.urls
  }
  computePortRetry(i) {
    return this.port + i * 3 + Math.pow(i, 2) * 2
  }
  tryListenOnPort(state, callback) {
    this.sockets.tcpServer.getSockets((sockets) => {
      if (sockets.length === 0) {
        this.doTryListenOnPort(state, callback)
      } else {
        let match = sockets.filter((s) => s.name === 'WSCListenSocket');
        if (match && match.length === 1) {
          let m = match[0]
          console.log('adopting existing persistent socket', m)
          this.sockInfo = m
          this.port = m.localPort
          callback({ port: m.localPort })
          return
        }
        this.doTryListenOnPort(state, callback)
      }
    })
  }
  doTryListenOnPort(state, callback) {
    let opts = this.opts.optBackground ? { name: 'WSCListenSocket', persistent: true } : {}
    this.sockets.tcpServer.create(opts, this.onServerSocket.bind(this, state, callback))
  }
  onServerSocket(state, callback, sockInfo) {
    let host = this.get_host()
    this.sockInfo = sockInfo
    let tryPort = this.computePortRetry(state.port_attempts)
    state.port_attempts++
    //console.log('attempting to listen on port',host,tryPort)
    this.sockets.tcpServer.listen(this.sockInfo.socketId,
      host,
      tryPort,
      (result) => {
        let lasterr = chrome.runtime.lastError
        if (lasterr || result < 0) {
          console.log('lasterr listen on port', tryPort, lasterr, result)
          if (this.opts.optTryOtherPorts && state.port_attempts < 5) {
            this.tryListenOnPort(state, callback)
          } else {
            let errInfo = { error: 'Could not listen', attempts: state.port_attempts, code: result, lasterr: lasterr }
            //this.error(errInfo)
            callback(errInfo)
          }
        } else {
          callback({ port: tryPort })
        }
      }
    )
  }
  getInterfaces(state, callback) {
    console.log('WSC', 'no interfaces yet', state)
    chrome.system.network.getNetworkInterfaces(function (result) {
      console.log('network interfaces', result)
      if (result) {
        for (let i = 0; i < result.length; i++) {
          if (this.opts.optIPV6 || result[i].prefixLength <= 24) {
            if (result[i].address.startsWith('fe80::')) { continue }
            this.interfaces.push(result[i])
            console.log('found interface address: ' + result[i].address)
          }
        }
      }

      // maybe wifi not connected yet?
      if (this.interfaces.length === 0 && this.optRetryInterfaces) {
        state.interface_retry_count++
        if (state.interface_retry_count > 5) {
          callback()
        } else {
          setTimeout(function () {
            this.getInterfaces(state, callback)
          }.bind(this), 1000)
        }
      } else {
        callback()
      }
    }.bind(this))
  }
  refreshNetworkInterfaces(callback) {
    this.stop('refreshNetworkInterfaces', function () {
      this.start(callback)
    }.bind(this))
  }
  /*
  refreshNetworkInterfaces: function(callback) {
      // want to call this if we switch networks. maybe better to just stop/start actually...
      this.urls = []
      this.urls.push({url:'http://127.0.0.1:' + this.port})
      this.interfaces = []
      chrome.system.network.getNetworkInterfaces( function(result) {
          console.log('refreshed network interfaces',result)
          if (result) {
              for (let i=0; i<result.length; i++) {
                  if (result[i].prefixLength < 64) {
                      //this.urls.push({url:'http://'+result[i].address+':' + this.port})
                      this.interfaces.push(result[i])
                      console.log('found interface address: ' + result[i].address)
                  }
              }
          }
          this.init_urls()
          callback(this.get_info())
      }.bind(this) )
  },*/
  ensureFirewallOpen() {
    // on chromeOS, if there are no foreground windows,
    if (this.opts.optAllInterfaces && chrome.app.window.getAll().length === 0) {
      if (chrome.app.window.getAll().length === 0) {
        if (window['create_hidden']) {
          window['create_hidden']() // only on chrome OS
        }
      }
    }
  }
  bindAcceptCallbacks() {
    this.sockets.tcpServer.onAcceptError.addListener((argsError: chrome.sockets.tcpServer.AcceptErrorEventArgs) => this.onAcceptError(argsError))
    this.sockets.tcpServer.onAccept.addListener((args: chrome.sockets.tcpServer.AcceptEventArgs) => this.onAccept(args));
  }

  onAcceptError(acceptInfo: chrome.sockets.tcpServer.AcceptErrorEventArgs) {
    if (acceptInfo.socketId !== this.sockInfo.socketId) { return }
    // need to check against this.socketInfo.socketId
    console.error('accept error', this.sockInfo.socketId, acceptInfo)
    // set unpaused, etc
  }
  onAccept(acceptInfo: chrome.sockets.tcpServer.AcceptEventArgs) {
    if (WSC.VERBOSE) { console.log('onAccept', acceptInfo, this.sockInfo) }
    if (acceptInfo.socketId !== this.sockInfo.socketId) { return; }
    if (acceptInfo.socketId) {
      let stream = new IOStream(acceptInfo.clientSocketId);
      this.adopt_stream(acceptInfo, stream);
    }
  }

  adopt_stream(acceptInfo, stream) {
    this.clearIdle()
    //let stream = new IOStream(acceptInfo.socketId)
    this.streams[acceptInfo.clientSocketId] = stream;
    stream.addCloseCallback((streamData) => this.onStreamClose(streamData));
    let connection = new HTTPConnection(stream);
    connection.addRequestCallback((request) => this.onRequest(stream, connection, request));
    connection.tryRead()
  }

  onRequest(stream, connection, request) {
    if (WSC.DEBUG) {
      console.log('<Request>', request.method, request.uri);
    }
    let handler;

    if (this.opts.auth) {
      let validAuth = false;
      let auth = request.headers['authorization'];
      if (auth) {
        if (auth.slice(0, 6).toLowerCase() === 'basic ') {
          let userpass = atob(auth.slice(6, auth.length)).split(':')
          if (userpass[0] === this.opts.auth.username &&
            userpass[1] === this.opts.auth.password) {
            validAuth = true
          }
        }
      }

      if (!validAuth) {
        handler = new DefaultHandler(request); // (request)
        handler.setHeader('WWW-Authenticate', 'Basic')
        handler.write('', 401, undefined);
        handler.finish()
        return;
      }
    }

    if (this.opts.optModRewriteEnable) {
      let matches = request.uri.match(this.opts.optModRewriteRegexp)
      if (matches === null && this.opts.optModRewriteNegate ||
        matches !== null && !this.opts.optModRewriteNegate
      ) {
        console.log('Mod rewrite rule matched', matches, this.opts.optModRewriteRegexp, request.uri)
        handler = new DirectoryEntryHandler(this.fs, request);
        (<DirectoryEntryHandler>handler).rewriteTo = this.opts.optModRewriteTo;
      }
    }

    let on_handler = (re_match, requestHandler: RequestHandler): boolean => {
      requestHandler.request = request;
      stream.lastHandler = requestHandler;
      let handlerMethod = requestHandler[request.method.toLowerCase()];
      let preHandlerMethod = requestHandler['before_' + request.method.toLowerCase()];
      if (preHandlerMethod) {
        preHandlerMethod.apply(requestHandler, re_match);
      }
      if (handlerMethod) {
        handlerMethod.apply(requestHandler, re_match);
        return true;
      }
      return false;
    }
    let handled = false;

    if (handler) {
      handled = on_handler(null, handler)
    } else {
      // if(WSC.VERBOSE) console.log(this.handlersMatch);
      // if(WSC.VERBOSE) console.dir(request);
      // if (WSC.DEBUG) { debugger; }
      for (let handlerEntry of this.handlersMatch) {
        let re = handlerEntry[0];
        let reresult = re.exec(request.uri)
        if (reresult) {
          let re_match = reresult.slice(1)
          let cls = handlerEntry[1];
          handled = on_handler(re_match, new cls);
          if (handled) {
            return;
          }
        }
      }
    }

    if (isNil(handled) || !handled) {
      console.error('unhandled request', request)
      // create a default handler...
      let handler = new DefaultHandler(request);
      handler.write('Unhandled request. Did you select a folder to serve?', 404, undefined)
      handler.finish()
    }
  }
}


export abstract class BaseHandler {
  VERBOSE = false;
  DEBUG = false;
  beforefinish: any;
  headersWritten = false
  responseCode = undefined;
  responseHeaders = {}
  responseData = [];
  responseLength = null;
  rewriteTo: string = undefined;
  isDirectoryListing: boolean = false;
  beforeFinish;
  abstract request: HTTPRequest;

  options() {
    if (WSC.app.opts.optCORS) {
      this.set_status(200)
      this.finish()
    } else {
      this.set_status(403)
      this.finish()
    }
  }

  setCORS() {
    this.setHeader('access-control-allow-origin', '*');
    this.setHeader('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
    this.setHeader('access-control-max-age', '120');
  }

  get_argument(key, def) {
    if (this.request.arguments[key] !== undefined) {
      return this.request.arguments[key]
    } else {
      return def
    }
  }
  getHeader(k, defaultvalue) {
    return this.request.headers[k] || defaultvalue
  }
  setHeader(k, v) {
    this.responseHeaders[k] = v;
  }
  set_status(code) {
    console.assert(!this.headersWritten)
    this.responseCode = code
  }

  writeHeaders(code = undefined, callback = undefined) {
    if (code === undefined || isNaN(code)) { code = this.responseCode || 200 }
    this.headersWritten = true
    let lines = []
    if (code === 200) {
      lines.push('HTTP/1.1 200 OK')
    } else {
      //console.log(this.request.connection.stream.sockId,'response code',code, this.responseLength)
      lines.push('HTTP/1.1 ' + code + ' ' + HTTPRESPONSES[code])
    }
    if (this.responseHeaders['transfer-encoding'] === 'chunked') {
      // chunked encoding
    } else {
      if (this.VERBOSE) {
        console.log(this.request.connection.stream.sockId, 'response code', code, 'clen', this.responseLength)
      }
      console.assert(typeof this.responseLength === 'number')
      lines.push('content-length: ' + this.responseLength)
    }

    let p = this.request.path.split('.')
    if (p.length > 1 && !this.isDirectoryListing) {
      let ext = p[p.length - 1].toLowerCase()
      let type = MIMETYPES[ext]
      if (type) {
        // go ahead and assume utf-8 for text/plain and text/html... (what other types?)
        // also how do we detect this in general? copy from nginx i guess?
        /*
Changes with nginx 0.7.9                                         12 Aug 2008

*) Change: now ngx_http_charset_module works by default with following
MIME types: text/html, text/css, text/xml, text/plain,
text/vnd.wap.wml, application/x-javascript, and application/rss+xml.
*/
        let default_types = ['text/html',
          'text/xml',
          'text/plain',
          'text/vnd.wap.wml',
          'application/javascript',
          'application/rss+xml']

        if (default_types.indexOf(type) > -1) {
          type += '; charset=utf-8'
        }
        this.setHeader('content-type', type)
      }
    }

    if (WSC.app.opts.optCORS) {
      this.setCORS();
    }

    for (let key in this.responseHeaders) {
      if (this.responseHeaders[key]) {
        lines.push(key + ': ' + this.responseHeaders[key])
      }
    }
    lines.push('\r\n')
    let headerstr = lines.join('\r\n')
    if (this.VERBOSE) { console.log('write headers', headerstr) }
    this.request.connection.write(headerstr, callback)
  }
  writeChunk(data) {
    console.assert(data.byteLength !== undefined)
    let chunkheader = data.byteLength.toString(16) + '\r\n'
    if (this.VERBOSE) { console.log('write chunk', [chunkheader]) }
    this.request.connection.write(WSC.str2ab(chunkheader))
    this.request.connection.write(data)
    this.request.connection.write(WSC.str2ab('\r\n'))
  }
  write(data, code, opt_finish = true) {
    if (typeof data === 'string') {
      // using .write directly can be dumb/dangerous. Better to pass explicit array buffers
      if (this.VERBOSE) { console.warn('putting strings into write is not well tested with multi byte characters') }
      data = new TextEncoder('utf-8').encode(data).buffer;
    }

    console.assert(data.byteLength !== undefined)
    if (isNil(code)) {
      code = 200;
    }
    this.responseData.push(data);
    this.responseLength += data.byteLength;
    // todo - support chunked response?
    if (!this.headersWritten) {
      this.writeHeaders(code);
    }
    for (let dataPart of this.responseData) {
      this.request.connection.write(dataPart);
    }
    this.responseData = [];
    if (opt_finish !== false) {
      this.finish();
    }
  }
  finish() {
    if (!this.headersWritten) {
      this.responseLength = 0;
      this.writeHeaders();
    }
    if (this.beforefinish) { this.beforefinish(); }
    this.request.connection.curRequest = null;
    let noKeepAlive = true;
    if (!noKeepAlive && this.request.isKeepAlive() && !this.request.connection.stream.remoteclosed) {
      this.request.connection.tryRead();
      if (this.DEBUG) {
        console.log('webapp.finish(keepalive)');
      }
    } else {
      console.assert(!this.request.connection.stream.onWriteBufferEmpty);
      this.request.connection.stream.onWriteBufferEmpty = () => {
        this.request.connection.close();
        if (this.DEBUG) {
          console.log('webapp.finish(close)');
        }
      }
    }
  }
}

export class FileSystem {
  constructor (
    public entry
  ) {
  }
  getByPath(path: string, callback, allowFolderCreation = false) {
    if (path === '/' || path === '') {
      callback(this.entry);
      return;
    }
    // let parts = path.split('/');
    // let newpath = parts.slice(0, parts.length);
    let parts = path.split('/');
    let newpath = parts.slice(1, parts.length);
    WSC.recursiveGetEntry(this.entry, newpath, callback, allowFolderCreation);
  }
}
