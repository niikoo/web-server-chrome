/// <reference path="./../../node_modules/@types/chrome/index.d.ts" />
/// <reference path="./../../node_modules/@types/chrome/chrome-app.d.ts" />
/// <reference path="./../../node_modules/@types/chrome/chrome-webview.d.ts" />
import { WSC } from './common';
import { WSRequest } from './request';

export class WebApplication {
  id: string;
  opts: any;
  handlers;
  sockInfo;
  lasterr;
  stopped;
  starting;
  start_callback;
  _stop_callback;
  started;
  fs;
  streams;
  upnp;
  sockets = chrome.sockets
  host;
  port;
  _idle_timeout_id;
  on_status_change;
  interfaces = [];
  interface_retry_count;
  urls;
  extra_urls;


  constructor (
    private _wsc: WSC
  ) { }

  WebApplication(opts) {
    // need to support creating multiple WebApplication...
    if (this._wsc.DEBUG) {
      console.log('initialize webapp with opts', opts)
    }
    opts = opts || {}
    this.id = Math.random().toString()
    this.opts = opts
    this.handlers = opts.handlers || []
    this.init_handlers()
    this.sockInfo = null
    this.lasterr = null
    this.stopped = false
    this.starting = false
    this.start_callback = null
    this._stop_callback = null
    this.started = false
    this.fs = null
    this.streams = {}
    this.upnp = null
    if (opts.retainstr) {
      // special option to setup a handler
      chrome.fileSystem.restoreEntry(opts.retainstr, function (entry) {
        if (entry) {
          this.on_entry(entry)
        } else {
          this.error('error setting up retained entry')
        }
      }.bind(this))
    }
    if (opts.entry) {
      this.on_entry(opts.entry)
    }
    this.host = this.get_host()
    this.port = parseInt(opts.port || 8887)

    this._idle_timeout_id = null

    this.on_status_change = null
    this.interfaces = []
    this.interface_retry_count = 0
    this.urls = []
    this.extra_urls = []
    if (this.port > 65535 || this.port < 1024) {
      var err = 'bad port: ' + this.port
      this.error(err)
    }
    this.acceptQueue = []
  }

  processAcceptQueue() {
    console.log('process accept queue len', this.acceptQueue.length)
    while (this.acceptQueue.length > 0) {
      var sockInfo = this.acceptQueue.shift()
      this.onAccept(sockInfo)
    }
  }
  updateOption(k, v) {
    this.opts[k] = v
    switch (k) {
      case 'optDoPortMapping':
        if (!v) {
          if (this.upnp) {
            this.upnp.removeMapping(this.port, 'TCP', function (result) {
              console.log('result of removing port mapping', result)
              this.extra_urls = []
              this.upnp = null
              //this.init_urls() // misleading because active connections are not terminated
              //this.change()
            }.bind(this))
          }
        }
        break
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
  },
  updatedSleepSetting() {
    if (!this.started) {
      chrome.power.releaseKeepAwake()
      return
    }
    if (this.opts.optPreventSleep) {
      console.log('requesting keep awake system')
      chrome.power.requestKeepAwake(chrome.power.Level.SYSTEM)
    } else {
      console.log('releasing keep awake system')
      chrome.power.releaseKeepAwake()
    }
  }
  on_entry(entry) {
    var fs = new this._wsc.FileSystem(entry)
    this.fs = fs
    this.add_handler(['.*', this._wsc.DirectoryEntryHandler.bind(null, fs)])
    this.init_handlers()
    if (this._wsc.DEBUG) {
      //console.log('setup handler for entry',entry)
    }
    //if (this.opts.optBackground) { this.start() }
  }
  get_host() {
    let host
    if (this._wsc.getchromeversion() >= 44 && this.opts.optAllInterfaces) {
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
    for (var i = 0; i < this.handlers.length; i++) {
      var repat = this.handlers[i][0]
      this.handlersMatch.push([new RegExp(repat), this.handlers[i][1]])
    }
    this.change()
  }
  change() {
    if (this.on_status_change) { this.on_status_change() }
  }
  start_success(data) {
    if (this.opts.optPreventSleep) {
      console.log('requesting keep awake system')
      chrome.power.requestKeepAwake(chrome.power.Level.SYSTEM)
    }
    let callback = this.start_callback
    this.start_callback = null
    this.registerIdle()
    if (callback) {
      callback(this.get_info())
    }
    this.change()
  }
  error(data) {
    if (this.opts.optPreventSleep) {
      chrome.power.releaseKeepAwake()
    }
    this.interface_retry_count = 0
    var callback = this.start_callback
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
      if (this._wsc.VERBOSE)
        console.log('trying release keep awake')
      if (chrome.power)
        chrome.power.releaseKeepAwake()
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
    for (var key in this.streams) {
      this.streams[key].close()
    }
    this.change()
    // also disconnect any open connections...
  }
  onClose(reason, info) {
    var err = chrome.runtime.lastError
    if (err) { console.warn(err) }
    this.stopped = true
    this.started = false
    if (this._stop_callback) {
      this._stop_callback(reason)
    }
    if (this._wsc.VERBOSE)
      console.log('tcpserver onclose', info)
  }
  onDisconnect(reason, info) {
    var err = chrome.runtime.lastError
    if (err) { console.warn(err) }
    this.stopped = true
    this.started = false
    if (_wsc.VERBOSE)
      console.log('tcpserver ondisconnect', info)
    if (this.sockInfo) {
      chrome.sockets.tcpServer.close(this.sockInfo.socketId, this.onClose.bind(this, reason))
    }
  }
  onStreamClose(stream) {
    console.assert(stream.sockId)
    if (this.opts.optStopIdleServer) {
      for (var key in this.streams) {
        this.registerIdle()
        break;
      }
    }
    delete this.streams[stream.sockId]
  }
  clearIdle() {
    if (this._wsc.VERBOSE)
      console.log('clearIdle')
    if (this._idle_timeout_id) {
      clearTimeout(this._idle_timeout_id)
      this._idle_timeout_id = null
    }
  }
  registerIdle() {
    if (this.opts.optStopIdleServer) {
      console.log('registerIdle')
      this._idle_timeout_id = setTimeout(this.checkIdle.bind(this), this.opts.optStopIdleServer)
    }
  }
  checkIdle() {
    if (this.opts.optStopIdleServer) {
      if (this._wsc.VERBOSE)
        console.log('checkIdle')
      for (var key in this.streams) {
        console.log('hit checkIdle, but had streams. returning')
        return
      }
      this.stop('idle')
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
      console.error("already starting or started")
      return
    }
    this.start_callback = callback
    this.stopped = false
    this.starting = true
    this.change()

    // need to setup some things
    if (this.interfaces.length == 0 && this.opts.optAllInterfaces) {
      this.getInterfaces({ interface_retry_count: 0 }, this.startOnInterfaces.bind(this))
    } else {
      this.startOnInterfaces()
    }
  }
  startOnInterfaces() {
    // this.interfaces should be populated now (or could be empty, but we tried!)
    this.tryListenOnPort({ port_attempts: 0 }, this.onListenPortReady.bind(this))
  }
  onListenPortReady(info) {
    if (info.error) {
      this.error(info)
    } else {
      if (this._wsc.VERBOSE)
        console.log('listen port ready', info)
      this.port = info.port
      if (this.opts.optAllInterfaces && this.opts.optDoPortMapping) {
        console.log("WSC", "doing port mapping")
        this.upnp = new this._wsc.UPNP({ port: this.port, udp: false, searchtime: 2000 })
        this.upnp.reset(this.onPortmapResult.bind(this))
      } else {
        this.onReady()
      }
    }
  }
  onPortmapResult(result) {
    var gateway = this.upnp.validGateway
    console.log('portmap result', result, gateway)
    if (result && !result.error) {
      if (gateway.device && gateway.device.externalIP) {
        var extIP = gateway.device.externalIP
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
    for (var i = 0; i < this.interfaces.length; i++) {
      var iface = this.interfaces[i]
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
    sockets.tcpServer.getSockets(function (sockets) {
      if (sockets.length == 0) {
        this.doTryListenOnPort(state, callback)
      } else {
        var match = sockets.filter(function (s) { return s.name == 'WSCListenSocket' })
        if (match && match.length == 1) {
          var m = match[0]
          console.log('adopting existing persistent socket', m)
          this.sockInfo = m
          this.port = m.localPort
          callback({ port: m.localPort })
          return
        }
        this.doTryListenOnPort(state, callback)
      }
    }.bind(this))
  }
  doTryListenOnPort(state, callback) {
    var opts = this.opts.optBackground ? { name: "WSCListenSocket", persistent: true } : {}
    sockets.tcpServer.create(opts, this.onServerSocket.bind(this, state, callback))
  }
  onServerSocket(state, callback, sockInfo) {
    var host = this.get_host()
    this.sockInfo = sockInfo
    var tryPort = this.computePortRetry(state.port_attempts)
    state.port_attempts++
    //console.log('attempting to listen on port',host,tryPort)
    sockets.tcpServer.listen(this.sockInfo.socketId,
      host,
      tryPort,
      function (result) {
        var lasterr = chrome.runtime.lastError
        if (lasterr || result < 0) {
          console.log('lasterr listen on port', tryPort, lasterr, result)
          if (this.opts.optTryOtherPorts && state.port_attempts < 5) {
            this.tryListenOnPort(state, callback)
          } else {
            var errInfo = { error: "Could not listen", attempts: state.port_attempts, code: result, lasterr: lasterr }
            //this.error(errInfo)
            callback(errInfo)
          }
        } else {
          callback({ port: tryPort })
        }
      }.bind(this)
    )
  }
  getInterfaces(state, callback) {
    console.log('WSC', 'no interfaces yet', state)
    chrome.system.network.getNetworkInterfaces(function (result) {
      console.log('network interfaces', result)
      if (result) {
        for (var i = 0; i < result.length; i++) {
          if (this.opts.optIPV6 || result[i].prefixLength <= 24) {
            if (result[i].address.startsWith('fe80::')) { continue }
            this.interfaces.push(result[i])
            console.log('found interface address: ' + result[i].address)
          }
        }
      }

      // maybe wifi not connected yet?
      if (this.interfaces.length == 0 && this.optRetryInterfaces) {
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
              for (var i=0; i<result.length; i++) {
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
    if (this.opts.optAllInterfaces && chrome.app.window.getAll().length == 0) {
      if (chrome.app.window.getAll().length == 0) {
        if (window.create_hidden) {
          create_hidden() // only on chrome OS
        }
      }
    }
  }
  bindAcceptCallbacks() {
    sockets.tcpServer.onAcceptError.addListener(this.onAcceptError.bind(this))
    sockets.tcpServer.onAccept.addListener(this.onAccept.bind(this))
  }
  onAcceptError(acceptInfo) {
    if (acceptInfo.socketId != this.sockInfo.socketId) { return }
    // need to check against this.socketInfo.socketId
    console.error('accept error', this.sockInfo.socketId, acceptInfo)
    // set unpaused, etc
  }
  onAccept(acceptInfo) {
    //console.log('onAccept',acceptInfo,this.sockInfo)
    if (acceptInfo.socketId != this.sockInfo.socketId) { return }
    if (acceptInfo.socketId) {
      var stream = new this._wsc.IOStream(acceptInfo.clientSocketId)
      this.adopt_stream(acceptInfo, stream)
    }
  },
  adopt_stream(acceptInfo, stream) {
    this.clearIdle()
    //var stream = new IOStream(acceptInfo.socketId)
    this.streams[acceptInfo.clientSocketId] = stream
    stream.addCloseCallback(this.onStreamClose.bind(this))
    var connection = new this._wsc.HTTPConnection(stream)
    connection.addRequestCallback(this.onRequest.bind(this, stream, connection))
    connection.tryRead()
  }
  onRequest(stream, connection, request) {
    console.log('Request', request.method, request.uri)

    if (this.opts.auth) {
      var validAuth = false
      var auth = request.headers['authorization']
      if (auth) {
        if (auth.slice(0, 6).toLowerCase() == 'basic ') {
          var userpass = atob(auth.slice(6, auth.length)).split(':')
          if (userpass[0] == this.opts.auth.username &&
            userpass[1] == this.opts.auth.password) {
            validAuth = true
          }
        }
      }

      if (!validAuth) {
        var handler = new BaseHandler(this._wsc, request);

        handler.app = this
        handler.request = request
        handler.setHeader("WWW-Authenticate", "Basic")
        handler.write("", 401)
        handler.finish()
        return
      }
    }

    if (this.opts.optModRewriteEnable) {
      var matches = request.uri.match(this.opts.optModRewriteRegexp)
      if (matches === null && this.opts.optModRewriteNegate ||
        matches !== null && !this.opts.optModRewriteNegate
      ) {
        console.log("Mod rewrite rule matched", matches, this.opts.optModRewriteRegexp, request.uri)
        var handler = new DirectoryEntryHandler(this.fs, request)
        handler.rewrite_to = this.opts.optModRewriteTo
      }
    }

    function on_handler(re_match, app, requestHandler) {
      requestHandler.connection = connection
      requestHandler.app = app
      requestHandler.request = request
      stream.lastHandler = requestHandler
      var handlerMethod = requestHandler[request.method.toLowerCase()]
      var preHandlerMethod = requestHandler['before_' + request.method.toLowerCase()]
      if (preHandlerMethod) {
        preHandlerMethod.apply(requestHandler, re_match)
      }
      if (handlerMethod) {
        handlerMethod.apply(requestHandler, re_match)
        return true
      }
    }
    var handled = false;

    if (handler) {
      handled = on_handler(null, this, handler)
    } else {
      for (var i = 0; i < this.handlersMatch.length; i++) {
        var re = this.handlersMatch[i][0]
        var reresult = re.exec(request.uri)
        if (reresult) {
          var re_match = reresult.slice(1)
          var cls = this.handlersMatch[i][1]
          var requestHandler = new cls(request)
          handled = on_handler(re_match, this, requestHandler)
          if (handled) { break }
        }
      }
    }

    if (!handled) {
      console.error('unhandled request', request)
      // create a default handler...
      var handler = new BaseHandler(this._wsc, request)
      handler.app = this
      handler.request = request
      handler.write("Unhandled request. Did you select a folder to serve?", 404)
      handler.finish()
    }
  }
}


export class BaseHandler {
  headersWritten = false
  responseCode = null
  responseHeaders = {}
  responseData = []
  responseLength = null
  request = new WSRequest();
  constructor (
    public _wsc: WSC,
    public app: WebApplication
  ) {
  }
  options() {
    if (this.app.opts.optCORS) {
      this.set_status(200)
      this.finish()
    } else {
      this.set_status(403)
      this.finish()
    }
  }
  setCORS() {
    this.setHeader('access-control-allow-origin', '*')
    this.setHeader('access-control-allow-methods', 'GET, POST, PUT')
    this.setHeader('access-control-max-age', '120')
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
    this.responseHeaders[k] = v
  }
  set_status(code) {
    console.assert(!this.headersWritten)
    this.responseCode = code
  }

  writeHeaders(code = undefined, callback = undefined) {
    if (code === undefined || isNaN(code)) { code = this.responseCode || 200 }
    this.headersWritten = true
    var lines = []
    if (code == 200) {
      lines.push('HTTP/1.1 200 OK')
    } else {
      //console.log(this.request.connection.stream.sockId,'response code',code, this.responseLength)
      lines.push('HTTP/1.1 ' + code + ' ' + this._wsc.HTTPRESPONSES[code])
    }
    if (this.responseHeaders['transfer-encoding'] === 'chunked') {
      // chunked encoding
    } else {
      if (this._wsc.VERBOSE) {
        console.log(this.request.connection.stream.sockId, 'response code', code, 'clen', this.responseLength)
      }
      console.assert(typeof this.responseLength == 'number')
      lines.push('content-length: ' + this.responseLength)
    }

    var p = this.request.path.split('.')
    if (p.length > 1 && !this.isDirectoryListing) {
      var ext = p[p.length - 1].toLowerCase()
      var type = this._wsc.MIMETYPES[ext]
      if (type) {
        // go ahead and assume utf-8 for text/plain and text/html... (what other types?)
        // also how do we detect this in general? copy from nginx i guess?
        /*
Changes with nginx 0.7.9                                         12 Aug 2008

*) Change: now ngx_http_charset_module works by default with following
MIME types: text/html, text/css, text/xml, text/plain,
text/vnd.wap.wml, application/x-javascript, and application/rss+xml.
*/
        var default_types = ['text/html',
          'text/xml',
          'text/plain',
          "text/vnd.wap.wml",
          "application/javascript",
          "application/rss+xml"]

        if (contains(default_types, type)) {
          type += '; charset=utf-8'
        }
        this.setHeader('content-type', type)
      }
    }

    if (this.app.opts.optCORS) {
      this.setCORS()
    }

    for (key in this.responseHeaders) {
      lines.push(key + ': ' + this.responseHeaders[key])
    }
    lines.push('\r\n')
    var headerstr = lines.join('\r\n')
    //console.log('write headers',headerstr)
    this.request.connection.write(headerstr, callback)
  }
  writeChunk(data) {
    console.assert(data.byteLength !== undefined)
    var chunkheader = data.byteLength.toString(16) + '\r\n'
    //console.log('write chunk',[chunkheader])
    this.request.connection.write(_wsc.str2ab(chunkheader))
    this.request.connection.write(data)
    this.request.connection.write(_wsc.str2ab('\r\n'))
  }
  write(data, code, opt_finish) {
    if (typeof data == "string") {
      // using .write directly can be dumb/dangerous. Better to pass explicit array buffers
      //console.warn('putting strings into write is not well tested with multi byte characters')
      data = new TextEncoder('utf-8').encode(data).buffer
    }

    console.assert(data.byteLength !== undefined)
    if (code === undefined) { code = 200 }
    this.responseData.push(data)
    this.responseLength += data.byteLength
    // todo - support chunked response?
    if (!this.headersWritten) {
      this.writeHeaders(code)
    }
    for (var i = 0; i < this.responseData.length; i++) {
      this.request.connection.write(this.responseData[i])
    }
    this.responseData = []
    if (opt_finish !== false) {
      this.finish()
    }
  }
  finish() {
    if (!this.headersWritten) {
      this.responseLength = 0
      this.writeHeaders()
    }
    if (this.beforefinish) { this.beforefinish() }
    this.request.connection.curRequest = null
    if (this.request.isKeepAlive() && !this.request.connection.stream.remoteclosed) {
      this.request.connection.tryRead()
      if (_wsc.DEBUG) {
        //console.log('webapp.finish(keepalive)')
      }
    } else {
      console.assert(!this.request.connection.stream.onWriteBufferEmpty)
      this.request.connection.stream.onWriteBufferEmpty = () => {
        this.request.connection.close()
        if (this._wsc.DEBUG) {
          //console.log('webapp.finish(close)')
        }
      }
    }
  }
}

export class FileSystem {
  constructor (
    private _wsc: WSC,
    private entry
  ) {
  }
  getByPath(path, callback, allowFolderCreation) {
    if (path == '/') {
      callback(this.entry)
      return
    }
    var parts = path.split('/')
    var newpath = parts.slice(1, parts.length)
    this._wsc.recursiveGetEntry(this.entry, newpath, callback, allowFolderCreation)
  }
}

