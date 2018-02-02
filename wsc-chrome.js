/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
__webpack_require__(4);
__webpack_require__(5);
__webpack_require__(6);
__webpack_require__(7);
__webpack_require__(8);
__webpack_require__(9);
__webpack_require__(10);
__webpack_require__(11);
__webpack_require__(12);
__webpack_require__(13);
__webpack_require__(14);
__webpack_require__(15);
__webpack_require__(16);
module.exports = __webpack_require__(17);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

(function() {
function Buffer(opts) {
    /*
      FIFO queue type that lets you check when able to consume the
      right amount of data.

     */
    this.opts = opts
    this.max_buffer_size = 104857600
    this._size = 0
    this.deque = []
}

Buffer.prototype = {
    clear: function() {
        this.deque = []
        this._size = 0
    },
    flatten: function() {
        if (this.deque.length == 1) { return this.deque[0] }
        // flattens the buffer deque to one element
        var totalSz = 0
        for (var i=0; i<this.deque.length; i++) {
            totalSz += this.deque[i].byteLength
        }
        var arr = new Uint8Array(totalSz)
        var idx = 0
        for (var i=0; i<this.deque.length; i++) {
            arr.set(new Uint8Array(this.deque[i]), idx)
            idx += this.deque[i].byteLength
        }
        this.deque = [arr.buffer]
        return arr.buffer
    },
    add: function(data) {
        console.assert(data instanceof ArrayBuffer)
		//console.assert(data.byteLength > 0)
        this._size = this._size + data.byteLength
        this.deque.push(data)
    },
    consume_any_max: function(maxsz) {
        if (this.size() <= maxsz) {
            return this.consume(this.size())
        } else {
            return this.consume(maxsz)
        }
    },
    consume: function(sz,putback) {
        // returns a single array buffer of size sz
        if (sz > this._size) {
            console.assert(false)
            return false
        }

        var consumed = 0

        var ret = new Uint8Array(sz)
        var curbuf
        // consume from the left

        while (consumed < sz) {
            curbuf = this.deque[0]
            console.assert(curbuf instanceof ArrayBuffer)

            if (consumed + curbuf.byteLength <= sz) {
                // curbuf fits in completely to return buffer
                ret.set( new Uint8Array(curbuf), consumed )
                consumed = consumed + curbuf.byteLength
                this.deque.shift()
            } else {
                // curbuf too big! this will be the last buffer
                var sliceleft = new Uint8Array( curbuf, 0, sz - consumed )
                //console.log('left slice',sliceleft)

                ret.set( sliceleft, consumed )
                // we spliced off data, so set curbuf in deque

                var remainsz = curbuf.byteLength - (sz - consumed)
                var sliceright = new Uint8Array(curbuf, sz - consumed, remainsz)
                //console.log('right slice',sliceright)
                var remain = new Uint8Array(remainsz)
                remain.set(sliceright, 0)
                //console.log('right slice (newbuf)',remain)

                this.deque[0] = remain.buffer
                break
            }
        }
        if (putback) {
            this.deque = [ret.buffer].concat(this.deque)
        } else {
            this._size -= sz
        }
        return ret.buffer
    },
    size: function() {
        return this._size
    }
}


function test_buffer() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    console.assert( b.size() == 4 )
    b.add( new Uint8Array([5,6,7]).buffer )
    console.assert( b.size() == 7 )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    console.assert( b.size() == 12 )
    var data

    data = b.consume(1);
    console.assert(new Uint8Array(data)[0] == 1)
    console.assert( data.byteLength == 1 )

    data = b.consume(1);
    console.assert(new Uint8Array(data)[0] == 2)
    console.assert( data.byteLength == 1 )

    data = b.consume(2);
    console.assert( data.byteLength == 2 )
    console.assert(new Uint8Array(data)[0] == 3)
    console.assert(new Uint8Array(data)[1] == 4)
}

function test_buffer2() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    console.assert( b.size() == 4 )
    b.add( new Uint8Array([5,6,7]).buffer )
    console.assert( b.size() == 7 )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    console.assert( b.size() == 12 )
    var data

    data = b.consume(6);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 6)
    console.assert(adata[0] == 1)
    console.assert(adata[1] == 2)
    console.assert(adata[2] == 3)
    console.assert(adata[3] == 4)
    console.assert(adata[4] == 5)
    console.assert(adata[5] == 6)
}

function test_buffer3() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume_any_max(1024);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 12)
    for (var i=0;i<12;i++) {
        console.assert(adata[i] == i+1)
    }
}

function test_buffer4() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume_any_max(10);
    var adata = new Uint8Array(data)
    console.assert(data.byteLength == 10)
    for (var i=0;i<10;i++) {
        console.assert(adata[i] == i+1)
    }
}


if (false) {
    test_buffer()
    test_buffer2()
    test_buffer3()
    test_buffer4()
}
WSC.Buffer = Buffer
})();


/***/ }),
/* 2 */
/***/ (function(module, exports) {

(function() {
    function ui8IndexOf(arr, s, startIndex) {
        // searches a ui8array for subarray s starting at startIndex
        startIndex = startIndex || 0
        var match = false
        for (var i=startIndex; i<arr.length - s.length + 1; i++) {
            if (arr[i] == s[0]) {
                match = true
                for (var j=1; j<s.length; j++) {
                    if (arr[i+j] != s[j]) {
                        match = false
                        break
                    }
                }
                if (match) {
                    return i
                }
            }
        }
        return -1
    }


    function ChromeSocketXMLHttpRequest() {
        this.onload = null
        this._finished = false
        this.onerror = null
        this.opts = null

        this.timedOut = false
        this.timeout = 0
        this.timeoutId = null

        this.stream = null
        
        this.connecting = false
        this.writing = false
        this.haderror = false
        this.closed = false

        this.sockInfo = null
        this.responseType = null

        this.extraHeaders = {}

        this.headersReceived = false
        this.responseHeaders = null
        this.responseHeadersParsed = null
        this.responseBody = null
        this.responseLength = null
        this.responseBytesRead = null
        this.requestBody = null

        this.secured = false
    }

    ChromeSocketXMLHttpRequest.prototype = {
        open: function(method, url, async) {
            this.opts = { method:method,
                          url:url,
                          async:true }
            this.uri = WSC.parseUri(this.opts.url)
            //console.assert(this.uri.protocol == 'http:') // https not supported for chrome.socket yet
        },
        setRequestHeader: function(key, val) {
            this.extraHeaders[key] = val
        },
        cancel: function() {
            if (! this.stream.closed) { this.stream.close() }
        },
        send: function(data) {
            //console.log('xhr send payload',this.opts.method, data)
            this.requestBody = data
            chrome.sockets.tcp.create({}, _.bind(this.onCreate, this))
            if (this.timeout !== 0) {
                this.timeoutId = setTimeout( _.bind(this.checkTimeout, this), this.timeout )
            }
        },
        createRequestHeaders: function() {
            var lines = []
            var headers = {//'Connection': 'close',
                           //'Accept-Encoding': 'identity', // servers will send us chunked encoding even if we dont want it, bastards
//                           'Accept-Encoding': 'identity;q=1.0 *;q=0', // servers will send us chunked encoding even if we dont want it, bastards
                           //                       'User-Agent': 'uTorrent/330B(30235)(server)(30235)', // setRequestHeader /extra header is doing this
                           'Host': this.uri.host}
            _.extend(headers, this.extraHeaders)
            if (this.opts.method == 'GET') {
                //                headers['Content-Length'] == '0'
            } else if (this.opts.method == 'POST') {
                if (this.requestBody) {
                    headers['Content-Length'] = this.requestBody.byteLength.toString()
                } else {
                    headers['Content-Length'] = '0'
                    // make sure content-length 0 included ?
                }
            } else {
                this.error('unsupported method')
            }
            lines.push(this.opts.method + ' ' + this.uri.pathname + this.uri.search + ' HTTP/1.1')
            //console.log('making request',lines[0],headers)
            for (var key in headers) {
                lines.push( key + ': ' + headers[key] )
            }
            return lines.join('\r\n') + '\r\n\r\n'
        },
        checkTimeout: function() {
            if (! this._finished) {
                this.error({error:'timeout'}) // call ontimeout instead
            }
        },
        error: function(data) {
            this._finished = true
            //console.log('error:',data)
            this.haderror = true
            if (this.onerror) {
                console.assert(typeof data == "object")
                data.target = {error:true}
                this.onerror(data)
            }
            if (! this.stream.closed) {
                this.stream.close()
            }
        },
        onStreamClose: function(evt) {
            //console.log('xhr closed')
            if (! this._finished) {
                this.error({error:'stream closed'})
            }
        },
        onCreate: function(sockInfo) {
            if (this.closed) { return }
            this.stream = new WSC.IOStream(sockInfo.socketId)
            this.stream.addCloseCallback(this.onStreamClose.bind(this))
            this.sockInfo = sockInfo
            this.connecting = true
            var host = this.getHost()
            var port = this.getPort()
            //console.log('connecting to',host,port)
            chrome.sockets.tcp.setPaused( sockInfo.socketId, true, function() {
                chrome.sockets.tcp.connect( sockInfo.socketId, host, port, _.bind(this.onConnect, this) )
            }.bind(this))
        },
        onConnect: function(result) {
            //console.log('connected to',this.getHost())
            var lasterr = chrome.runtime.lastError
            if (this.closed) { return }
            this.connecting = false
            if (this.timedOut) {
                return
            } else if (lasterr) {
                this.error({error:lasterr.message})
            } else if (result < 0) {
                this.error({error:'connection error',
                            code:result})
            } else {
                if (this.uri.protocol == 'https:' && ! this.secured) {
                    this.secured = true
                    //console.log('securing socket',this.sockInfo.socketId)
                    chrome.sockets.tcp.secure(this.sockInfo.socketId, this.onConnect.bind(this))
                    return
                }
                var headers = this.createRequestHeaders()
                //console.log('request to',this.getHost(),headers)
                this.stream.writeBuffer.add( new TextEncoder('utf-8').encode(headers).buffer )
                if (this.requestBody) {
                    this.stream.writeBuffer.add( this.requestBody )
                    this.requestBody = null
                }
                this.stream.tryWrite()
                this.stream.readUntil('\r\n\r\n', this.onHeaders.bind(this))
                chrome.sockets.tcp.setPaused( this.sockInfo.socketId, false, function(){})
            }
        },
        getHost: function() {
            return this.uri.hostname
        },
        getPort: function() {
            if (this.uri.protocol == 'https:') {
                return parseInt(this.uri.port) || 443
            } else {
                return parseInt(this.uri.port) || 80
            }
        },
        onHeaders: function(data) {
            // not sure what encoding for headers is exactly, latin1 or something? whatever.
            var headers = WSC.ui82str(new Uint8Array(data))
            //console.log('found http tracker response headers', headers)
            this.headersReceived = true
            this.responseHeaders = headers
            var response = parseHeaders(this.responseHeaders)
            this.responseDataParsed = response
            this.responseHeadersParsed = response.headers
            //console.log(this.getHost(),'parsed http response headers',response)
            this.responseLength = parseInt(response.headers['content-length'])
            this.responseBytesRead = this.stream.readBuffer.size()

            if (response.headers['transfer-encoding'] &&
                response.headers['transfer-encoding'] == 'chunked') {
                this.chunks = new WSC.Buffer
                //console.log('looking for an \\r\\n')
                this.stream.readUntil("\r\n", this.getNewChunk.bind(this))
                //this.error('chunked encoding')
            } else {
                if (! response.headers['content-length']) {
                    this.error("no content length in response")
                } else {
                    //console.log('read bytes',this.responseLength)
                    this.stream.readBytes(this.responseLength, this.onBody.bind(this))
                }
            }
        },
        onChunkDone: function(data) {
            this.chunks.add(data)
            this.stream.readUntil("\r\n", this.getNewChunk.bind(this))
        },
        getNewChunk: function(data) {
            var s = WSC.ui82str(new Uint8Array(data.slice(0,data.byteLength-2)))
            var len = parseInt(s,16)
            if (isNaN(len)) {
                this.error('invalid chunked encoding response')
                return
            }
            //console.log('looking for new chunk of len',len)
            if (len == 0) {
                //console.log('got all chunks',this.chunks)
                var body = this.chunks.flatten()
                this.onBody(body)
            } else {
                this.stream.readBytes(len+2, this.onChunkDone.bind(this))
            }
        },
        onBody: function(body) {
            this.responseBody = body
            var evt = {target: {headers:this.responseDataParsed.headers,
                                code:this.responseDataParsed.code, /* code is wrong, should be status */
                                status:this.responseDataParsed.code,
                                responseHeaders:this.responseHeaders,
                                responseHeadersParsed:this.responseHeadersParsed,
                                response:body}
                      }
            if (this.responseType && this.responseType.toLowerCase() == 'xml') {
                evt.target.responseXML = (new DOMParser).parseFromString(new TextDecoder('utf-8').decode(body), "text/xml")
            }
            this.onload(evt)
            this._finished = true
            if (! this.stream.closed) { this.stream.close() }
            // all done!!! (close connection...)
        }
    }

    function parseHeaders(s) {
        var lines = s.split('\r\n')
        var firstLine = lines[0].split(/ +/)
        var proto = firstLine[0]
        var code = firstLine[1]
        var status = firstLine.slice(2,firstLine.length).join(' ')
        var headers = {}

        for (var i=1; i<lines.length; i++) {
            var line = lines[i]
            if (line) {
                var j = line.indexOf(':')
                var key = line.slice(0,j).toLowerCase()
                headers[key] = line.slice(j+1,line.length).trim()
            }
        }
        return {code: code,
                status: status,
                proto: proto,
                headers: headers}
    }
    WSC.ChromeSocketXMLHttpRequest = ChromeSocketXMLHttpRequest

    window.testxhr = function() {
        console.log('creating XHR')
        var xhr = new ChromeSocketXMLHttpRequest
        xhr.open("GET","https://www.google.com")
        xhr.timeout = 8000
        xhr.onload = xhr.onerror = xhr.ontimeout = function(evt) {
            console.log('xhr result:',evt)
        }
        xhr.send()
        window.txhr = xhr
    }
})();


/***/ }),
/* 3 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (7:8)\nYou may need an appropriate loader to handle this file type.\n| \n| export class WSC {\n|   DEBUG = false\n|   VERBOSE = false\n|   encoderBase = new EncoderBase();");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

(function() {
    _DEBUG = false
    function HTTPConnection(stream) {
        this.stream = stream
        this.curRequest = null
        this.onRequestCallback = null
        //this.log('new connection')
        this.closed = false
    }

    HTTPConnection.prototype = {
        log: function(msg) {
            console.log(this.stream.sockId,msg)
        },
        tryRead: function() {
            this.stream.readUntil('\r\n\r\n',this.onHeaders.bind(this))
        },
        write: function(data) {
            if (typeof data == 'string') {
                // this is using TextEncoder with utf-8
                var buf = WSC.stringToUint8Array(data).buffer
            } else {
                var buf = data
            }
            this.stream.writeBuffer.add(buf)
            this.stream.tryWrite()
        },
        close: function() {
            console.log('http conn close')
            this.closed = true
            this.stream.close()
        },
        addRequestCallback: function(cb) {
            this.onRequestCallback = cb 
        },
        onHeaders: function(data) {
            // TODO - http headers are Latin1, not ascii...
            var datastr = WSC.arrayBufferToString(data)
            var lines = datastr.split('\r\n')
            var firstline = lines[0]
            var flparts = firstline.split(' ')
            var method = flparts[0]
            var uri = flparts[1]
            var version = flparts[2]

            var headers = WSC.parseHeaders(lines.slice(1,lines.length-2))
            this.curRequest = new WSC.HTTPRequest({headers:headers,
                                           method:method,
                                           uri:uri,
                                           version:version,
                                                   connection:this})
            if (_DEBUG) {
                this.log(this.curRequest.uri)
            }
            if (headers['content-length']) {
                var clen = parseInt(headers['content-length'])
                // TODO -- handle 100 continue..
                if (clen > 0) {
                    console.log('request had content length',clen)
                    this.stream.readBytes(clen, this.onRequestBody.bind(this))
                    return
                } else {
                    this.curRequest.body = null
                }
            }

            if (['GET','HEAD','PUT','OPTIONS'].includes(method)) {
                this.onRequest(this.curRequest)
            } else {
                console.error('how to handle',this.curRequest)
            }
        },
        onRequestBody: function(body) {
            var req = this.curRequest
            var ct = req.headers['content-type']
            var default_charset = 'utf-8'
            if (ct) {
                ct = ct.toLowerCase()
                if (ct.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
                    var charset_i = ct.indexOf('charset=')
                    if (charset_i != -1) {
                        var charset = ct.slice(charset_i + 'charset='.length,
                                               ct.length)
                        console.log('using charset',charset)
                    } else {
                        var charset = default_charset
                    }

                    var bodydata = new TextDecoder(charset).decode(body)
                    var bodyparams = {}
                    var items = bodydata.split('&')
                    for (var i=0; i<items.length; i++) {
                        var kv = items[i].split('=')
                        bodyparams[ decodeURIComponent(kv[0]) ] = decodeURIComponent(kv[1])
                    }
                    req.bodyparams = bodyparams
                }
            }
            this.curRequest.body = body
            this.onRequest(this.curRequest)
        },
        onRequest: function(request) {
            this.onRequestCallback(request)
        }
    }

    WSC.HTTPConnection = HTTPConnection;

})();


/***/ }),
/* 5 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (326:20)\nYou may need an appropriate loader to handle this file type.\n|   }\n| \n|   label_to_encoding = {};\n|   /**\n|    * Encodings table: http://encoding.spec.whatwg.org/encodings.json");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (2:8)\nYou may need an appropriate loader to handle this file type.\n| export class EntryCache {\n|   cache = {};\n| \n|   clearTorrent() {");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

(function(){
    _DEBUG = false

    function getEntryFile( entry, callback ) {
        // XXX if file is 0 bytes, and then write some data, it stays cached... which is bad...
        
        var cacheKey = entry.filesystem.name + '/' + entry.fullPath
        var inCache = WSC.entryFileCache.get(cacheKey)
        if (inCache) { 
            //console.log('file cache hit'); 
            callback(inCache); return }
        
        entry.file( function(file) {
            if (false) {
                WSC.entryFileCache.set(cacheKey, file)
            }
            callback(file)
        }, function(evt) {
            // todo -- actually respond with the file error?
            // or cleanup the context at least
            console.error('entry.file() error',evt)
            debugger
            evt.error = true
            // could be NotFoundError
            callback(evt)
        })
    }

    function ProxyHandler(validator, request) {
        WSC.BaseHandler.prototype.constructor.call(this)
        this.validator = validator
    }
    _.extend(ProxyHandler.prototype, {
        get: function() {
            if (! this.validator(this.request)) {
                this.responseLength = 0
                this.writeHeaders(403)
                this.finish()
                return
            }
            console.log('proxyhandler get',this.request)
            var url = this.request.arguments.url
            var xhr = new WSC.ChromeSocketXMLHttpRequest
            var chromeheaders = {
//                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//                'Accept-Encoding':'gzip, deflate, sdch',
                'Accept-Language':'en-US,en;q=0.8',
                'Cache-Control':'no-cache',
//                'Connection':'keep-alive',
                'Pragma':'no-cache',
                'Upgrade-Insecure-Requests':'1',
                'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
            }
            for (var k in chromeheaders) {
                xhr.setRequestHeader(k, chromeheaders[k])
            }
            xhr.open("GET", url)
            xhr.onload = this.onfetched.bind(this)
            xhr.send()
        },
        onfetched: function(evt) {
            for (var header in evt.target.headers) {
                this.setHeader(header, evt.target.headers[header])
            }
            this.responseLength = evt.target.response.byteLength
            this.writeHeaders(evt.target.code)
            this.write(evt.target.response)
            this.finish()
        }
    }, WSC.BaseHandler.prototype)
    WSC.ProxyHandler = ProxyHandler

    function DirectoryEntryHandler(fs, request) {
        WSC.BaseHandler.prototype.constructor.call(this)
        this.fs = fs
        //this.debugInterval = setInterval( this.debug.bind(this), 1000)
        this.entry = null
        this.file = null
        this.readChunkSize = 4096 * 16
        this.fileOffset = 0
        this.fileEndOffset = 0
        this.bodyWritten = 0
        this.isDirectoryListing = false
        request.connection.stream.onclose = this.onClose.bind(this)
    }
    _.extend(DirectoryEntryHandler.prototype, {
        onClose: function() {
            //console.log('closed',this.request.path)
            clearInterval(this.debugInterval)
        },
        debug: function() {
            //console.log(this.request.connection.stream.sockId,'debug wb:',this.request.connection.stream.writeBuffer.size())
        },
        head: function() {
            this.get()
        },
        put: function() {
            if (! this.app.opts.optUpload) {
                this.responseLength = 0
                this.writeHeaders(400)
                this.finish()
                return
            }

            // if upload enabled in options...
            // check if file exists...
            this.fs.getByPath(this.request.path, this.onPutEntry.bind(this), true)
        },
        onPutEntry: function(entry) {
            var parts = this.request.path.split('/')
            var path = parts.slice(0,parts.length-1).join('/')
            var filename = parts[parts.length-1]

            if (entry && entry.error == 'path not found') {
                // good, we can upload it here ...
                this.fs.getByPath(path, this.onPutFolder.bind(this,filename))
            } else {
                var allowReplaceFile = true
                console.log('file already exists', entry)
                if (allowReplaceFile) {
                    // truncate file
                    var onremove = function(evt) {
                        this.fs.getByPath(path, this.onPutFolder.bind(this,filename))
                    }.bind(this)
                    entry.remove( onremove, onremove )
                }
            }
        },
        onPutFolder: function(filename, folder) {
            var onwritten = function(evt) {
                console.log('write complete',evt)
                // TODO write 400 in other cases...
                this.responseLength = 0
                this.writeHeaders(200)
                this.finish()
            }.bind(this)
            var body = this.request.body
            function onfile(entry) {
                if (entry && entry.isFile) {
                    function onwriter(writer) {
                        writer.onwrite = writer.onerror = onwritten
                        writer.write(new Blob([body]))
                    }
                    entry.createWriter(onwriter, onwriter)
                }
            }
            folder.getFile(filename, {create:true}, onfile, onfile)
        },
        get: function() {
            //this.request.connection.stream.onWriteBufferEmpty = this.onWriteBufferEmpty.bind(this)

            this.setHeader('accept-ranges','bytes')
            this.setHeader('connection','keep-alive')
            if (! this.fs) {
                this.write("error: need to select a directory to serve",500)
                return
            }
            //var path = decodeURI(this.request.path)

            // strip '/' off end of path

            if (this.rewrite_to) {
                this.fs.getByPath(this.rewrite_to, this.onEntry.bind(this))
            } else if (this.fs.isFile) {
                this.onEntry(this.fs)
            } else {
                this.fs.getByPath(this.request.path, this.onEntry.bind(this))
            }
        },
        doReadChunk: function() {
            //console.log(this.request.connection.stream.sockId, 'doReadChunk', this.fileOffset)
            var reader = new FileReader;

            var endByte = Math.min(this.fileOffset + this.readChunkSize,
                                   this.fileEndOffset)
            if (endByte >= this.file.size) {
                console.error('bad readChunk')
                console.assert(false)
            }

            //console.log('doReadChunk',this.fileOffset,endByte-this.fileOffset)
            reader.onload = this.onReadChunk.bind(this)
            reader.onerror = this.onReadChunk.bind(this)
            var blobSlice = this.file.slice(this.fileOffset, endByte + 1)
            var oldOffset = this.fileOffset
            this.fileOffset += (endByte - this.fileOffset) + 1
            //console.log('offset',oldOffset,this.fileOffset)
            reader.readAsArrayBuffer(blobSlice)
        },
        onWriteBufferEmpty: function() {
            if (! this.file) {
                console.error('!this.file')
                debugger
                return
            }
            console.assert( this.bodyWritten <= this.responseLength )
            //console.log('onWriteBufferEmpty', this.bodyWritten, '/', this.responseLength)
            if (this.bodyWritten > this.responseLength) {
                console.assert(false)
            } else if (this.bodyWritten == this.responseLength) {
                this.request.connection.stream.onWriteBufferEmpty = null
                this.finish()
                return
            } else {
                if (this.request.connection.stream.remoteclosed) {
                    this.request.connection.close()
                    // still read?
                } else if (! this.request.connection.stream.closed) {
                    this.doReadChunk()
                }
            }
        },
        onReadChunk: function(evt) {
            //console.log('onReadChunk')
            if (evt.target.result) {
                this.bodyWritten += evt.target.result.byteLength
                if (this.bodyWritten >= this.responseLength) {
                    //this.request.connection.stream.onWriteBufferEmpty = null
                }
                //console.log(this.request.connection.stream.sockId,'write',evt.target.result.byteLength)
                this.request.connection.write(evt.target.result)
            } else {
                console.error('onreadchunk error',evt.target.error)
                this.request.connection.close()
            }
        },
        onEntry: function(entry) {
            this.entry = entry

            if (this.entry && this.entry.isDirectory && ! this.request.origpath.endsWith('/')) {
                var newloc = this.request.origpath + '/'
                this.setHeader('location', newloc) // XXX - encode latin-1 somehow?
                this.responseLength = 0
                //console.log('redirect ->',newloc)
                this.writeHeaders(301)

                this.finish()
                return
            }



            if (this.request.connection.stream.closed) {
                console.warn(this.request.connection.stream.sockId,'request closed while processing request')
                return
            }
            if (! entry) {
                if (this.request.method == "HEAD") {
                    this.responseLength = 0
                    this.writeHeaders(404)
                    this.finish()
                } else {
                    this.write('no entry',404)
                }
            } else if (entry.error) {
                if (this.request.method == "HEAD") {
                    this.responseLength = 0
                    this.writeHeaders(404)
                    this.finish()
                } else {
                    this.write('entry not found: ' + (this.rewrite_to || this.request.path), 404)
                }
            } else if (entry.isFile) {
                this.renderFileContents(entry)
            } else {
                // directory
                var reader = entry.createReader()
                var allresults = []
                this.isDirectoryListing = true

                function onreaderr(evt) {
                    WSC.entryCache.unset(this.entry.filesystem.name + this.entry.fullPath)
                    console.error('error reading dir',evt)
                    this.request.connection.close()
                }

                function alldone(results) {
                    if (this.app.opts.optRenderIndex) {
                        for (var i=0; i<results.length; i++) {
                            if (results[i].name == 'index.xhtml' || results[i].name == 'index.xhtm') {
                                this.setHeader('content-type','application/xhtml+xml; charset=utf-8')
                                this.renderFileContents(results[i])
                                return
                            }
                            else if (results[i].name == 'index.html' || results[i].name == 'index.htm') {
                                this.setHeader('content-type','text/html; charset=utf-8')
                                this.renderFileContents(results[i])
                                return
                            }
                        }
                    }
                    if (this.request.arguments && this.request.arguments.json == '1' ||
                        (this.request.headers['accept'] && this.request.headers['accept'].toLowerCase() == 'applicaiton/json')
                       ) {
                        this.renderDirectoryListingJSON(results)
                    } else if (this.request.arguments && this.request.arguments.static == '1' ||
                        this.request.arguments.static == 'true' ||
						this.app.opts.optStatic
                       ) {
                        this.renderDirectoryListing(results)
                    } else {
                        this.renderDirectoryListingTemplate(results)
                    }
                }

                function onreadsuccess(results) {
                    //console.log('onreadsuccess',results.length)
                    if (results.length == 0) {
                        alldone.bind(this)(allresults)
                    } else {
                        allresults = allresults.concat( results )
                        reader.readEntries( onreadsuccess.bind(this),
                                            onreaderr.bind(this) )
                    }
                }

                //console.log('readentries')
                reader.readEntries( onreadsuccess.bind(this),
                                    onreaderr.bind(this))
            }
        },
        renderFileContents: function(entry, file) {
            getEntryFile(entry, function(file) {
                if (file instanceof DOMException) {
                    this.write("File not found", 404)
                    this.finish()
                    return
                }
                this.file = file
                if (this.request.method == "HEAD") {
                    this.responseLength = this.file.size
                    this.writeHeaders(200)
                    this.finish()

                } else if (this.file.size > this.readChunkSize * 8 ||
                           this.request.headers['range']) {
                    this.request.connection.stream.onWriteBufferEmpty = this.onWriteBufferEmpty.bind(this)

                    if (this.request.headers['range']) {
                        console.log(this.request.connection.stream.sockId,'RANGE',this.request.headers['range'])

                        var range = this.request.headers['range'].split('=')[1].trim()

                        var rparts = range.split('-')
                        if (! rparts[1]) {
                            this.fileOffset = parseInt(rparts[0])
                            this.fileEndOffset = this.file.size - 1
                            this.responseLength = this.file.size - this.fileOffset;
                            this.setHeader('content-range','bytes '+this.fileOffset+'-'+(this.file.size-1)+'/'+this.file.size)
                            if (this.fileOffset == 0) {
                                this.writeHeaders(200)
                            } else {
                                this.writeHeaders(206)
                            }

                        } else {
                            //debugger // TODO -- add support for partial file fetching...
                            //this.writeHeaders(500)
                            this.fileOffset = parseInt(rparts[0])
                            this.fileEndOffset = parseInt(rparts[1])
                            this.responseLength = this.fileEndOffset - this.fileOffset + 1
                            this.setHeader('content-range','bytes '+this.fileOffset+'-'+(this.fileEndOffset)+'/'+this.file.size)
                            this.writeHeaders(206)
                        }


                    } else {
                        if (_DEBUG) {
                            console.log('large file, streaming mode!')
                        }
                        this.fileOffset = 0
                        this.fileEndOffset = this.file.size - 1
                        this.responseLength = this.file.size
                        this.writeHeaders(200)
                    }
                    
                    



                } else {
                    //console.log(entry,file)
                    var fr = new FileReader
                    var cb = this.onReadEntry.bind(this)
                    fr.onload = cb
                    fr.onerror = cb
                    fr.readAsArrayBuffer(file)
                }
            }.bind(this))
        },
        entriesSortFunc: function(a,b) {
            var anl = a.name.toLowerCase()
            var bnl = b.name.toLowerCase()
            if (a.isDirectory && b.isDirectory) {
                return anl.localeCompare(bnl)
            } else if (a.isDirectory) {
                return -1
            } else if (b.isDirectory) {
                return 1
            } else {
                /// both files
                return anl.localeCompare(bnl)
            }
                
        },
        renderDirectoryListingJSON: function(results) {
            this.setHeader('content-type','application/json; charset=utf-8')
            this.write(JSON.stringify(results.map(function(f) { return { name:f.name,
                                                                         fullPath:f.fullPath,
                                                                         isFile:f.isFile,
                                                                         isDirectory:f.isDirectory }
                                                              }), null, 2))
        },
        renderDirectoryListingTemplate: function(results) {
            if (! WSC.template_data) {
                return this.renderDirectoryListing(results)
            }

            this.setHeader('transfer-encoding','chunked')
            this.writeHeaders(200)
            this.writeChunk(WSC.template_data )
            var html = ['<script>start("current directory...")</script>',
                        '<script>addRow("..","..",1,"170 B","10/2/15, 8:32:45 PM");</script>']

            for (var i=0; i<results.length; i++) {
                var rawname = results[i].name
                var name = encodeURIComponent(results[i].name)
                var isdirectory = results[i].isDirectory
                var filesize = '""'
                //var modified = '10/13/15, 10:38:40 AM'
                var modified = ''
                // raw, urlencoded, isdirectory, size, 
                html.push('<script>addRow("'+rawname+'","'+name+'",'+isdirectory+','+filesize+',"'+modified+'");</script>')
            }
            var data = html.join('\n')
            data = new TextEncoder('utf-8').encode(data).buffer
            this.writeChunk(data)
            this.request.connection.write(WSC.str2ab('0\r\n\r\n'))
            this.finish()
        },
        renderDirectoryListing: function(results) {
            var html = ['<html>']
            html.push('<style>li.directory {background:#aab}</style>')
            html.push('<a href="../?static=1">parent</a>')
            html.push('<ul>')
            results.sort( this.entriesSortFunc )
            
            // TODO -- add sorting (by query parameter?) show file size?

            for (var i=0; i<results.length; i++) {
                var name = _.escape(results[i].name)
                if (results[i].isDirectory) {
                    html.push('<li class="directory"><a href="' + name + '/?static=1">' + name + '</a></li>')
                } else {
                    html.push('<li><a href="' + name + '?static=1">' + name + '</a></li>')
                }
            }
            html.push('</ul></html>')
            this.setHeader('content-type','text/html; charset=utf-8')
            this.write(html.join('\n'))
        },
        onReadEntry: function(evt) {
            if (evt.type == 'error') {
                console.error('error reading',evt.target.error)
                // clear this file from cache...
                WSC.entryFileCache.unset( this.entry.filesystem.name + '/' + this.entry.fullPath )

                this.request.connection.close()
            } else {
            // set mime types etc?
                this.write(evt.target.result)
            }

        }
    }, WSC.BaseHandler.prototype)

    if (chrome.runtime.id == WSC.store_id) {
        
        chrome.runtime.getPackageDirectoryEntry( function(pentry) {
            var template_filename = 'directory-listing-template.html'
            var onfile = function(e) {
                if (e instanceof DOMException) {
                    console.error('template fetch:',e)
                } else {
                    var onfile = function(file) {
                        var onread = function(evt) {
                            WSC.template_data = evt.target.result
                        }
                        var fr = new FileReader
                        fr.onload = onread
                        fr.onerror = onread
                        fr.readAsArrayBuffer(file)
                    }
                    e.file( onfile, onfile )
                }
            }
            pentry.getFile(template_filename,{create:false},onfile,onfile)
        })
    }


    WSC.DirectoryEntryHandler = DirectoryEntryHandler

})();


/***/ }),
/* 8 */
/***/ (function(module, exports) {

document.addEventListener("DOMContentLoaded",function(){
    document.getElementById('configure').addEventListener('click',function(){
        chrome.runtime.getBackgroundPage(function(bg){
            bg.hidden_click_configure()
            //chrome.app.window.current().close()
        })
    })
})

/***/ }),
/* 9 */
/***/ (function(module, exports) {

(function() {
var HTTPRESPONSES = {
    "200": "OK", 
    "201": "Created", 
    "202": "Accepted", 
    "203": "Non-Authoritative Information", 
    "204": "No Content", 
    "205": "Reset Content", 
    "206": "Partial Content", 
    "400": "Bad Request", 
    "401": "Unauthorized", 
    "402": "Payment Required", 
    "403": "Forbidden", 
    "404": "Not Found", 
    "405": "Method Not Allowed", 
    "406": "Not Acceptable", 
    "407": "Proxy Authentication Required", 
    "408": "Request Timeout", 
    "409": "Conflict", 
    "410": "Gone", 
    "411": "Length Required", 
    "412": "Precondition Failed", 
    "413": "Request Entity Too Large", 
    "414": "Request-URI Too Long", 
    "415": "Unsupported Media Type", 
    "416": "Requested Range Not Satisfiable", 
    "417": "Expectation Failed", 
    "100": "Continue", 
    "101": "Switching Protocols", 
    "300": "Multiple Choices", 
    "301": "Moved Permanently", 
    "302": "Found", 
    "303": "See Other", 
    "304": "Not Modified", 
    "305": "Use Proxy", 
    "306": "(Unused)", 
    "307": "Temporary Redirect", 
    "500": "Internal Server Error", 
    "501": "Not Implemented", 
    "502": "Bad Gateway", 
    "503": "Service Unavailable", 
    "504": "Gateway Timeout", 
    "505": "HTTP Version Not Supported"
}
WSC.HTTPRESPONSES = HTTPRESPONSES
})();


/***/ }),
/* 10 */
/***/ (function(module, exports) {

window.reload = chrome.runtime.reload

function addinterfaces() {
    var version = getchromeversion()
    if (version >= 44) {
        chrome.system.network.getNetworkInterfaces( function(result) {
            if (result) {
                var wport = document.getElementById('choose-port').value;
                console.log("port found: " + wport);
                
                var contLocal = document.getElementById('local-interface');
                if (typeof contLocal !== 'undefined') {
                    while (contLocal.firstChild) {
                        contLocal.removeChild(contLocal.firstChild);
                    }                
                    var a = document.createElement('a')
                    a.target = "_blank";
                    var href = 'http://127.0.0.1:' + wport;
                    a.innerText = href;
                    a.href = href;
                    contLocal.appendChild(a);

                } else{
                  console.log("not contLocal!");
                }
                
                var cont = document.getElementById('other-interfaces')
                if (typeof cont !== 'undefined') {
                    while (cont.firstChild) {
                        cont.removeChild(cont.firstChild);
                    }                
                
                    for (var i=0; i<result.length; i++) {
                        console.log('network interface:',result[i])
                        if (result[i].prefixLength == 24) {
                            var a = document.createElement('a')
                            a.target = "_blank";
                            var href = 'http://' + result[i].address + ':' + wport;
                            a.innerText = href;
                            a.href = href;
                            cont.appendChild(a);
                        }
                    }
                } else{
                  console.log("not cont!");
                }
            }
        })
    }
}


chrome.runtime.getBackgroundPage( function(bg) {
    console.log('got bg page')
    window.bg = bg;
    
    document.getElementById('status').innerText = 'OK'

    addinterfaces()

    function choosefolder() {
        chrome.fileSystem.chooseEntry({type:'openDirectory'}, onchoosefolder)
    }

    function onchoosefolder(entry) {
        if (entry) {
            window.entry = entry
            bg.entry = entry
            bg.haveentry(entry)
            var retainstr = chrome.fileSystem.retainEntry(entry)
            var d = {'retainstr':retainstr}
            chrome.storage.local.set(d)
            document.getElementById('curfolder').innerText = d['retainstr']
            document.getElementById('status').innerText = 'OK'
            console.log('set retainstr!')
        }
    }

    document.getElementById('choose-folder').addEventListener('click', choosefolder)

    function onRestart() {
        var input = document.getElementById('choose-port');
        if (!input) return;
    
        var wport = input.value;
        console.log("port found: " + wport);
        addinterfaces()
        if (bg) {
            bg.restart(parseInt(wport));
        }
    }

    document.getElementById('restart').addEventListener('click', onRestart)



    chrome.storage.local.get('retainstr',function(d) {
        if (d['retainstr']) {
            chrome.fileSystem.restoreEntry(d['retainstr'], function(entry) {
                if (entry) {
                    window.entry = entry
                    bg.entry = entry
                    bg.haveentry(entry)
                } else {
                    document.getElementById('status').innerText = 'DIRECTORY MISSING. CHOOSE AGAIN.'                    
                }
            })
            document.getElementById('curfolder').innerText = d['retainstr']
        }
    })




})


/***/ }),
/* 11 */
/***/ (function(module, exports) {

// add this file to your "blackbox" e.g. blackboxing, making devtools not show logs as coming from here
(function() {
	if (console.clog) { return }
	var L = {
		UPNP: { show: true, color:'green' },
		WSC: { show: true, color:'green' }
	}
    Object.keys(L).forEach( function(k) { L[k].name = k } )
    window.ORIGINALCONSOLE = {log:console.log, warn:console.warn, error:console.error}
    window.LOGLISTENERS = []
    function wrappedlog(method) {
        var wrapped = function() {
            var args = Array.prototype.slice.call(arguments)
            ORIGINALCONSOLE[method].apply(console,args)
            if (method == 'error') {
                args = ['%cError','color:red'].concat(args)
            } else if (method == 'warn') {
                args = ['%cWarn','color:orange'].concat(args)
            }
        }
        return wrapped
    }
    
    console.log = wrappedlog('log')
    console.warn = wrappedlog('warn')
    console.error = wrappedlog('error')
    console.clog = function() {
        if (! WSC.DEBUG) { return }
        // category specific logging
        var tolog = arguments[0]
		tolog = L[tolog]
        if (tolog === undefined) {
            var args = Array.prototype.slice.call(arguments,1,arguments.length)
            args = ['%c' + 'UNDEF', 'color:#ac0'].concat(args)
            consolelog.apply(console,args)
        } else if (tolog.show) {
            var args = Array.prototype.slice.call(arguments,1,arguments.length)
            if (tolog.color) {
                args = ['%c' + tolog.name, 'color:'+tolog.color].concat(args)
            }
            ORIGINALCONSOLE.log.apply(console,args)
        }
    }
})();


/***/ }),
/* 12 */
/***/ (function(module, exports) {

(function() {
var MIMETYPES = {
  "123": "application/vnd.lotus-1-2-3", 
  "3dml": "text/vnd.in3d.3dml", 
  "3ds": "image/x-3ds", 
  "3g2": "video/3gpp2", 
  "3gp": "video/3gpp", 
  "7z": "application/x-7z-compressed", 
  "aab": "application/x-authorware-bin", 
  "aac": "audio/x-aac", 
  "aam": "application/x-authorware-map", 
  "aas": "application/x-authorware-seg", 
  "abw": "application/x-abiword", 
  "ac": "application/pkix-attr-cert", 
  "acc": "application/vnd.americandynamics.acc", 
  "ace": "application/x-ace-compressed", 
  "acu": "application/vnd.acucobol", 
  "acutc": "application/vnd.acucorp", 
  "adp": "audio/adpcm", 
  "aep": "application/vnd.audiograph", 
  "afm": "application/x-font-type1", 
  "afp": "application/vnd.ibm.modcap", 
  "ahead": "application/vnd.ahead.space", 
  "ai": "application/postscript", 
  "aif": "audio/x-aiff", 
  "aifc": "audio/x-aiff", 
  "aiff": "audio/x-aiff", 
  "air": "application/vnd.adobe.air-application-installer-package+zip", 
  "ait": "application/vnd.dvb.ait", 
  "ami": "application/vnd.amiga.ami", 
  "apk": "application/vnd.android.package-archive", 
  "appcache": "text/cache-manifest", 
  "application": "application/x-ms-application", 
  "apr": "application/vnd.lotus-approach", 
  "arc": "application/x-freearc", 
  "asc": "application/pgp-signature", 
  "asf": "video/x-ms-asf", 
  "asm": "text/x-asm", 
  "aso": "application/vnd.accpac.simply.aso", 
  "asx": "video/x-ms-asf", 
  "atc": "application/vnd.acucorp", 
  "atom": "application/atom+xml", 
  "atomcat": "application/atomcat+xml", 
  "atomsvc": "application/atomsvc+xml", 
  "atx": "application/vnd.antix.game-component", 
  "au": "audio/basic", 
  "avi": "video/x-msvideo", 
  "aw": "application/applixware", 
  "azf": "application/vnd.airzip.filesecure.azf", 
  "azs": "application/vnd.airzip.filesecure.azs", 
  "azw": "application/vnd.amazon.ebook", 
  "bat": "application/x-msdownload", 
  "bcpio": "application/x-bcpio", 
  "bdf": "application/x-font-bdf", 
  "bdm": "application/vnd.syncml.dm+wbxml", 
  "bed": "application/vnd.realvnc.bed", 
  "bh2": "application/vnd.fujitsu.oasysprs", 
  "bin": "application/octet-stream", 
  "blb": "application/x-blorb", 
  "blorb": "application/x-blorb", 
  "bmi": "application/vnd.bmi", 
  "bmp": "image/bmp", 
  "book": "application/vnd.framemaker", 
  "box": "application/vnd.previewsystems.box", 
  "boz": "application/x-bzip2", 
  "bpk": "application/octet-stream", 
  "btif": "image/prs.btif", 
  "bz": "application/x-bzip", 
  "bz2": "application/x-bzip2", 
  "c": "text/x-c", 
  "c11amc": "application/vnd.cluetrust.cartomobile-config", 
  "c11amz": "application/vnd.cluetrust.cartomobile-config-pkg", 
  "c4d": "application/vnd.clonk.c4group", 
  "c4f": "application/vnd.clonk.c4group", 
  "c4g": "application/vnd.clonk.c4group", 
  "c4p": "application/vnd.clonk.c4group", 
  "c4u": "application/vnd.clonk.c4group", 
  "cab": "application/vnd.ms-cab-compressed", 
  "caf": "audio/x-caf", 
  "cap": "application/vnd.tcpdump.pcap", 
  "car": "application/vnd.curl.car", 
  "cat": "application/vnd.ms-pki.seccat", 
  "cb7": "application/x-cbr", 
  "cba": "application/x-cbr", 
  "cbr": "application/x-cbr", 
  "cbt": "application/x-cbr", 
  "cbz": "application/x-cbr", 
  "cc": "text/x-c", 
  "cct": "application/x-director", 
  "ccxml": "application/ccxml+xml", 
  "cdbcmsg": "application/vnd.contact.cmsg", 
  "cdf": "application/x-netcdf", 
  "cdkey": "application/vnd.mediastation.cdkey", 
  "cdmia": "application/cdmi-capability", 
  "cdmic": "application/cdmi-container", 
  "cdmid": "application/cdmi-domain", 
  "cdmio": "application/cdmi-object", 
  "cdmiq": "application/cdmi-queue", 
  "cdx": "chemical/x-cdx", 
  "cdxml": "application/vnd.chemdraw+xml", 
  "cdy": "application/vnd.cinderella", 
  "cer": "application/pkix-cert", 
  "cfs": "application/x-cfs-compressed", 
  "cgm": "image/cgm", 
  "chat": "application/x-chat", 
  "chm": "application/vnd.ms-htmlhelp", 
  "chrt": "application/vnd.kde.kchart", 
  "cif": "chemical/x-cif", 
  "cii": "application/vnd.anser-web-certificate-issue-initiation", 
  "cil": "application/vnd.ms-artgalry", 
  "cla": "application/vnd.claymore", 
  "class": "application/java-vm", 
  "clkk": "application/vnd.crick.clicker.keyboard", 
  "clkp": "application/vnd.crick.clicker.palette", 
  "clkt": "application/vnd.crick.clicker.template", 
  "clkw": "application/vnd.crick.clicker.wordbank", 
  "clkx": "application/vnd.crick.clicker", 
  "clp": "application/x-msclip", 
  "cmc": "application/vnd.cosmocaller", 
  "cmdf": "chemical/x-cmdf", 
  "cml": "chemical/x-cml", 
  "cmp": "application/vnd.yellowriver-custom-menu", 
  "cmx": "image/x-cmx", 
  "cod": "application/vnd.rim.cod", 
  "com": "application/x-msdownload", 
  "conf": "text/plain", 
  "cpio": "application/x-cpio", 
  "cpp": "text/x-c", 
  "cpt": "application/mac-compactpro", 
  "crd": "application/x-mscardfile", 
  "crl": "application/pkix-crl", 
  "crt": "application/x-x509-ca-cert", 
  "cryptonote": "application/vnd.rig.cryptonote", 
  "csh": "application/x-csh", 
  "csml": "chemical/x-csml", 
  "csp": "application/vnd.commonspace", 
  "css": "text/css", 
  "cst": "application/x-director", 
  "csv": "text/csv", 
  "cu": "application/cu-seeme", 
  "curl": "text/vnd.curl", 
  "cww": "application/prs.cww", 
  "cxt": "application/x-director", 
  "cxx": "text/x-c", 
  "dae": "model/vnd.collada+xml", 
  "daf": "application/vnd.mobius.daf", 
  "dart": "application/vnd.dart", 
  "dataless": "application/vnd.fdsn.seed", 
  "davmount": "application/davmount+xml", 
  "dbk": "application/docbook+xml", 
  "dcr": "application/x-director", 
  "dcurl": "text/vnd.curl.dcurl", 
  "dd2": "application/vnd.oma.dd2+xml", 
  "ddd": "application/vnd.fujixerox.ddd", 
  "deb": "application/x-debian-package", 
  "def": "text/plain", 
  "deploy": "application/octet-stream", 
  "der": "application/x-x509-ca-cert", 
  "dfac": "application/vnd.dreamfactory", 
  "dgc": "application/x-dgc-compressed", 
  "dic": "text/x-c", 
  "dir": "application/x-director", 
  "dis": "application/vnd.mobius.dis", 
  "dist": "application/octet-stream", 
  "distz": "application/octet-stream", 
  "djv": "image/vnd.djvu", 
  "djvu": "image/vnd.djvu", 
  "dll": "application/x-msdownload", 
  "dmg": "application/x-apple-diskimage", 
  "dmp": "application/vnd.tcpdump.pcap", 
  "dms": "application/octet-stream", 
  "dna": "application/vnd.dna", 
  "doc": "application/msword", 
  "docm": "application/vnd.ms-word.document.macroenabled.12", 
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "dot": "application/msword", 
  "dotm": "application/vnd.ms-word.template.macroenabled.12", 
  "dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template", 
  "dp": "application/vnd.osgi.dp", 
  "dpg": "application/vnd.dpgraph", 
  "dra": "audio/vnd.dra", 
  "dsc": "text/prs.lines.tag", 
  "dssc": "application/dssc+der", 
  "dtb": "application/x-dtbook+xml", 
  "dtd": "application/xml-dtd", 
  "dts": "audio/vnd.dts", 
  "dtshd": "audio/vnd.dts.hd", 
  "dump": "application/octet-stream", 
  "dvb": "video/vnd.dvb.file", 
  "dvi": "application/x-dvi", 
  "dwf": "model/vnd.dwf", 
  "dwg": "image/vnd.dwg", 
  "dxf": "image/vnd.dxf", 
  "dxp": "application/vnd.spotfire.dxp", 
  "dxr": "application/x-director", 
  "ecelp4800": "audio/vnd.nuera.ecelp4800", 
  "ecelp7470": "audio/vnd.nuera.ecelp7470", 
  "ecelp9600": "audio/vnd.nuera.ecelp9600", 
  "ecma": "application/ecmascript", 
  "edm": "application/vnd.novadigm.edm", 
  "edx": "application/vnd.novadigm.edx", 
  "efif": "application/vnd.picsel", 
  "ei6": "application/vnd.pg.osasli", 
  "elc": "application/octet-stream", 
  "emf": "application/x-msmetafile", 
  "eml": "message/rfc822", 
  "emma": "application/emma+xml", 
  "emz": "application/x-msmetafile", 
  "eol": "audio/vnd.digital-winds", 
  "eot": "application/vnd.ms-fontobject", 
  "eps": "application/postscript", 
  "epub": "application/epub+zip", 
  "es3": "application/vnd.eszigno3+xml", 
  "esa": "application/vnd.osgi.subsystem", 
  "esf": "application/vnd.epson.esf", 
  "et3": "application/vnd.eszigno3+xml", 
  "etx": "text/x-setext", 
  "eva": "application/x-eva", 
  "evy": "application/x-envoy", 
  "exe": "application/x-msdownload", 
  "exi": "application/exi", 
  "ext": "application/vnd.novadigm.ext", 
  "ez": "application/andrew-inset", 
  "ez2": "application/vnd.ezpix-album", 
  "ez3": "application/vnd.ezpix-package", 
  "f": "text/x-fortran", 
  "f4v": "video/x-f4v", 
  "f77": "text/x-fortran", 
  "f90": "text/x-fortran", 
  "fbs": "image/vnd.fastbidsheet", 
  "fcdt": "application/vnd.adobe.formscentral.fcdt", 
  "fcs": "application/vnd.isac.fcs", 
  "fdf": "application/vnd.fdf", 
  "fe_launch": "application/vnd.denovo.fcselayout-link", 
  "fg5": "application/vnd.fujitsu.oasysgp", 
  "fgd": "application/x-director", 
  "fh": "image/x-freehand", 
  "fh4": "image/x-freehand", 
  "fh5": "image/x-freehand", 
  "fh7": "image/x-freehand", 
  "fhc": "image/x-freehand", 
  "fig": "application/x-xfig", 
  "flac": "audio/x-flac", 
  "fli": "video/x-fli", 
  "flo": "application/vnd.micrografx.flo", 
  "flv": "video/x-flv", 
  "flw": "application/vnd.kde.kivio", 
  "flx": "text/vnd.fmi.flexstor", 
  "fly": "text/vnd.fly", 
  "fm": "application/vnd.framemaker", 
  "fnc": "application/vnd.frogans.fnc", 
  "for": "text/x-fortran", 
  "fpx": "image/vnd.fpx", 
  "frame": "application/vnd.framemaker", 
  "fsc": "application/vnd.fsc.weblaunch", 
  "fst": "image/vnd.fst", 
  "ftc": "application/vnd.fluxtime.clip", 
  "fti": "application/vnd.anser-web-funds-transfer-initiation", 
  "fvt": "video/vnd.fvt", 
  "fxp": "application/vnd.adobe.fxp", 
  "fxpl": "application/vnd.adobe.fxp", 
  "fzs": "application/vnd.fuzzysheet", 
  "g2w": "application/vnd.geoplan", 
  "g3": "image/g3fax", 
  "g3w": "application/vnd.geospace", 
  "gac": "application/vnd.groove-account", 
  "gam": "application/x-tads", 
  "gbr": "application/rpki-ghostbusters", 
  "gca": "application/x-gca-compressed", 
  "gdl": "model/vnd.gdl", 
  "geo": "application/vnd.dynageo", 
  "gex": "application/vnd.geometry-explorer", 
  "ggb": "application/vnd.geogebra.file", 
  "ggt": "application/vnd.geogebra.tool", 
  "ghf": "application/vnd.groove-help", 
  "gif": "image/gif", 
  "gim": "application/vnd.groove-identity-message", 
  "gml": "application/gml+xml", 
  "gmx": "application/vnd.gmx", 
  "gnumeric": "application/x-gnumeric", 
  "gph": "application/vnd.flographit", 
  "gpx": "application/gpx+xml", 
  "gqf": "application/vnd.grafeq", 
  "gqs": "application/vnd.grafeq", 
  "gram": "application/srgs", 
  "gramps": "application/x-gramps-xml", 
  "gre": "application/vnd.geometry-explorer", 
  "grv": "application/vnd.groove-injector", 
  "grxml": "application/srgs+xml", 
  "gsf": "application/x-font-ghostscript", 
  "gtar": "application/x-gtar", 
  "gtm": "application/vnd.groove-tool-message", 
  "gtw": "model/vnd.gtw", 
  "gv": "text/vnd.graphviz", 
  "gxf": "application/gxf", 
  "gxt": "application/vnd.geonext", 
  "h": "text/x-c", 
  "h261": "video/h261", 
  "h263": "video/h263", 
  "h264": "video/h264", 
  "hal": "application/vnd.hal+xml", 
  "hbci": "application/vnd.hbci", 
  "hdf": "application/x-hdf", 
  "hh": "text/x-c", 
  "hlp": "application/winhlp", 
  "hpgl": "application/vnd.hp-hpgl", 
  "hpid": "application/vnd.hp-hpid", 
  "hps": "application/vnd.hp-hps", 
  "hqx": "application/mac-binhex40", 
  "htke": "application/vnd.kenameaapp", 
  "htm": "text/html", 
  "html": "text/html", 
  "hvd": "application/vnd.yamaha.hv-dic", 
  "hvp": "application/vnd.yamaha.hv-voice", 
  "hvs": "application/vnd.yamaha.hv-script", 
  "i2g": "application/vnd.intergeo", 
  "icc": "application/vnd.iccprofile", 
  "ice": "x-conference/x-cooltalk", 
  "icm": "application/vnd.iccprofile", 
  "ico": "image/x-icon", 
  "ics": "text/calendar", 
  "ief": "image/ief", 
  "ifb": "text/calendar", 
  "ifm": "application/vnd.shana.informed.formdata", 
  "iges": "model/iges", 
  "igl": "application/vnd.igloader", 
  "igm": "application/vnd.insors.igm", 
  "igs": "model/iges", 
  "igx": "application/vnd.micrografx.igx", 
  "iif": "application/vnd.shana.informed.interchange", 
  "imp": "application/vnd.accpac.simply.imp", 
  "ims": "application/vnd.ms-ims", 
  "in": "text/plain", 
  "ink": "application/inkml+xml", 
  "inkml": "application/inkml+xml", 
  "install": "application/x-install-instructions", 
  "iota": "application/vnd.astraea-software.iota", 
  "ipfix": "application/ipfix", 
  "ipk": "application/vnd.shana.informed.package", 
  "irm": "application/vnd.ibm.rights-management", 
  "irp": "application/vnd.irepository.package+xml", 
  "iso": "application/x-iso9660-image", 
  "itp": "application/vnd.shana.informed.formtemplate", 
  "ivp": "application/vnd.immervision-ivp", 
  "ivu": "application/vnd.immervision-ivu", 
  "jad": "text/vnd.sun.j2me.app-descriptor", 
  "jam": "application/vnd.jam", 
  "jar": "application/java-archive", 
  "java": "text/x-java-source", 
  "jisp": "application/vnd.jisp", 
  "jlt": "application/vnd.hp-jlyt", 
  "jnlp": "application/x-java-jnlp-file", 
  "joda": "application/vnd.joost.joda-archive", 
  "jpe": "image/jpeg", 
  "jpeg": "image/jpeg", 
  "jpg": "image/jpeg", 
  "jpgm": "video/jpm", 
  "jpgv": "video/jpeg", 
  "jpm": "video/jpm", 
  "js": "application/javascript", 
  "json": "application/json", 
  "jsonml": "application/jsonml+json", 
  "kar": "audio/midi", 
  "karbon": "application/vnd.kde.karbon", 
  "kfo": "application/vnd.kde.kformula", 
  "kia": "application/vnd.kidspiration", 
  "kml": "application/vnd.google-earth.kml+xml", 
  "kmz": "application/vnd.google-earth.kmz", 
  "kne": "application/vnd.kinar", 
  "knp": "application/vnd.kinar", 
  "kon": "application/vnd.kde.kontour", 
  "kpr": "application/vnd.kde.kpresenter", 
  "kpt": "application/vnd.kde.kpresenter", 
  "kpxx": "application/vnd.ds-keypoint", 
  "ksp": "application/vnd.kde.kspread", 
  "ktr": "application/vnd.kahootz", 
  "ktx": "image/ktx", 
  "ktz": "application/vnd.kahootz", 
  "kwd": "application/vnd.kde.kword", 
  "kwt": "application/vnd.kde.kword", 
  "lasxml": "application/vnd.las.las+xml", 
  "latex": "application/x-latex", 
  "lbd": "application/vnd.llamagraphics.life-balance.desktop", 
  "lbe": "application/vnd.llamagraphics.life-balance.exchange+xml", 
  "les": "application/vnd.hhe.lesson-player", 
  "lha": "application/x-lzh-compressed", 
  "link66": "application/vnd.route66.link66+xml", 
  "list": "text/plain", 
  "list3820": "application/vnd.ibm.modcap", 
  "listafp": "application/vnd.ibm.modcap", 
  "lnk": "application/x-ms-shortcut", 
  "log": "text/plain", 
  "lostxml": "application/lost+xml", 
  "lrf": "application/octet-stream", 
  "lrm": "application/vnd.ms-lrm", 
  "ltf": "application/vnd.frogans.ltf", 
  "lvp": "audio/vnd.lucent.voice", 
  "lwp": "application/vnd.lotus-wordpro", 
  "lzh": "application/x-lzh-compressed", 
  "m13": "application/x-msmediaview", 
  "m14": "application/x-msmediaview", 
  "m1v": "video/mpeg", 
  "m21": "application/mp21", 
  "m2a": "audio/mpeg", 
  "m2v": "video/mpeg", 
  "m3a": "audio/mpeg", 
  "m3u": "audio/x-mpegurl", 
  "m3u8": "application/vnd.apple.mpegurl", 
  "m4u": "video/vnd.mpegurl", 
  "m4v": "video/x-m4v", 
  "ma": "application/mathematica", 
  "mads": "application/mads+xml", 
  "mag": "application/vnd.ecowin.chart", 
  "maker": "application/vnd.framemaker", 
  "man": "text/troff", 
  "mar": "application/octet-stream", 
  "mathml": "application/mathml+xml", 
  "mb": "application/mathematica", 
  "mbk": "application/vnd.mobius.mbk", 
  "mbox": "application/mbox", 
  "mc1": "application/vnd.medcalcdata", 
  "mcd": "application/vnd.mcd", 
  "mcurl": "text/vnd.curl.mcurl", 
  "mdb": "application/x-msaccess", 
  "mdi": "image/vnd.ms-modi", 
  "me": "text/troff", 
  "mesh": "model/mesh", 
  "meta4": "application/metalink4+xml", 
  "metalink": "application/metalink+xml", 
  "mets": "application/mets+xml", 
  "mfm": "application/vnd.mfmp", 
  "mft": "application/rpki-manifest", 
  "mgp": "application/vnd.osgeo.mapguide.package", 
  "mgz": "application/vnd.proteus.magazine", 
  "mid": "audio/midi", 
  "midi": "audio/midi", 
  "mie": "application/x-mie", 
  "mif": "application/vnd.mif", 
  "mime": "message/rfc822", 
  "mj2": "video/mj2", 
  "mjp2": "video/mj2", 
  "mk3d": "video/x-matroska", 
  "mka": "audio/x-matroska", 
  "mks": "video/x-matroska", 
  "mkv": "video/x-matroska", 
  "mlp": "application/vnd.dolby.mlp", 
  "mmd": "application/vnd.chipnuts.karaoke-mmd", 
  "mmf": "application/vnd.smaf", 
  "mmr": "image/vnd.fujixerox.edmics-mmr", 
  "mng": "video/x-mng", 
  "mny": "application/x-msmoney", 
  "mobi": "application/x-mobipocket-ebook", 
  "mods": "application/mods+xml", 
  "mov": "video/quicktime", 
  "movie": "video/x-sgi-movie", 
  "mp2": "audio/mpeg", 
  "mp21": "application/mp21", 
  "mp2a": "audio/mpeg", 
  "mp3": "audio/mpeg", 
  "mp4": "video/mp4", 
  "mp4a": "audio/mp4", 
  "mp4s": "application/mp4", 
  "mp4v": "video/mp4", 
  "mpc": "application/vnd.mophun.certificate", 
  "mpe": "video/mpeg", 
  "mpeg": "video/mpeg", 
  "mpg": "video/mpeg", 
  "mpg4": "video/mp4", 
  "mpga": "audio/mpeg", 
  "mpkg": "application/vnd.apple.installer+xml", 
  "mpm": "application/vnd.blueice.multipass", 
  "mpn": "application/vnd.mophun.application", 
  "mpp": "application/vnd.ms-project", 
  "mpt": "application/vnd.ms-project", 
  "mpy": "application/vnd.ibm.minipay", 
  "mqy": "application/vnd.mobius.mqy", 
  "mrc": "application/marc", 
  "mrcx": "application/marcxml+xml", 
  "ms": "text/troff", 
  "mscml": "application/mediaservercontrol+xml", 
  "mseed": "application/vnd.fdsn.mseed", 
  "mseq": "application/vnd.mseq", 
  "msf": "application/vnd.epson.msf", 
  "msh": "model/mesh", 
  "msi": "application/x-msdownload", 
  "msl": "application/vnd.mobius.msl", 
  "msty": "application/vnd.muvee.style", 
  "mts": "model/vnd.mts", 
  "mus": "application/vnd.musician", 
  "musicxml": "application/vnd.recordare.musicxml+xml", 
  "mvb": "application/x-msmediaview", 
  "mwf": "application/vnd.mfer", 
  "mxf": "application/mxf", 
  "mxl": "application/vnd.recordare.musicxml", 
  "mxml": "application/xv+xml", 
  "mxs": "application/vnd.triscape.mxs", 
  "mxu": "video/vnd.mpegurl", 
  "n-gage": "application/vnd.nokia.n-gage.symbian.install", 
  "n3": "text/n3", 
  "nb": "application/mathematica", 
  "nbp": "application/vnd.wolfram.player", 
  "nc": "application/x-netcdf", 
  "ncx": "application/x-dtbncx+xml", 
  "nfo": "text/x-nfo", 
  "ngdat": "application/vnd.nokia.n-gage.data", 
  "nitf": "application/vnd.nitf", 
  "nlu": "application/vnd.neurolanguage.nlu", 
  "nml": "application/vnd.enliven", 
  "nnd": "application/vnd.noblenet-directory", 
  "nns": "application/vnd.noblenet-sealer", 
  "nnw": "application/vnd.noblenet-web", 
  "npx": "image/vnd.net-fpx", 
  "nsc": "application/x-conference", 
  "nsf": "application/vnd.lotus-notes", 
  "ntf": "application/vnd.nitf", 
  "nzb": "application/x-nzb", 
  "oa2": "application/vnd.fujitsu.oasys2", 
  "oa3": "application/vnd.fujitsu.oasys3", 
  "oas": "application/vnd.fujitsu.oasys", 
  "obd": "application/x-msbinder", 
  "obj": "application/x-tgif", 
  "oda": "application/oda", 
  "odb": "application/vnd.oasis.opendocument.database", 
  "odc": "application/vnd.oasis.opendocument.chart", 
  "odf": "application/vnd.oasis.opendocument.formula", 
  "odft": "application/vnd.oasis.opendocument.formula-template", 
  "odg": "application/vnd.oasis.opendocument.graphics", 
  "odi": "application/vnd.oasis.opendocument.image", 
  "odm": "application/vnd.oasis.opendocument.text-master", 
  "odp": "application/vnd.oasis.opendocument.presentation", 
  "ods": "application/vnd.oasis.opendocument.spreadsheet", 
  "odt": "application/vnd.oasis.opendocument.text", 
  "oga": "audio/ogg", 
  "ogg": "audio/ogg", 
  "ogv": "video/ogg", 
  "ogx": "application/ogg", 
  "omdoc": "application/omdoc+xml", 
  "onepkg": "application/onenote", 
  "onetmp": "application/onenote", 
  "onetoc": "application/onenote", 
  "onetoc2": "application/onenote", 
  "opf": "application/oebps-package+xml", 
  "opml": "text/x-opml", 
  "oprc": "application/vnd.palm", 
  "org": "application/vnd.lotus-organizer", 
  "osf": "application/vnd.yamaha.openscoreformat", 
  "osfpvg": "application/vnd.yamaha.openscoreformat.osfpvg+xml", 
  "otc": "application/vnd.oasis.opendocument.chart-template", 
  "otf": "application/x-font-otf", 
  "otg": "application/vnd.oasis.opendocument.graphics-template", 
  "oth": "application/vnd.oasis.opendocument.text-web", 
  "oti": "application/vnd.oasis.opendocument.image-template", 
  "otp": "application/vnd.oasis.opendocument.presentation-template", 
  "ots": "application/vnd.oasis.opendocument.spreadsheet-template", 
  "ott": "application/vnd.oasis.opendocument.text-template", 
  "oxps": "application/oxps", 
  "oxt": "application/vnd.openofficeorg.extension", 
  "p": "text/x-pascal", 
  "p10": "application/pkcs10", 
  "p12": "application/x-pkcs12", 
  "p7b": "application/x-pkcs7-certificates", 
  "p7c": "application/pkcs7-mime", 
  "p7m": "application/pkcs7-mime", 
  "p7r": "application/x-pkcs7-certreqresp", 
  "p7s": "application/pkcs7-signature", 
  "p8": "application/pkcs8", 
  "pas": "text/x-pascal", 
  "paw": "application/vnd.pawaafile", 
  "pbd": "application/vnd.powerbuilder6", 
  "pbm": "image/x-portable-bitmap", 
  "pcap": "application/vnd.tcpdump.pcap", 
  "pcf": "application/x-font-pcf", 
  "pcl": "application/vnd.hp-pcl", 
  "pclxl": "application/vnd.hp-pclxl", 
  "pct": "image/x-pict", 
  "pcurl": "application/vnd.curl.pcurl", 
  "pcx": "image/x-pcx", 
  "pdb": "application/vnd.palm", 
  "pdf": "application/pdf", 
  "pfa": "application/x-font-type1", 
  "pfb": "application/x-font-type1", 
  "pfm": "application/x-font-type1", 
  "pfr": "application/font-tdpfr", 
  "pfx": "application/x-pkcs12", 
  "pgm": "image/x-portable-graymap", 
  "pgn": "application/x-chess-pgn", 
  "pgp": "application/pgp-encrypted", 
  "pic": "image/x-pict", 
  "pkg": "application/octet-stream", 
  "pki": "application/pkixcmp", 
  "pkipath": "application/pkix-pkipath", 
  "plb": "application/vnd.3gpp.pic-bw-large", 
  "plc": "application/vnd.mobius.plc", 
  "plf": "application/vnd.pocketlearn", 
  "pls": "application/pls+xml", 
  "pml": "application/vnd.ctc-posml", 
  "png": "image/png", 
  "pnm": "image/x-portable-anymap", 
  "portpkg": "application/vnd.macports.portpkg", 
  "pot": "application/vnd.ms-powerpoint", 
  "potm": "application/vnd.ms-powerpoint.template.macroenabled.12", 
  "potx": "application/vnd.openxmlformats-officedocument.presentationml.template", 
  "ppam": "application/vnd.ms-powerpoint.addin.macroenabled.12", 
  "ppd": "application/vnd.cups-ppd", 
  "ppm": "image/x-portable-pixmap", 
  "pps": "application/vnd.ms-powerpoint", 
  "ppsm": "application/vnd.ms-powerpoint.slideshow.macroenabled.12", 
  "ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow", 
  "ppt": "application/vnd.ms-powerpoint", 
  "pptm": "application/vnd.ms-powerpoint.presentation.macroenabled.12", 
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
  "pqa": "application/vnd.palm", 
  "prc": "application/x-mobipocket-ebook", 
  "pre": "application/vnd.lotus-freelance", 
  "prf": "application/pics-rules", 
  "ps": "application/postscript", 
  "psb": "application/vnd.3gpp.pic-bw-small", 
  "psd": "image/vnd.adobe.photoshop", 
  "psf": "application/x-font-linux-psf", 
  "pskcxml": "application/pskc+xml", 
  "ptid": "application/vnd.pvi.ptid1", 
  "pub": "application/x-mspublisher", 
  "pvb": "application/vnd.3gpp.pic-bw-var", 
  "pwn": "application/vnd.3m.post-it-notes", 
  "pya": "audio/vnd.ms-playready.media.pya", 
  "pyv": "video/vnd.ms-playready.media.pyv", 
  "qam": "application/vnd.epson.quickanime", 
  "qbo": "application/vnd.intu.qbo", 
  "qfx": "application/vnd.intu.qfx", 
  "qps": "application/vnd.publishare-delta-tree", 
  "qt": "video/quicktime", 
  "qwd": "application/vnd.quark.quarkxpress", 
  "qwt": "application/vnd.quark.quarkxpress", 
  "qxb": "application/vnd.quark.quarkxpress", 
  "qxd": "application/vnd.quark.quarkxpress", 
  "qxl": "application/vnd.quark.quarkxpress", 
  "qxt": "application/vnd.quark.quarkxpress", 
  "ra": "audio/x-pn-realaudio", 
  "ram": "audio/x-pn-realaudio", 
  "rar": "application/x-rar-compressed", 
  "ras": "image/x-cmu-raster", 
  "rcprofile": "application/vnd.ipunplugged.rcprofile", 
  "rdf": "application/rdf+xml", 
  "rdz": "application/vnd.data-vision.rdz", 
  "rep": "application/vnd.businessobjects", 
  "res": "application/x-dtbresource+xml", 
  "rgb": "image/x-rgb", 
  "rif": "application/reginfo+xml", 
  "rip": "audio/vnd.rip", 
  "ris": "application/x-research-info-systems", 
  "rl": "application/resource-lists+xml", 
  "rlc": "image/vnd.fujixerox.edmics-rlc", 
  "rld": "application/resource-lists-diff+xml", 
  "rm": "application/vnd.rn-realmedia", 
  "rmi": "audio/midi", 
  "rmp": "audio/x-pn-realaudio-plugin", 
  "rms": "application/vnd.jcp.javame.midlet-rms", 
  "rmvb": "application/vnd.rn-realmedia-vbr", 
  "rnc": "application/relax-ng-compact-syntax", 
  "roa": "application/rpki-roa", 
  "roff": "text/troff", 
  "rp9": "application/vnd.cloanto.rp9", 
  "rpss": "application/vnd.nokia.radio-presets", 
  "rpst": "application/vnd.nokia.radio-preset", 
  "rq": "application/sparql-query", 
  "rs": "application/rls-services+xml", 
  "rsd": "application/rsd+xml", 
  "rss": "application/rss+xml", 
  "rtf": "application/rtf", 
  "rtx": "text/richtext", 
  "s": "text/x-asm", 
  "s3m": "audio/s3m", 
  "saf": "application/vnd.yamaha.smaf-audio", 
  "sbml": "application/sbml+xml", 
  "sc": "application/vnd.ibm.secure-container", 
  "scd": "application/x-msschedule", 
  "scm": "application/vnd.lotus-screencam", 
  "scq": "application/scvp-cv-request", 
  "scs": "application/scvp-cv-response", 
  "scurl": "text/vnd.curl.scurl", 
  "sda": "application/vnd.stardivision.draw", 
  "sdc": "application/vnd.stardivision.calc", 
  "sdd": "application/vnd.stardivision.impress", 
  "sdkd": "application/vnd.solent.sdkm+xml", 
  "sdkm": "application/vnd.solent.sdkm+xml", 
  "sdp": "application/sdp", 
  "sdw": "application/vnd.stardivision.writer", 
  "see": "application/vnd.seemail", 
  "seed": "application/vnd.fdsn.seed", 
  "sema": "application/vnd.sema", 
  "semd": "application/vnd.semd", 
  "semf": "application/vnd.semf", 
  "ser": "application/java-serialized-object", 
  "setpay": "application/set-payment-initiation", 
  "setreg": "application/set-registration-initiation", 
  "sfd-hdstx": "application/vnd.hydrostatix.sof-data", 
  "sfs": "application/vnd.spotfire.sfs", 
  "sfv": "text/x-sfv", 
  "sgi": "image/sgi", 
  "sgl": "application/vnd.stardivision.writer-global", 
  "sgm": "text/sgml", 
  "sgml": "text/sgml", 
  "sh": "application/x-sh", 
  "shar": "application/x-shar", 
  "shf": "application/shf+xml", 
  "sid": "image/x-mrsid-image", 
  "sig": "application/pgp-signature", 
  "sil": "audio/silk", 
  "silo": "model/mesh", 
  "sis": "application/vnd.symbian.install", 
  "sisx": "application/vnd.symbian.install", 
  "sit": "application/x-stuffit", 
  "sitx": "application/x-stuffitx", 
  "skd": "application/vnd.koan", 
  "skm": "application/vnd.koan", 
  "skp": "application/vnd.koan", 
  "skt": "application/vnd.koan", 
  "sldm": "application/vnd.ms-powerpoint.slide.macroenabled.12", 
  "sldx": "application/vnd.openxmlformats-officedocument.presentationml.slide", 
  "slt": "application/vnd.epson.salt", 
  "sm": "application/vnd.stepmania.stepchart", 
  "smf": "application/vnd.stardivision.math", 
  "smi": "application/smil+xml", 
  "smil": "application/smil+xml", 
  "smv": "video/x-smv", 
  "smzip": "application/vnd.stepmania.package", 
  "snd": "audio/basic", 
  "snf": "application/x-font-snf", 
  "so": "application/octet-stream", 
  "spc": "application/x-pkcs7-certificates", 
  "spf": "application/vnd.yamaha.smaf-phrase", 
  "spl": "application/x-futuresplash", 
  "spot": "text/vnd.in3d.spot", 
  "spp": "application/scvp-vp-response", 
  "spq": "application/scvp-vp-request", 
  "spx": "audio/ogg", 
  "sql": "application/x-sql", 
  "src": "application/x-wais-source", 
  "srt": "application/x-subrip", 
  "sru": "application/sru+xml", 
  "srx": "application/sparql-results+xml", 
  "ssdl": "application/ssdl+xml", 
  "sse": "application/vnd.kodak-descriptor", 
  "ssf": "application/vnd.epson.ssf", 
  "ssml": "application/ssml+xml", 
  "st": "application/vnd.sailingtracker.track", 
  "stc": "application/vnd.sun.xml.calc.template", 
  "std": "application/vnd.sun.xml.draw.template", 
  "stf": "application/vnd.wt.stf", 
  "sti": "application/vnd.sun.xml.impress.template", 
  "stk": "application/hyperstudio", 
  "stl": "application/vnd.ms-pki.stl", 
  "str": "application/vnd.pg.format", 
  "stw": "application/vnd.sun.xml.writer.template", 
  "sub": "text/vnd.dvb.subtitle", 
  "sus": "application/vnd.sus-calendar", 
  "susp": "application/vnd.sus-calendar", 
  "sv4cpio": "application/x-sv4cpio", 
  "sv4crc": "application/x-sv4crc", 
  "svc": "application/vnd.dvb.service", 
  "svd": "application/vnd.svd", 
  "svg": "image/svg+xml", 
  "svgz": "image/svg+xml", 
  "swa": "application/x-director", 
  "swf": "application/x-shockwave-flash", 
  "swi": "application/vnd.aristanetworks.swi", 
  "sxc": "application/vnd.sun.xml.calc", 
  "sxd": "application/vnd.sun.xml.draw", 
  "sxg": "application/vnd.sun.xml.writer.global", 
  "sxi": "application/vnd.sun.xml.impress", 
  "sxm": "application/vnd.sun.xml.math", 
  "sxw": "application/vnd.sun.xml.writer", 
  "t": "text/troff", 
  "t3": "application/x-t3vm-image", 
  "taglet": "application/vnd.mynfc", 
  "tao": "application/vnd.tao.intent-module-archive", 
  "tar": "application/x-tar", 
  "tcap": "application/vnd.3gpp2.tcap", 
  "tcl": "application/x-tcl", 
  "teacher": "application/vnd.smart.teacher", 
  "tei": "application/tei+xml", 
  "teicorpus": "application/tei+xml", 
  "tex": "application/x-tex", 
  "texi": "application/x-texinfo", 
  "texinfo": "application/x-texinfo", 
  "text": "text/plain", 
  "tfi": "application/thraud+xml", 
  "tfm": "application/x-tex-tfm", 
  "tga": "image/x-tga", 
  "thmx": "application/vnd.ms-officetheme", 
  "tif": "image/tiff", 
  "tiff": "image/tiff", 
  "tmo": "application/vnd.tmobile-livetv", 
  "torrent": "application/x-bittorrent", 
  "tpl": "application/vnd.groove-tool-template", 
  "tpt": "application/vnd.trid.tpt", 
  "tr": "text/troff", 
  "tra": "application/vnd.trueapp", 
  "trm": "application/x-msterminal", 
  "tsd": "application/timestamped-data", 
  "tsv": "text/tab-separated-values", 
  "ttc": "application/x-font-ttf", 
  "ttf": "application/x-font-ttf", 
  "ttl": "text/turtle", 
  "twd": "application/vnd.simtech-mindmapper", 
  "twds": "application/vnd.simtech-mindmapper", 
  "txd": "application/vnd.genomatix.tuxedo", 
  "txf": "application/vnd.mobius.txf", 
  "txt": "text/plain", 
  "u32": "application/x-authorware-bin", 
  "udeb": "application/x-debian-package", 
  "ufd": "application/vnd.ufdl", 
  "ufdl": "application/vnd.ufdl", 
  "ulx": "application/x-glulx", 
  "umj": "application/vnd.umajin", 
  "unityweb": "application/vnd.unity", 
  "uoml": "application/vnd.uoml+xml", 
  "uri": "text/uri-list", 
  "uris": "text/uri-list", 
  "urls": "text/uri-list", 
  "ustar": "application/x-ustar", 
  "utz": "application/vnd.uiq.theme", 
  "uu": "text/x-uuencode", 
  "uva": "audio/vnd.dece.audio", 
  "uvd": "application/vnd.dece.data", 
  "uvf": "application/vnd.dece.data", 
  "uvg": "image/vnd.dece.graphic", 
  "uvh": "video/vnd.dece.hd", 
  "uvi": "image/vnd.dece.graphic", 
  "uvm": "video/vnd.dece.mobile", 
  "uvp": "video/vnd.dece.pd", 
  "uvs": "video/vnd.dece.sd", 
  "uvt": "application/vnd.dece.ttml+xml", 
  "uvu": "video/vnd.uvvu.mp4", 
  "uvv": "video/vnd.dece.video", 
  "uvva": "audio/vnd.dece.audio", 
  "uvvd": "application/vnd.dece.data", 
  "uvvf": "application/vnd.dece.data", 
  "uvvg": "image/vnd.dece.graphic", 
  "uvvh": "video/vnd.dece.hd", 
  "uvvi": "image/vnd.dece.graphic", 
  "uvvm": "video/vnd.dece.mobile", 
  "uvvp": "video/vnd.dece.pd", 
  "uvvs": "video/vnd.dece.sd", 
  "uvvt": "application/vnd.dece.ttml+xml", 
  "uvvu": "video/vnd.uvvu.mp4", 
  "uvvv": "video/vnd.dece.video", 
  "uvvx": "application/vnd.dece.unspecified", 
  "uvvz": "application/vnd.dece.zip", 
  "uvx": "application/vnd.dece.unspecified", 
  "uvz": "application/vnd.dece.zip", 
  "vcard": "text/vcard", 
  "vcd": "application/x-cdlink", 
  "vcf": "text/x-vcard", 
  "vcg": "application/vnd.groove-vcard", 
  "vcs": "text/x-vcalendar", 
  "vcx": "application/vnd.vcx", 
  "vis": "application/vnd.visionary", 
  "viv": "video/vnd.vivo", 
  "vob": "video/x-ms-vob", 
  "vor": "application/vnd.stardivision.writer", 
  "vox": "application/x-authorware-bin", 
  "vrml": "model/vrml", 
  "vsd": "application/vnd.visio", 
  "vsf": "application/vnd.vsf", 
  "vss": "application/vnd.visio", 
  "vst": "application/vnd.visio", 
  "vsw": "application/vnd.visio", 
  "vtu": "model/vnd.vtu",
  "vtt": "text/vtt",
  "vxml": "application/voicexml+xml", 
  "w3d": "application/x-director", 
  "wad": "application/x-doom", 
  "wav": "audio/x-wav", 
  "wax": "audio/x-ms-wax", 
  "wbmp": "image/vnd.wap.wbmp", 
  "wbs": "application/vnd.criticaltools.wbs+xml", 
  "wbxml": "application/vnd.wap.wbxml", 
  "wcm": "application/vnd.ms-works", 
  "wdb": "application/vnd.ms-works", 
  "wdp": "image/vnd.ms-photo", 
  "weba": "audio/webm", 
  "webm": "video/webm", 
  "webp": "image/webp", 
  "wg": "application/vnd.pmi.widget", 
  "wgt": "application/widget", 
  "wks": "application/vnd.ms-works", 
  "wm": "video/x-ms-wm", 
  "wma": "audio/x-ms-wma", 
  "wmd": "application/x-ms-wmd", 
  "wmf": "application/x-msmetafile", 
  "wml": "text/vnd.wap.wml", 
  "wmlc": "application/vnd.wap.wmlc", 
  "wmls": "text/vnd.wap.wmlscript", 
  "wmlsc": "application/vnd.wap.wmlscriptc", 
  "wmv": "video/x-ms-wmv", 
  "wmx": "video/x-ms-wmx", 
  "wmz": "application/x-msmetafile", 
  "woff": "application/x-font-woff", 
  "wpd": "application/vnd.wordperfect", 
  "wpl": "application/vnd.ms-wpl", 
  "wps": "application/vnd.ms-works", 
  "wqd": "application/vnd.wqd", 
  "wri": "application/x-mswrite", 
  "wrl": "model/vrml", 
  "wsdl": "application/wsdl+xml", 
  "wspolicy": "application/wspolicy+xml", 
  "wtb": "application/vnd.webturbo", 
  "wvx": "video/x-ms-wvx", 
  "x32": "application/x-authorware-bin", 
  "x3d": "model/x3d+xml", 
  "x3db": "model/x3d+binary", 
  "x3dbz": "model/x3d+binary", 
  "x3dv": "model/x3d+vrml", 
  "x3dvz": "model/x3d+vrml", 
  "x3dz": "model/x3d+xml", 
  "xaml": "application/xaml+xml", 
  "xap": "application/x-silverlight-app", 
  "xar": "application/vnd.xara", 
  "xbap": "application/x-ms-xbap", 
  "xbd": "application/vnd.fujixerox.docuworks.binder", 
  "xbm": "image/x-xbitmap", 
  "xdf": "application/xcap-diff+xml", 
  "xdm": "application/vnd.syncml.dm+xml", 
  "xdp": "application/vnd.adobe.xdp+xml", 
  "xdssc": "application/dssc+xml", 
  "xdw": "application/vnd.fujixerox.docuworks", 
  "xenc": "application/xenc+xml", 
  "xer": "application/patch-ops-error+xml", 
  "xfdf": "application/vnd.adobe.xfdf", 
  "xfdl": "application/vnd.xfdl", 
  "xht": "application/xhtml+xml", 
  "xhtml": "application/xhtml+xml", 
  "xhvml": "application/xv+xml", 
  "xif": "image/vnd.xiff", 
  "xla": "application/vnd.ms-excel", 
  "xlam": "application/vnd.ms-excel.addin.macroenabled.12", 
  "xlc": "application/vnd.ms-excel", 
  "xlf": "application/x-xliff+xml", 
  "xlm": "application/vnd.ms-excel", 
  "xls": "application/vnd.ms-excel", 
  "xlsb": "application/vnd.ms-excel.sheet.binary.macroenabled.12", 
  "xlsm": "application/vnd.ms-excel.sheet.macroenabled.12", 
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
  "xlt": "application/vnd.ms-excel", 
  "xltm": "application/vnd.ms-excel.template.macroenabled.12", 
  "xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template", 
  "xlw": "application/vnd.ms-excel", 
  "xm": "audio/xm", 
  "xml": "application/xml", 
  "xo": "application/vnd.olpc-sugar", 
  "xop": "application/xop+xml", 
  "xpi": "application/x-xpinstall", 
  "xpl": "application/xproc+xml", 
  "xpm": "image/x-xpixmap", 
  "xpr": "application/vnd.is-xpr", 
  "xps": "application/vnd.ms-xpsdocument", 
  "xpw": "application/vnd.intercon.formnet", 
  "xpx": "application/vnd.intercon.formnet", 
  "xsl": "application/xml", 
  "xslt": "application/xslt+xml", 
  "xsm": "application/vnd.syncml+xml", 
  "xspf": "application/xspf+xml", 
  "xul": "application/vnd.mozilla.xul+xml", 
  "xvm": "application/xv+xml", 
  "xvml": "application/xv+xml", 
  "xwd": "image/x-xwindowdump", 
  "xyz": "chemical/x-xyz", 
  "xz": "application/x-xz", 
  "yang": "application/yang", 
  "yin": "application/yin+xml", 
  "z1": "application/x-zmachine", 
  "z2": "application/x-zmachine", 
  "z3": "application/x-zmachine", 
  "z4": "application/x-zmachine", 
  "z5": "application/x-zmachine", 
  "z6": "application/x-zmachine", 
  "z7": "application/x-zmachine", 
  "z8": "application/x-zmachine", 
  "zaz": "application/vnd.zzazz.deck+xml", 
  "zip": "application/zip", 
  "zir": "application/vnd.zul", 
  "zirz": "application/vnd.zul", 
  "zmm": "application/vnd.handheld-entertainment+xml"
};
var MIMECATEGORIES = {'video':[],'audio':[]}
for (var key in MIMETYPES) {
    if (MIMETYPES[key].startsWith('video/')) {
        MIMECATEGORIES['video'].push( key )
    } else if (MIMETYPES[key].startsWith('audio/')) {
        MIMECATEGORIES['audio'].push( key )
    }
}
WSC.MIMECATEGORIES = MIMECATEGORIES
WSC.MIMETYPES = MIMETYPES
})();


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__) {

"use strict";
throw new Error("Module parse failed: Unexpected token (2:8)\nYou may need an appropriate loader to handle this file type.\n| export class WSRequest {\n|   method;\n|   uri;\n|   version;");

/***/ }),
/* 14 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: The keyword 'private' is reserved (5:4)\nYou may need an appropriate loader to handle this file type.\n| \n|   constructor (\n|     private: _wsc: WSC\n|   ) { }\n|     var peerSockMap = {}");

/***/ }),
/* 15 */
/***/ (function(module, exports) {

// multiple devices are using the same extenal port. need to retry for other ports, or randomize chosen port based on GUID would be easiest.

// if switching from wlan to eth, it will fail to map the port because we mapped on the other interface.

// check current mappings and don't attempt to map to an externally bound port

// could choose port by hashing GUID + interface name

// inspiration from https://github.com/indutny/node-nat-upnp
(function() {
    function flatParseNode(node) {
        var d = {}
        for (var i=0; i<node.children.length; i++) {
            var c = node.children[i]
            if (c.children.length == 0) {
                d[c.tagName] = c.innerHTML
            }
        }
        return d
    }
    
    function UPNP(opts) {
        this.port = opts.port
		this.name = opts.name || 'web-server-chrome upnp.js'
		this.searchtime = opts.searchtime || 2000
        this.ssdp = new SSDP({port:opts.port, searchtime:this.searchtime})
        this.desiredServices = [
            'urn:schemas-upnp-org:service:WANIPConnection:1',
            'urn:schemas-upnp-org:service:WANPPPConnection:1'
        ]
        this.validGateway = null
        this.interfaces = null
        this.mapping = null
        this.searching = false
    }
    UPNP.prototype = {
        allDone: function(result) {
            if (this.callback) { this.callback(result) }
        },
        getInternalAddress: function() {
            var gatewayhost = this.validGateway.device.url.hostname
            var gateparts = gatewayhost.split('.')
            var match = false

            for (var i=gateparts.length-1;i--;i<1) {
                var pre = gateparts.slice(0, i).join('.')
                for (var j=0; j<this.interfaces.length; j++) {
                    if (this.interfaces[j].prefixLength == 24) {
                        var iparts = this.interfaces[j].address.split('.')
                        var ipre = iparts.slice(0,i).join('.')
                        if (ipre == pre) {
                            match = this.interfaces[j].address
                            console.clog("UPNP","selected internal address",match)
                            return match
                        }
                    }
                }

            }
        },
        reset: function(callback) {
            this.callback = callback
            console.clog('UPNP', "search start")
            this.searching = true
            chrome.system.network.getNetworkInterfaces( function(interfaces) {
                this.interfaces = interfaces
                this.devices = []
				// TODO -- remove event listeners
                this.ssdp.addEventListener('device',this.onDevice.bind(this))
                this.ssdp.addEventListener('stop',this.onSearchStop.bind(this))
                this.ssdp.search() // stop searching after a bit.
            }.bind(this) )
        },
        onSearchStop: function(info) {
            console.clog('UPNP', "search stop")
            this.searching = false
            this.getIP( function(gotIP) {
                if (! gotIP) { return this.allDone(false) }
                this.getMappings( function(mappings) {
                    if (! mappings) { return this.allDone(false) }
                    // check if already exists nice mapping we can use.
                    var internal = this.getInternalAddress()
                    console.clog('UPNP','got current mappings',mappings,'internal address',internal)
                    for (var i=0; i<mappings.length; i++) {
                        if (mappings[i].NewInternalClient == internal &&
                            mappings[i].NewInternalPort == this.port &&
                            mappings[i].NewProtocol == "TCP") {
                            // found it
                            console.clog('UPNP','already have port mapped')
                            this.mapping = mappings[i]
                            this.allDone(true)
                            return
                        }
                    }
                    this.addMapping(this.port, 'TCP', function(result) {
                        console.clog('UPNP', 'add TCP mapping result',result)
                        if (this.wantUDP) {
                            this.addMapping(this.port, 'UDP', function(result) {
                                console.clog('UPNP', 'add UDP mapping result',result)
                                this.allDone(result)
                            })
                        } else {
                            this.allDone(result)
                        }
                    }.bind(this))
                }.bind(this))
            }.bind(this))
        },
        onDevice: function(info) {
            console.clog('UPNP', 'found an internet gateway device',info)
            var device = new GatewayDevice(info)
            device.getDescription( function() {
                this.devices.push( device )
            }.bind(this) )
        },
        getWANServiceInfo: function() {
            var infos = []
            for (var i=0; i<this.devices.length; i++) {
                var services = this.devices[i].getService(this.desiredServices)
                if (services.length > 0) {
                    for (var j=0; j<services.length; j++) {
                        infos.push( {service:services[j],
                                     device:this.devices[i]} )
                    }
                }
            }
            //console.log('found WAN services',infos)
            return infos
        },
        addMapping: function(port, prot, callback) {
            this.changeMapping(port, prot, 1, callback)
        },
        removeMapping: function(port, prot, callback) {
            this.changeMapping(port, prot, 0, callback)
        },
        changeMapping: function(port, prot, enabled, callback) {
            if (! this.validGateway) {
                callback()
            } else {
                function onresult(evt) {
                    if (evt.target.code == 200) {
                        var resp = evt.target.responseXML.documentElement.querySelector(enabled?'AddPortMappingResponse':'DeletePortMappingResponse')
                        if (resp) {
                            callback(flatParseNode(resp))
                        } else {
                            callback({error:'unknown',evt:evt})
                        }
                    } else {
                        // maybe parse out the error all nice?
                        callback({error:evt.target.code,evt:evt})
                    }
                }
                var externalPort = port
				if (enabled) {
					var args = [
						['NewEnabled',enabled],
						['NewExternalPort',externalPort],
						['NewInternalClient',this.getInternalAddress()],
						['NewInternalPort',port],
						['NewLeaseDuration',0],
						['NewPortMappingDescription',this.name],
						['NewProtocol',prot],
						['NewRemoteHost',""]
					]
				} else {
					var args = [
//						['NewEnabled',enabled],
						['NewExternalPort',externalPort],
//						['NewInternalClient',this.getInternalAddress()],
//						['NewInternalPort',port],
						['NewProtocol',prot],
						['NewRemoteHost',""]
					]
				}
                this.validGateway.device.runService(this.validGateway.service,
                                                    enabled?'AddPortMapping':'DeletePortMapping',
                                                    args, onresult)
            }
        },
        getMappings: function(callback) {
            if (! this.validGateway) {
                callback()
            } else {
                var info = this.validGateway
                var idx = 0
                var allmappings = []

                function oneResult(evt) {
                    if (evt.target.code == 200) {
                        var resp = evt.target.responseXML.querySelector("GetGenericPortMappingEntryResponse")
                        var mapping = flatParseNode(resp)
                        allmappings.push(mapping)
                        getOne()
                    } else {
                        callback(allmappings)
                    }
                }

                function getOne() {
                    info.device.runService(info.service, 'GetGenericPortMappingEntry', [['NewPortMappingIndex',idx++]], oneResult)
                }
                getOne()
            }
        },
        getIP: function(callback) {
            var infos = this.getWANServiceInfo()
            var foundIP = null
            var returned = 0

            function oneResult(info, evt) {
                var doc = evt.target.responseXML // doc undefined sometimes
                var ipelt = doc.documentElement.querySelector('NewExternalIPAddress')
                var ip = ipelt ? ipelt.innerHTML : null

                returned++
                info.device.externalIP = ip
                if (ip) {
                    foundIP = ip
                    this.validGateway = info
                }
                
                if (returned == infos.length) {
                    callback(foundIP)
                }
            }
            
            if (infos && infos.length > 0) {
                for (var i=0; i<infos.length; i++) {
                    var info = infos[i]
                    info.device.runService(info.service,'GetExternalIPAddress',[],oneResult.bind(this, info))
                }
            } else {
                callback(null)
            }
        }
    }
    
    function GatewayDevice(info) {
        this.info = info
        this.description_url = info.headers.location
        this.url = new URL(this.description_url)
        this.services = []
        this.devices = []
        this.attributes = null
        this.externalIP = null
    }
    GatewayDevice.prototype = {
        runService: function(service, command, args, callback) {
            var xhr = new WSC.ChromeSocketXMLHttpRequest
            var url = this.url.origin + service.controlURL
            var body = '<?xml version="1.0"?>' +
                '<s:Envelope ' +
                'xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" ' +
                's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
                '<s:Body>' +
                '<u:' + command + ' xmlns:u=' +
                JSON.stringify(service.serviceType) + '>' +
                args.map(function(args) {
                    return '<' + args[0]+ '>' +
                        (args[1] === undefined ? '' : args[1]) +
                        '</' + args[0] + '>';
                }).join('') +
                '</u:' + command + '>' +
                '</s:Body>' +
                '</s:Envelope>';
            //console.log('req body',body)
            var payload = new TextEncoder('utf-8').encode(body).buffer
            var headers = {
                'content-type':'text/xml; charset="utf-8"',
                'connection':'close',
                'SOAPAction': JSON.stringify(service.serviceType) + '#' + command
            }
            for (var k in headers) {
                xhr.setRequestHeader(k, headers[k])
            }
            xhr.open("POST",url)
            xhr.setRequestHeader('connection','close')
            xhr.responseType = 'xml'
            xhr.send(payload)
            xhr.onload = xhr.onerror = xhr.ontimeout = callback
        },
        getDescription: function(callback) {
            var xhr = new WSC.ChromeSocketXMLHttpRequest
            console.clog('UPNP','query',this.description_url)
            xhr.open("GET",this.description_url)
            xhr.setRequestHeader('connection','close')
            xhr.responseType = 'xml'
            function onload(evt) {
                if (evt.target.code == 200) {
                    var doc = evt.target.responseXML

                    var devices = doc.documentElement.querySelectorAll('device')
                    for (var i=0; i<devices.length; i++) {
                        this.devices.push( flatParseNode(devices[i]) )
                    }

                    var services = doc.documentElement.querySelectorAll('service')
                    for (var i=0; i<services.length; i++) {
                        this.services.push( flatParseNode(services[i]) )
                    }

                }
                //console.log('got service info',this)
                callback()
            }
            xhr.onload = xhr.onerror = xhr.ontimeout = onload.bind(this)
            xhr.send()
        },
        getService: function(desired) {
            var matches = this.services.filter( function(service) {
                return desired.indexOf(service.serviceType) != -1
            })
            return matches
        }
    }
    
    function SSDP(opts) {
        this.port = opts.port
        this.wantUDP = opts.udp === undefined ? true : opts.udp
		this.searchtime = opts.searchtime
        this.multicast = '239.255.255.250'
        this.ssdpPort = 1900
        this.boundPort = null
        this.searchdevice = 'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
        this._onReceive = this.onReceive.bind(this)
        chrome.sockets.udp.onReceive.addListener( this._onReceive )
        chrome.sockets.udp.onReceiveError.addListener( this._onReceive )
        this.sockMap = {}
        this.lastError = null
        this.searching = false
        this._event_listeners = {}
    }

    SSDP.prototype = {
        addEventListener: function(name, callback) {
            if (! this._event_listeners[name]) {
                this._event_listeners[name] = []
            }
            this._event_listeners[name].push(callback)
        },
        trigger: function(name, data) {
            var cbs = this._event_listeners[name]
            if (cbs) {
                cbs.forEach( function(cb) { cb(data) } )
            }
        },
        onReceive: function(result) {
            var state = this.sockMap[result.socketId]
            var resp = new TextDecoder('utf-8').decode(result.data)
            if (! (resp.startsWith("HTTP") || resp.startsWith("NOTIFY"))) { return }
            var lines = resp.split('\r\n')
            var headers = {}
            // Parse headers from lines to hashmap
            lines.forEach(function(line) {
                line.replace(/^([^:]*)\s*:\s*(.*)$/, function (_, key, value) {
                    headers[key.toLowerCase()] = value;
                });
            })
            if (headers.st == this.searchdevice) {
                //console.log('SSDP response',headers,result)
                var device = {
                    remoteAddress: result.remoteAddress,
                    remotePort: result.remotePort,
                    socketId: 977,
                    headers: headers
                }
                this.trigger('device',device)
            }
        },
        error: function(data) {
            this.lastError = data
            console.clog('UPNP', "error",data)
            this.searching = false
            // clear out all sockets in sockmap
            this.cleanup()
            if (this.allDone) this.allDone(false)
        },
        cleanup: function() {
            for (var socketId in this.sockMap) {
                chrome.sockets.udp.close(parseInt(socketId))
            }
            this.sockMap = {}
            chrome.sockets.udp.onReceive.removeListener( this._onReceive )
            chrome.sockets.udp.onReceiveError.removeListener( this._onReceive )
        },
        stopsearch: function() {
            console.clog('UPNP', "stopping ssdp search")
            // stop searching, kill all sockets
            this.searching = false
            this.cleanup()
            this.trigger('stop')
        },
        search: function(opts) {
            if (this.searching) { return }
            setTimeout( this.stopsearch.bind(this), this.searchtime )
            var state = {opts:opts}
            chrome.sockets.udp.create(function(sockInfo) {
                state.sockInfo = sockInfo
                this.sockMap[sockInfo.socketId] = state
                chrome.sockets.udp.setMulticastTimeToLive(sockInfo.socketId, 1, function(result) {
                    if (result < 0) {
                        this.error({error:'ttl',code:result})
                    } else {
                        chrome.sockets.udp.bind(state.sockInfo.socketId, '0.0.0.0', 0, this.onbound.bind(this,state))
                    }
                }.bind(this))
            }.bind(this))
        },
        onbound: function(state,result) {
            if (result < 0) {
                this.error({error:'bind error',code:result})
                return
            }
            chrome.sockets.udp.getInfo(state.sockInfo.socketId, this.onInfo.bind(this,state))
        },
        onInfo: function(state, info) {
			var lasterr = chrome.runtime.lastError
			if (lasterr) {
				// socket was deleted in the meantime?
				this.error(lasterr)
				return
			}
            this.boundPort = info.localPort
            //console.clog('UPNP','bound')
            chrome.sockets.udp.joinGroup(state.sockInfo.socketId, this.multicast, this.onjoined.bind(this,state))
        },
        onjoined: function(state, result) {
            var lasterr = chrome.runtime.lastError
            if (lasterr) {
                this.error(lasterr)
                return
            }
            if (result < 0) {
                this.error({error:'join multicast',code:result})
                return
            }
            var req = 'M-SEARCH * HTTP/1.1\r\n' +
                'HOST: ' + this.multicast + ':' + this.ssdpPort + '\r\n' +
                'MAN: "ssdp:discover"\r\n' +
                'MX: 1\r\n' +
                'ST: ' + this.searchdevice + '\r\n' +
                '\r\n'

            chrome.sockets.udp.send(state.sockInfo.socketId, new TextEncoder('utf-8').encode(req).buffer, this.multicast, this.ssdpPort, this.onsend.bind(this))
            //console.clog('UPNP', 'sending to',this.multicast,this.ssdpPort)
        },
        onsend: function(result) {
            //console.clog('UPNP', 'sent result',result)
        }
    }
    WSC.UPNP = UPNP
})();


/***/ }),
/* 16 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (8:4)\nYou may need an appropriate loader to handle this file type.\n| \n| export class WebApplication {\n|   id: string;\n|   opts: any;\n|   handlers;");

/***/ }),
/* 17 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (4:16)\nYou may need an appropriate loader to handle this file type.\n| export class WebScoketHandler {\n| \n|   ws_connection = null\n|   close_code = null\n|   close_reason = null");

/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMTg3MmQ4MDhmZjA3Mjc0NjVmYWQiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9idWZmZXIudHMiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9jaHJvbWVzb2NrZXR4aHIudHMiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9jb25uZWN0aW9uLnRzIiwid2VicGFjazovLy8uL3dzYy1jaHJvbWUvd2ViLXNlcnZlci1jaHJvbWUvaGFuZGxlcnMudHMiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9oaWRkZW4udHMiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9odHRwbGliLnRzIiwid2VicGFjazovLy8uL3dzYy1jaHJvbWUvd2ViLXNlcnZlci1jaHJvbWUvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9sb2ctZnVsbC50cyIsIndlYnBhY2s6Ly8vLi93c2MtY2hyb21lL3dlYi1zZXJ2ZXItY2hyb21lL21pbWUudHMiLCJ3ZWJwYWNrOi8vLy4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS91cG5wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQSxxQkFBcUIscUJBQXFCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLHFCQUFxQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCLEtBQUs7QUFDdEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixLQUFLO0FBQ3RCO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7O0FDdExEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsNkJBQTZCO0FBQzNEO0FBQ0E7QUFDQSw2QkFBNkIsWUFBWTtBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSx1Q0FBdUM7QUFDdkMsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QztBQUN4QztBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQjtBQUNBLDBEQUEwRCxRQUFRO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsNEJBQTRCLGdCQUFnQjtBQUM1QztBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsc0JBQXNCO0FBQ2xEO0FBQ0EsU0FBUztBQUNUO0FBQ0EsOEJBQThCO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsOEJBQThCO0FBQzlCO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw0QkFBNEIsc0JBQXNCO0FBQ2xELGFBQWE7QUFDYiw0QkFBNEI7QUFDNUIsd0NBQXdDO0FBQ3hDLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5RkFBeUY7QUFDekY7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSx1QkFBdUIsU0FBUztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIsZ0JBQWdCO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7QUM1UkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbURBQW1EO0FBQ25EO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRTtBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQyxnQkFBZ0I7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDNUdEO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esc0I7QUFDQSw0QztBQUNBLDhCQUE4Qjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRFQUE0RSxxQkFBcUI7QUFDakc7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxREFBcUQ7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyxZQUFZO0FBQ2xELFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFDQUFxQyxrQkFBa0I7QUFDdkQ7QUFDQSxxRkFBcUY7QUFDckY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5RUFBeUU7QUFDekU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxpQkFBaUI7QUFDakI7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTs7QUFFQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQU1BLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7O0FBRUEsU0FBUztBQUNUO0FBQ0EsNERBQTREO0FBQzVELCtEQUErRCxTQUFTO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBLCtEQUErRDtBQUMvRCxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRkFBbUY7O0FBRW5GLHlCQUF5QixrQkFBa0I7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnSEFBZ0g7QUFDaEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw0Q0FBNEMsZ0JBQWdCO0FBQzVEO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSx5QkFBeUIsa0JBQWtCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFEQUFxRDtBQUNyRDtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLEtBQUs7O0FBRUw7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsYUFBYTtBQUMzRCxTQUFTO0FBQ1Q7OztBQUdBOztBQUVBLENBQUM7Ozs7Ozs7QUN2ZkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0wsQ0FBQyxDOzs7Ozs7QUNQRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7O0FDN0NEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCO0FBQ2pCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQjs7QUFFQSxpQ0FBaUMsaUJBQWlCO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQSx1Q0FBdUMscUJBQXFCO0FBQzVEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsS0FBSzs7Ozs7QUFLTCxDQUFDOzs7Ozs7O0FDbEhEO0FBQ0E7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQSxTQUFTLDRCQUE0QjtBQUNyQyxRQUFRO0FBQ1I7QUFDQSx5Q0FBeUMsZ0JBQWdCO0FBQ3pELDhCQUE4QjtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7Ozs7OztBQzNDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbitCRDs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsMkNBQTJDO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0M7QUFDaEMsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDBDQUEwQyxJQUFJO0FBQzlDO0FBQ0EsNkJBQTZCLDBCQUEwQjtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QjtBQUM5QjtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsbUJBQW1CO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQSx5QkFBeUIsdUJBQXVCO0FBQ2hEO0FBQ0E7QUFDQSxpQ0FBaUMsbUJBQW1CO0FBQ3BELHFDQUFxQztBQUNyQyw0REFBNEQ7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIsc0NBQXNDLHdCQUF3QjtBQUM5RDtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBLGtDQUFrQyw4QkFBOEI7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw2QkFBNkIsZ0JBQWdCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsaUNBQWlDLGtCQUFrQjtBQUNuRDtBQUNBOztBQUVBO0FBQ0EsaUNBQWlDLG1CQUFtQjtBQUNwRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsV0FBVztBQUN0RDtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSwyRUFBMkU7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQyx3QkFBd0I7QUFDNUQscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0EsNEJBQTRCLCtCQUErQjtBQUMzRDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsbUNBQW1DO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyIsImZpbGUiOiJ3c2MtY2hyb21lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMTg3MmQ4MDhmZjA3Mjc0NjVmYWQiLCIoZnVuY3Rpb24oKSB7XHJcbmZ1bmN0aW9uIEJ1ZmZlcihvcHRzKSB7XHJcbiAgICAvKlxyXG4gICAgICBGSUZPIHF1ZXVlIHR5cGUgdGhhdCBsZXRzIHlvdSBjaGVjayB3aGVuIGFibGUgdG8gY29uc3VtZSB0aGVcclxuICAgICAgcmlnaHQgYW1vdW50IG9mIGRhdGEuXHJcblxyXG4gICAgICovXHJcbiAgICB0aGlzLm9wdHMgPSBvcHRzXHJcbiAgICB0aGlzLm1heF9idWZmZXJfc2l6ZSA9IDEwNDg1NzYwMFxyXG4gICAgdGhpcy5fc2l6ZSA9IDBcclxuICAgIHRoaXMuZGVxdWUgPSBbXVxyXG59XHJcblxyXG5CdWZmZXIucHJvdG90eXBlID0ge1xyXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuZGVxdWUgPSBbXVxyXG4gICAgICAgIHRoaXMuX3NpemUgPSAwXHJcbiAgICB9LFxyXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGVxdWUubGVuZ3RoID09IDEpIHsgcmV0dXJuIHRoaXMuZGVxdWVbMF0gfVxyXG4gICAgICAgIC8vIGZsYXR0ZW5zIHRoZSBidWZmZXIgZGVxdWUgdG8gb25lIGVsZW1lbnRcclxuICAgICAgICB2YXIgdG90YWxTeiA9IDBcclxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5kZXF1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b3RhbFN6ICs9IHRoaXMuZGVxdWVbaV0uYnl0ZUxlbmd0aFxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkodG90YWxTeilcclxuICAgICAgICB2YXIgaWR4ID0gMFxyXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLmRlcXVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFyci5zZXQobmV3IFVpbnQ4QXJyYXkodGhpcy5kZXF1ZVtpXSksIGlkeClcclxuICAgICAgICAgICAgaWR4ICs9IHRoaXMuZGVxdWVbaV0uYnl0ZUxlbmd0aFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRlcXVlID0gW2Fyci5idWZmZXJdXHJcbiAgICAgICAgcmV0dXJuIGFyci5idWZmZXJcclxuICAgIH0sXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICBjb25zb2xlLmFzc2VydChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpXHJcblx0XHQvL2NvbnNvbGUuYXNzZXJ0KGRhdGEuYnl0ZUxlbmd0aCA+IDApXHJcbiAgICAgICAgdGhpcy5fc2l6ZSA9IHRoaXMuX3NpemUgKyBkYXRhLmJ5dGVMZW5ndGhcclxuICAgICAgICB0aGlzLmRlcXVlLnB1c2goZGF0YSlcclxuICAgIH0sXHJcbiAgICBjb25zdW1lX2FueV9tYXg6IGZ1bmN0aW9uKG1heHN6KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2l6ZSgpIDw9IG1heHN6KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnN1bWUodGhpcy5zaXplKCkpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uc3VtZShtYXhzeilcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29uc3VtZTogZnVuY3Rpb24oc3oscHV0YmFjaykge1xyXG4gICAgICAgIC8vIHJldHVybnMgYSBzaW5nbGUgYXJyYXkgYnVmZmVyIG9mIHNpemUgc3pcclxuICAgICAgICBpZiAoc3ogPiB0aGlzLl9zaXplKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KGZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb25zdW1lZCA9IDBcclxuXHJcbiAgICAgICAgdmFyIHJldCA9IG5ldyBVaW50OEFycmF5KHN6KVxyXG4gICAgICAgIHZhciBjdXJidWZcclxuICAgICAgICAvLyBjb25zdW1lIGZyb20gdGhlIGxlZnRcclxuXHJcbiAgICAgICAgd2hpbGUgKGNvbnN1bWVkIDwgc3opIHtcclxuICAgICAgICAgICAgY3VyYnVmID0gdGhpcy5kZXF1ZVswXVxyXG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChjdXJidWYgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25zdW1lZCArIGN1cmJ1Zi5ieXRlTGVuZ3RoIDw9IHN6KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjdXJidWYgZml0cyBpbiBjb21wbGV0ZWx5IHRvIHJldHVybiBidWZmZXJcclxuICAgICAgICAgICAgICAgIHJldC5zZXQoIG5ldyBVaW50OEFycmF5KGN1cmJ1ZiksIGNvbnN1bWVkIClcclxuICAgICAgICAgICAgICAgIGNvbnN1bWVkID0gY29uc3VtZWQgKyBjdXJidWYuYnl0ZUxlbmd0aFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXF1ZS5zaGlmdCgpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjdXJidWYgdG9vIGJpZyEgdGhpcyB3aWxsIGJlIHRoZSBsYXN0IGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgdmFyIHNsaWNlbGVmdCA9IG5ldyBVaW50OEFycmF5KCBjdXJidWYsIDAsIHN6IC0gY29uc3VtZWQgKVxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbGVmdCBzbGljZScsc2xpY2VsZWZ0KVxyXG5cclxuICAgICAgICAgICAgICAgIHJldC5zZXQoIHNsaWNlbGVmdCwgY29uc3VtZWQgKVxyXG4gICAgICAgICAgICAgICAgLy8gd2Ugc3BsaWNlZCBvZmYgZGF0YSwgc28gc2V0IGN1cmJ1ZiBpbiBkZXF1ZVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZW1haW5zeiA9IGN1cmJ1Zi5ieXRlTGVuZ3RoIC0gKHN6IC0gY29uc3VtZWQpXHJcbiAgICAgICAgICAgICAgICB2YXIgc2xpY2VyaWdodCA9IG5ldyBVaW50OEFycmF5KGN1cmJ1Ziwgc3ogLSBjb25zdW1lZCwgcmVtYWluc3opXHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyaWdodCBzbGljZScsc2xpY2VyaWdodClcclxuICAgICAgICAgICAgICAgIHZhciByZW1haW4gPSBuZXcgVWludDhBcnJheShyZW1haW5zeilcclxuICAgICAgICAgICAgICAgIHJlbWFpbi5zZXQoc2xpY2VyaWdodCwgMClcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3JpZ2h0IHNsaWNlIChuZXdidWYpJyxyZW1haW4pXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXF1ZVswXSA9IHJlbWFpbi5idWZmZXJcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHB1dGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5kZXF1ZSA9IFtyZXQuYnVmZmVyXS5jb25jYXQodGhpcy5kZXF1ZSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9zaXplIC09IHN6XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQuYnVmZmVyXHJcbiAgICB9LFxyXG4gICAgc2l6ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NpemVcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIHRlc3RfYnVmZmVyKCkge1xyXG4gICAgdmFyIGIgPSBuZXcgQnVmZmVyO1xyXG4gICAgYi5hZGQoIG5ldyBVaW50OEFycmF5KFsxLDIsMyw0XSkuYnVmZmVyIClcclxuICAgIGNvbnNvbGUuYXNzZXJ0KCBiLnNpemUoKSA9PSA0IClcclxuICAgIGIuYWRkKCBuZXcgVWludDhBcnJheShbNSw2LDddKS5idWZmZXIgKVxyXG4gICAgY29uc29sZS5hc3NlcnQoIGIuc2l6ZSgpID09IDcgKVxyXG4gICAgYi5hZGQoIG5ldyBVaW50OEFycmF5KFs4LDksMTAsMTEsMTJdKS5idWZmZXIgKVxyXG4gICAgY29uc29sZS5hc3NlcnQoIGIuc2l6ZSgpID09IDEyIClcclxuICAgIHZhciBkYXRhXHJcblxyXG4gICAgZGF0YSA9IGIuY29uc3VtZSgxKTtcclxuICAgIGNvbnNvbGUuYXNzZXJ0KG5ldyBVaW50OEFycmF5KGRhdGEpWzBdID09IDEpXHJcbiAgICBjb25zb2xlLmFzc2VydCggZGF0YS5ieXRlTGVuZ3RoID09IDEgKVxyXG5cclxuICAgIGRhdGEgPSBiLmNvbnN1bWUoMSk7XHJcbiAgICBjb25zb2xlLmFzc2VydChuZXcgVWludDhBcnJheShkYXRhKVswXSA9PSAyKVxyXG4gICAgY29uc29sZS5hc3NlcnQoIGRhdGEuYnl0ZUxlbmd0aCA9PSAxIClcclxuXHJcbiAgICBkYXRhID0gYi5jb25zdW1lKDIpO1xyXG4gICAgY29uc29sZS5hc3NlcnQoIGRhdGEuYnl0ZUxlbmd0aCA9PSAyIClcclxuICAgIGNvbnNvbGUuYXNzZXJ0KG5ldyBVaW50OEFycmF5KGRhdGEpWzBdID09IDMpXHJcbiAgICBjb25zb2xlLmFzc2VydChuZXcgVWludDhBcnJheShkYXRhKVsxXSA9PSA0KVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0X2J1ZmZlcjIoKSB7XHJcbiAgICB2YXIgYiA9IG5ldyBCdWZmZXI7XHJcbiAgICBiLmFkZCggbmV3IFVpbnQ4QXJyYXkoWzEsMiwzLDRdKS5idWZmZXIgKVxyXG4gICAgY29uc29sZS5hc3NlcnQoIGIuc2l6ZSgpID09IDQgKVxyXG4gICAgYi5hZGQoIG5ldyBVaW50OEFycmF5KFs1LDYsN10pLmJ1ZmZlciApXHJcbiAgICBjb25zb2xlLmFzc2VydCggYi5zaXplKCkgPT0gNyApXHJcbiAgICBiLmFkZCggbmV3IFVpbnQ4QXJyYXkoWzgsOSwxMCwxMSwxMl0pLmJ1ZmZlciApXHJcbiAgICBjb25zb2xlLmFzc2VydCggYi5zaXplKCkgPT0gMTIgKVxyXG4gICAgdmFyIGRhdGFcclxuXHJcbiAgICBkYXRhID0gYi5jb25zdW1lKDYpO1xyXG4gICAgdmFyIGFkYXRhID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSlcclxuICAgIGNvbnNvbGUuYXNzZXJ0KGRhdGEuYnl0ZUxlbmd0aCA9PSA2KVxyXG4gICAgY29uc29sZS5hc3NlcnQoYWRhdGFbMF0gPT0gMSlcclxuICAgIGNvbnNvbGUuYXNzZXJ0KGFkYXRhWzFdID09IDIpXHJcbiAgICBjb25zb2xlLmFzc2VydChhZGF0YVsyXSA9PSAzKVxyXG4gICAgY29uc29sZS5hc3NlcnQoYWRhdGFbM10gPT0gNClcclxuICAgIGNvbnNvbGUuYXNzZXJ0KGFkYXRhWzRdID09IDUpXHJcbiAgICBjb25zb2xlLmFzc2VydChhZGF0YVs1XSA9PSA2KVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0X2J1ZmZlcjMoKSB7XHJcbiAgICB2YXIgYiA9IG5ldyBCdWZmZXI7XHJcbiAgICBiLmFkZCggbmV3IFVpbnQ4QXJyYXkoWzEsMiwzLDRdKS5idWZmZXIgKVxyXG4gICAgYi5hZGQoIG5ldyBVaW50OEFycmF5KFs1LDYsN10pLmJ1ZmZlciApXHJcbiAgICBiLmFkZCggbmV3IFVpbnQ4QXJyYXkoWzgsOSwxMCwxMSwxMl0pLmJ1ZmZlciApXHJcbiAgICB2YXIgZGF0YVxyXG4gICAgZGF0YSA9IGIuY29uc3VtZV9hbnlfbWF4KDEwMjQpO1xyXG4gICAgdmFyIGFkYXRhID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSlcclxuICAgIGNvbnNvbGUuYXNzZXJ0KGRhdGEuYnl0ZUxlbmd0aCA9PSAxMilcclxuICAgIGZvciAodmFyIGk9MDtpPDEyO2krKykge1xyXG4gICAgICAgIGNvbnNvbGUuYXNzZXJ0KGFkYXRhW2ldID09IGkrMSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdF9idWZmZXI0KCkge1xyXG4gICAgdmFyIGIgPSBuZXcgQnVmZmVyO1xyXG4gICAgYi5hZGQoIG5ldyBVaW50OEFycmF5KFsxLDIsMyw0XSkuYnVmZmVyIClcclxuICAgIGIuYWRkKCBuZXcgVWludDhBcnJheShbNSw2LDddKS5idWZmZXIgKVxyXG4gICAgYi5hZGQoIG5ldyBVaW50OEFycmF5KFs4LDksMTAsMTEsMTJdKS5idWZmZXIgKVxyXG4gICAgdmFyIGRhdGFcclxuICAgIGRhdGEgPSBiLmNvbnN1bWVfYW55X21heCgxMCk7XHJcbiAgICB2YXIgYWRhdGEgPSBuZXcgVWludDhBcnJheShkYXRhKVxyXG4gICAgY29uc29sZS5hc3NlcnQoZGF0YS5ieXRlTGVuZ3RoID09IDEwKVxyXG4gICAgZm9yICh2YXIgaT0wO2k8MTA7aSsrKSB7XHJcbiAgICAgICAgY29uc29sZS5hc3NlcnQoYWRhdGFbaV0gPT0gaSsxKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuaWYgKGZhbHNlKSB7XHJcbiAgICB0ZXN0X2J1ZmZlcigpXHJcbiAgICB0ZXN0X2J1ZmZlcjIoKVxyXG4gICAgdGVzdF9idWZmZXIzKClcclxuICAgIHRlc3RfYnVmZmVyNCgpXHJcbn1cclxuV1NDLkJ1ZmZlciA9IEJ1ZmZlclxyXG59KSgpO1xyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3dzYy1jaHJvbWUvd2ViLXNlcnZlci1jaHJvbWUvYnVmZmVyLnRzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIihmdW5jdGlvbigpIHtcclxuICAgIGZ1bmN0aW9uIHVpOEluZGV4T2YoYXJyLCBzLCBzdGFydEluZGV4KSB7XHJcbiAgICAgICAgLy8gc2VhcmNoZXMgYSB1aThhcnJheSBmb3Igc3ViYXJyYXkgcyBzdGFydGluZyBhdCBzdGFydEluZGV4XHJcbiAgICAgICAgc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXggfHwgMFxyXG4gICAgICAgIHZhciBtYXRjaCA9IGZhbHNlXHJcbiAgICAgICAgZm9yICh2YXIgaT1zdGFydEluZGV4OyBpPGFyci5sZW5ndGggLSBzLmxlbmd0aCArIDE7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoYXJyW2ldID09IHNbMF0pIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaj0xOyBqPHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2kral0gIT0gc1tqXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gLTFcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gQ2hyb21lU29ja2V0WE1MSHR0cFJlcXVlc3QoKSB7XHJcbiAgICAgICAgdGhpcy5vbmxvYWQgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fZmluaXNoZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMub25lcnJvciA9IG51bGxcclxuICAgICAgICB0aGlzLm9wdHMgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMudGltZWRPdXQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMudGltZW91dCA9IDBcclxuICAgICAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGxcclxuXHJcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBudWxsXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW5nID0gZmFsc2VcclxuICAgICAgICB0aGlzLndyaXRpbmcgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMuaGFkZXJyb3IgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMuY2xvc2VkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5zb2NrSW5mbyA9IG51bGxcclxuICAgICAgICB0aGlzLnJlc3BvbnNlVHlwZSA9IG51bGxcclxuXHJcbiAgICAgICAgdGhpcy5leHRyYUhlYWRlcnMgPSB7fVxyXG5cclxuICAgICAgICB0aGlzLmhlYWRlcnNSZWNlaXZlZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnMgPSBudWxsXHJcbiAgICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnNQYXJzZWQgPSBudWxsXHJcbiAgICAgICAgdGhpcy5yZXNwb25zZUJvZHkgPSBudWxsXHJcbiAgICAgICAgdGhpcy5yZXNwb25zZUxlbmd0aCA9IG51bGxcclxuICAgICAgICB0aGlzLnJlc3BvbnNlQnl0ZXNSZWFkID0gbnVsbFxyXG4gICAgICAgIHRoaXMucmVxdWVzdEJvZHkgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuc2VjdXJlZCA9IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgQ2hyb21lU29ja2V0WE1MSHR0cFJlcXVlc3QucHJvdG90eXBlID0ge1xyXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBhc3luYykge1xyXG4gICAgICAgICAgICB0aGlzLm9wdHMgPSB7IG1ldGhvZDptZXRob2QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYzp0cnVlIH1cclxuICAgICAgICAgICAgdGhpcy51cmkgPSBXU0MucGFyc2VVcmkodGhpcy5vcHRzLnVybClcclxuICAgICAgICAgICAgLy9jb25zb2xlLmFzc2VydCh0aGlzLnVyaS5wcm90b2NvbCA9PSAnaHR0cDonKSAvLyBodHRwcyBub3Qgc3VwcG9ydGVkIGZvciBjaHJvbWUuc29ja2V0IHlldFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0UmVxdWVzdEhlYWRlcjogZnVuY3Rpb24oa2V5LCB2YWwpIHtcclxuICAgICAgICAgICAgdGhpcy5leHRyYUhlYWRlcnNba2V5XSA9IHZhbFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKCEgdGhpcy5zdHJlYW0uY2xvc2VkKSB7IHRoaXMuc3RyZWFtLmNsb3NlKCkgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VuZDogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd4aHIgc2VuZCBwYXlsb2FkJyx0aGlzLm9wdHMubWV0aG9kLCBkYXRhKVxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RCb2R5ID0gZGF0YVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy50Y3AuY3JlYXRlKHt9LCBfLmJpbmQodGhpcy5vbkNyZWF0ZSwgdGhpcykpXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXQgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dCggXy5iaW5kKHRoaXMuY2hlY2tUaW1lb3V0LCB0aGlzKSwgdGhpcy50aW1lb3V0IClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3JlYXRlUmVxdWVzdEhlYWRlcnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgbGluZXMgPSBbXVxyXG4gICAgICAgICAgICB2YXIgaGVhZGVycyA9IHsvLydDb25uZWN0aW9uJzogJ2Nsb3NlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8nQWNjZXB0LUVuY29kaW5nJzogJ2lkZW50aXR5JywgLy8gc2VydmVycyB3aWxsIHNlbmQgdXMgY2h1bmtlZCBlbmNvZGluZyBldmVuIGlmIHdlIGRvbnQgd2FudCBpdCwgYmFzdGFyZHNcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAnQWNjZXB0LUVuY29kaW5nJzogJ2lkZW50aXR5O3E9MS4wICo7cT0wJywgLy8gc2VydmVycyB3aWxsIHNlbmQgdXMgY2h1bmtlZCBlbmNvZGluZyBldmVuIGlmIHdlIGRvbnQgd2FudCBpdCwgYmFzdGFyZHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ3VUb3JyZW50LzMzMEIoMzAyMzUpKHNlcnZlcikoMzAyMzUpJywgLy8gc2V0UmVxdWVzdEhlYWRlciAvZXh0cmEgaGVhZGVyIGlzIGRvaW5nIHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0hvc3QnOiB0aGlzLnVyaS5ob3N0fVxyXG4gICAgICAgICAgICBfLmV4dGVuZChoZWFkZXJzLCB0aGlzLmV4dHJhSGVhZGVycylcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5tZXRob2QgPT0gJ0dFVCcpIHtcclxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPT0gJzAnXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLm1ldGhvZCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RCb2R5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snQ29udGVudC1MZW5ndGgnXSA9IHRoaXMucmVxdWVzdEJvZHkuYnl0ZUxlbmd0aC50b1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSAnMCdcclxuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgY29udGVudC1sZW5ndGggMCBpbmNsdWRlZCA/XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yKCd1bnN1cHBvcnRlZCBtZXRob2QnKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpbmVzLnB1c2godGhpcy5vcHRzLm1ldGhvZCArICcgJyArIHRoaXMudXJpLnBhdGhuYW1lICsgdGhpcy51cmkuc2VhcmNoICsgJyBIVFRQLzEuMScpXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ21ha2luZyByZXF1ZXN0JyxsaW5lc1swXSxoZWFkZXJzKVxyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gaGVhZGVycykge1xyXG4gICAgICAgICAgICAgICAgbGluZXMucHVzaCgga2V5ICsgJzogJyArIGhlYWRlcnNba2V5XSApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcclxcbicpICsgJ1xcclxcblxcclxcbidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNoZWNrVGltZW91dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICghIHRoaXMuX2ZpbmlzaGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yKHtlcnJvcjondGltZW91dCd9KSAvLyBjYWxsIG9udGltZW91dCBpbnN0ZWFkXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmlzaGVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdlcnJvcjonLGRhdGEpXHJcbiAgICAgICAgICAgIHRoaXMuaGFkZXJyb3IgPSB0cnVlXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KHR5cGVvZiBkYXRhID09IFwib2JqZWN0XCIpXHJcbiAgICAgICAgICAgICAgICBkYXRhLnRhcmdldCA9IHtlcnJvcjp0cnVlfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vbmVycm9yKGRhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEgdGhpcy5zdHJlYW0uY2xvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cmVhbS5jbG9zZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uU3RyZWFtQ2xvc2U6IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd4aHIgY2xvc2VkJylcclxuICAgICAgICAgICAgaWYgKCEgdGhpcy5fZmluaXNoZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3Ioe2Vycm9yOidzdHJlYW0gY2xvc2VkJ30pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQ3JlYXRlOiBmdW5jdGlvbihzb2NrSW5mbykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jbG9zZWQpIHsgcmV0dXJuIH1cclxuICAgICAgICAgICAgdGhpcy5zdHJlYW0gPSBuZXcgV1NDLklPU3RyZWFtKHNvY2tJbmZvLnNvY2tldElkKVxyXG4gICAgICAgICAgICB0aGlzLnN0cmVhbS5hZGRDbG9zZUNhbGxiYWNrKHRoaXMub25TdHJlYW1DbG9zZS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICB0aGlzLnNvY2tJbmZvID0gc29ja0luZm9cclxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICB2YXIgaG9zdCA9IHRoaXMuZ2V0SG9zdCgpXHJcbiAgICAgICAgICAgIHZhciBwb3J0ID0gdGhpcy5nZXRQb3J0KClcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnY29ubmVjdGluZyB0bycsaG9zdCxwb3J0KVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy50Y3Auc2V0UGF1c2VkKCBzb2NrSW5mby5zb2NrZXRJZCwgdHJ1ZSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjaHJvbWUuc29ja2V0cy50Y3AuY29ubmVjdCggc29ja0luZm8uc29ja2V0SWQsIGhvc3QsIHBvcnQsIF8uYmluZCh0aGlzLm9uQ29ubmVjdCwgdGhpcykgKVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkNvbm5lY3Q6IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdjb25uZWN0ZWQgdG8nLHRoaXMuZ2V0SG9zdCgpKVxyXG4gICAgICAgICAgICB2YXIgbGFzdGVyciA9IGNocm9tZS5ydW50aW1lLmxhc3RFcnJvclxyXG4gICAgICAgICAgICBpZiAodGhpcy5jbG9zZWQpIHsgcmV0dXJuIH1cclxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW5nID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKHRoaXMudGltZWRPdXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RlcnIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3Ioe2Vycm9yOmxhc3RlcnIubWVzc2FnZX0pXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcih7ZXJyb3I6J2Nvbm5lY3Rpb24gZXJyb3InLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTpyZXN1bHR9KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudXJpLnByb3RvY29sID09ICdodHRwczonICYmICEgdGhpcy5zZWN1cmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWN1cmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3NlY3VyaW5nIHNvY2tldCcsdGhpcy5zb2NrSW5mby5zb2NrZXRJZClcclxuICAgICAgICAgICAgICAgICAgICBjaHJvbWUuc29ja2V0cy50Y3Auc2VjdXJlKHRoaXMuc29ja0luZm8uc29ja2V0SWQsIHRoaXMub25Db25uZWN0LmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaGVhZGVycyA9IHRoaXMuY3JlYXRlUmVxdWVzdEhlYWRlcnMoKVxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncmVxdWVzdCB0bycsdGhpcy5nZXRIb3N0KCksaGVhZGVycylcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RyZWFtLndyaXRlQnVmZmVyLmFkZCggbmV3IFRleHRFbmNvZGVyKCd1dGYtOCcpLmVuY29kZShoZWFkZXJzKS5idWZmZXIgKVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdEJvZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0cmVhbS53cml0ZUJ1ZmZlci5hZGQoIHRoaXMucmVxdWVzdEJvZHkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEJvZHkgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cmVhbS50cnlXcml0ZSgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0cmVhbS5yZWFkVW50aWwoJ1xcclxcblxcclxcbicsIHRoaXMub25IZWFkZXJzLmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgICAgICBjaHJvbWUuc29ja2V0cy50Y3Auc2V0UGF1c2VkKCB0aGlzLnNvY2tJbmZvLnNvY2tldElkLCBmYWxzZSwgZnVuY3Rpb24oKXt9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRIb3N0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXJpLmhvc3RuYW1lXHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRQb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudXJpLnByb3RvY29sID09ICdodHRwczonKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy51cmkucG9ydCkgfHwgNDQzXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy51cmkucG9ydCkgfHwgODBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25IZWFkZXJzOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIG5vdCBzdXJlIHdoYXQgZW5jb2RpbmcgZm9yIGhlYWRlcnMgaXMgZXhhY3RseSwgbGF0aW4xIG9yIHNvbWV0aGluZz8gd2hhdGV2ZXIuXHJcbiAgICAgICAgICAgIHZhciBoZWFkZXJzID0gV1NDLnVpODJzdHIobmV3IFVpbnQ4QXJyYXkoZGF0YSkpXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2ZvdW5kIGh0dHAgdHJhY2tlciByZXNwb25zZSBoZWFkZXJzJywgaGVhZGVycylcclxuICAgICAgICAgICAgdGhpcy5oZWFkZXJzUmVjZWl2ZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VIZWFkZXJzID0gaGVhZGVyc1xyXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBwYXJzZUhlYWRlcnModGhpcy5yZXNwb25zZUhlYWRlcnMpXHJcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VEYXRhUGFyc2VkID0gcmVzcG9uc2VcclxuICAgICAgICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnNQYXJzZWQgPSByZXNwb25zZS5oZWFkZXJzXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2codGhpcy5nZXRIb3N0KCksJ3BhcnNlZCBodHRwIHJlc3BvbnNlIGhlYWRlcnMnLHJlc3BvbnNlKVxyXG4gICAgICAgICAgICB0aGlzLnJlc3BvbnNlTGVuZ3RoID0gcGFyc2VJbnQocmVzcG9uc2UuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSlcclxuICAgICAgICAgICAgdGhpcy5yZXNwb25zZUJ5dGVzUmVhZCA9IHRoaXMuc3RyZWFtLnJlYWRCdWZmZXIuc2l6ZSgpXHJcblxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuaGVhZGVyc1sndHJhbnNmZXItZW5jb2RpbmcnXSAmJlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuaGVhZGVyc1sndHJhbnNmZXItZW5jb2RpbmcnXSA9PSAnY2h1bmtlZCcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2h1bmtzID0gbmV3IFdTQy5CdWZmZXJcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2xvb2tpbmcgZm9yIGFuIFxcXFxyXFxcXG4nKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJlYW0ucmVhZFVudGlsKFwiXFxyXFxuXCIsIHRoaXMuZ2V0TmV3Q2h1bmsuYmluZCh0aGlzKSlcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5lcnJvcignY2h1bmtlZCBlbmNvZGluZycpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISByZXNwb25zZS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvcihcIm5vIGNvbnRlbnQgbGVuZ3RoIGluIHJlc3BvbnNlXCIpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3JlYWQgYnl0ZXMnLHRoaXMucmVzcG9uc2VMZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdHJlYW0ucmVhZEJ5dGVzKHRoaXMucmVzcG9uc2VMZW5ndGgsIHRoaXMub25Cb2R5LmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQ2h1bmtEb25lOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2h1bmtzLmFkZChkYXRhKVxyXG4gICAgICAgICAgICB0aGlzLnN0cmVhbS5yZWFkVW50aWwoXCJcXHJcXG5cIiwgdGhpcy5nZXROZXdDaHVuay5iaW5kKHRoaXMpKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0TmV3Q2h1bms6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIHMgPSBXU0MudWk4MnN0cihuZXcgVWludDhBcnJheShkYXRhLnNsaWNlKDAsZGF0YS5ieXRlTGVuZ3RoLTIpKSlcclxuICAgICAgICAgICAgdmFyIGxlbiA9IHBhcnNlSW50KHMsMTYpXHJcbiAgICAgICAgICAgIGlmIChpc05hTihsZW4pKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yKCdpbnZhbGlkIGNodW5rZWQgZW5jb2RpbmcgcmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbG9va2luZyBmb3IgbmV3IGNodW5rIG9mIGxlbicsbGVuKVxyXG4gICAgICAgICAgICBpZiAobGVuID09IDApIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2dvdCBhbGwgY2h1bmtzJyx0aGlzLmNodW5rcylcclxuICAgICAgICAgICAgICAgIHZhciBib2R5ID0gdGhpcy5jaHVua3MuZmxhdHRlbigpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uQm9keShib2R5KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHJlYW0ucmVhZEJ5dGVzKGxlbisyLCB0aGlzLm9uQ2h1bmtEb25lLmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQm9keTogZnVuY3Rpb24oYm9keSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlc3BvbnNlQm9keSA9IGJvZHlcclxuICAgICAgICAgICAgdmFyIGV2dCA9IHt0YXJnZXQ6IHtoZWFkZXJzOnRoaXMucmVzcG9uc2VEYXRhUGFyc2VkLmhlYWRlcnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTp0aGlzLnJlc3BvbnNlRGF0YVBhcnNlZC5jb2RlLCAvKiBjb2RlIGlzIHdyb25nLCBzaG91bGQgYmUgc3RhdHVzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOnRoaXMucmVzcG9uc2VEYXRhUGFyc2VkLmNvZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzOnRoaXMucmVzcG9uc2VIZWFkZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BhcnNlZDp0aGlzLnJlc3BvbnNlSGVhZGVyc1BhcnNlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTpib2R5fVxyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZVR5cGUgJiYgdGhpcy5yZXNwb25zZVR5cGUudG9Mb3dlckNhc2UoKSA9PSAneG1sJykge1xyXG4gICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5yZXNwb25zZVhNTCA9IChuZXcgRE9NUGFyc2VyKS5wYXJzZUZyb21TdHJpbmcobmV3IFRleHREZWNvZGVyKCd1dGYtOCcpLmRlY29kZShib2R5KSwgXCJ0ZXh0L3htbFwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub25sb2FkKGV2dClcclxuICAgICAgICAgICAgdGhpcy5fZmluaXNoZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIGlmICghIHRoaXMuc3RyZWFtLmNsb3NlZCkgeyB0aGlzLnN0cmVhbS5jbG9zZSgpIH1cclxuICAgICAgICAgICAgLy8gYWxsIGRvbmUhISEgKGNsb3NlIGNvbm5lY3Rpb24uLi4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlSGVhZGVycyhzKSB7XHJcbiAgICAgICAgdmFyIGxpbmVzID0gcy5zcGxpdCgnXFxyXFxuJylcclxuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uc3BsaXQoLyArLylcclxuICAgICAgICB2YXIgcHJvdG8gPSBmaXJzdExpbmVbMF1cclxuICAgICAgICB2YXIgY29kZSA9IGZpcnN0TGluZVsxXVxyXG4gICAgICAgIHZhciBzdGF0dXMgPSBmaXJzdExpbmUuc2xpY2UoMixmaXJzdExpbmUubGVuZ3RoKS5qb2luKCcgJylcclxuICAgICAgICB2YXIgaGVhZGVycyA9IHt9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGk9MTsgaTxsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldXHJcbiAgICAgICAgICAgIGlmIChsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaiA9IGxpbmUuaW5kZXhPZignOicpXHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gbGluZS5zbGljZSgwLGopLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgIGhlYWRlcnNba2V5XSA9IGxpbmUuc2xpY2UoaisxLGxpbmUubGVuZ3RoKS50cmltKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge2NvZGU6IGNvZGUsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcclxuICAgICAgICAgICAgICAgIHByb3RvOiBwcm90byxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnN9XHJcbiAgICB9XHJcbiAgICBXU0MuQ2hyb21lU29ja2V0WE1MSHR0cFJlcXVlc3QgPSBDaHJvbWVTb2NrZXRYTUxIdHRwUmVxdWVzdFxyXG5cclxuICAgIHdpbmRvdy50ZXN0eGhyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIFhIUicpXHJcbiAgICAgICAgdmFyIHhociA9IG5ldyBDaHJvbWVTb2NrZXRYTUxIdHRwUmVxdWVzdFxyXG4gICAgICAgIHhoci5vcGVuKFwiR0VUXCIsXCJodHRwczovL3d3dy5nb29nbGUuY29tXCIpXHJcbiAgICAgICAgeGhyLnRpbWVvdXQgPSA4MDAwXHJcbiAgICAgICAgeGhyLm9ubG9hZCA9IHhoci5vbmVycm9yID0geGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygneGhyIHJlc3VsdDonLGV2dClcclxuICAgICAgICB9XHJcbiAgICAgICAgeGhyLnNlbmQoKVxyXG4gICAgICAgIHdpbmRvdy50eGhyID0geGhyXHJcbiAgICB9XHJcbn0pKCk7XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9jaHJvbWVzb2NrZXR4aHIudHNcbi8vIG1vZHVsZSBpZCA9IDJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiKGZ1bmN0aW9uKCkge1xyXG4gICAgX0RFQlVHID0gZmFsc2VcclxuICAgIGZ1bmN0aW9uIEhUVFBDb25uZWN0aW9uKHN0cmVhbSkge1xyXG4gICAgICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtXHJcbiAgICAgICAgdGhpcy5jdXJSZXF1ZXN0ID0gbnVsbFxyXG4gICAgICAgIHRoaXMub25SZXF1ZXN0Q2FsbGJhY2sgPSBudWxsXHJcbiAgICAgICAgLy90aGlzLmxvZygnbmV3IGNvbm5lY3Rpb24nKVxyXG4gICAgICAgIHRoaXMuY2xvc2VkID0gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICBIVFRQQ29ubmVjdGlvbi5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgbG9nOiBmdW5jdGlvbihtc2cpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zdHJlYW0uc29ja0lkLG1zZylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRyeVJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0cmVhbS5yZWFkVW50aWwoJ1xcclxcblxcclxcbicsdGhpcy5vbkhlYWRlcnMuYmluZCh0aGlzKSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB1c2luZyBUZXh0RW5jb2RlciB3aXRoIHV0Zi04XHJcbiAgICAgICAgICAgICAgICB2YXIgYnVmID0gV1NDLnN0cmluZ1RvVWludDhBcnJheShkYXRhKS5idWZmZXJcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBidWYgPSBkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zdHJlYW0ud3JpdGVCdWZmZXIuYWRkKGJ1ZilcclxuICAgICAgICAgICAgdGhpcy5zdHJlYW0udHJ5V3JpdGUoKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaHR0cCBjb25uIGNsb3NlJylcclxuICAgICAgICAgICAgdGhpcy5jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMuc3RyZWFtLmNsb3NlKClcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFkZFJlcXVlc3RDYWxsYmFjazogZnVuY3Rpb24oY2IpIHtcclxuICAgICAgICAgICAgdGhpcy5vblJlcXVlc3RDYWxsYmFjayA9IGNiIFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25IZWFkZXJzOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gLSBodHRwIGhlYWRlcnMgYXJlIExhdGluMSwgbm90IGFzY2lpLi4uXHJcbiAgICAgICAgICAgIHZhciBkYXRhc3RyID0gV1NDLmFycmF5QnVmZmVyVG9TdHJpbmcoZGF0YSlcclxuICAgICAgICAgICAgdmFyIGxpbmVzID0gZGF0YXN0ci5zcGxpdCgnXFxyXFxuJylcclxuICAgICAgICAgICAgdmFyIGZpcnN0bGluZSA9IGxpbmVzWzBdXHJcbiAgICAgICAgICAgIHZhciBmbHBhcnRzID0gZmlyc3RsaW5lLnNwbGl0KCcgJylcclxuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IGZscGFydHNbMF1cclxuICAgICAgICAgICAgdmFyIHVyaSA9IGZscGFydHNbMV1cclxuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBmbHBhcnRzWzJdXHJcblxyXG4gICAgICAgICAgICB2YXIgaGVhZGVycyA9IFdTQy5wYXJzZUhlYWRlcnMobGluZXMuc2xpY2UoMSxsaW5lcy5sZW5ndGgtMikpXHJcbiAgICAgICAgICAgIHRoaXMuY3VyUmVxdWVzdCA9IG5ldyBXU0MuSFRUUFJlcXVlc3Qoe2hlYWRlcnM6aGVhZGVycyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDptZXRob2QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmk6dXJpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjp2ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uOnRoaXN9KVxyXG4gICAgICAgICAgICBpZiAoX0RFQlVHKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvZyh0aGlzLmN1clJlcXVlc3QudXJpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChoZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xlbiA9IHBhcnNlSW50KGhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ10pXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIC0tIGhhbmRsZSAxMDAgY29udGludWUuLlxyXG4gICAgICAgICAgICAgICAgaWYgKGNsZW4gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlcXVlc3QgaGFkIGNvbnRlbnQgbGVuZ3RoJyxjbGVuKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RyZWFtLnJlYWRCeXRlcyhjbGVuLCB0aGlzLm9uUmVxdWVzdEJvZHkuYmluZCh0aGlzKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJSZXF1ZXN0LmJvZHkgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChbJ0dFVCcsJ0hFQUQnLCdQVVQnLCdPUFRJT05TJ10uaW5jbHVkZXMobWV0aG9kKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblJlcXVlc3QodGhpcy5jdXJSZXF1ZXN0KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignaG93IHRvIGhhbmRsZScsdGhpcy5jdXJSZXF1ZXN0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblJlcXVlc3RCb2R5OiBmdW5jdGlvbihib2R5KSB7XHJcbiAgICAgICAgICAgIHZhciByZXEgPSB0aGlzLmN1clJlcXVlc3RcclxuICAgICAgICAgICAgdmFyIGN0ID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddXHJcbiAgICAgICAgICAgIHZhciBkZWZhdWx0X2NoYXJzZXQgPSAndXRmLTgnXHJcbiAgICAgICAgICAgIGlmIChjdCkge1xyXG4gICAgICAgICAgICAgICAgY3QgPSBjdC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICBpZiAoY3QudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGFyc2V0X2kgPSBjdC5pbmRleE9mKCdjaGFyc2V0PScpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJzZXRfaSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hhcnNldCA9IGN0LnNsaWNlKGNoYXJzZXRfaSArICdjaGFyc2V0PScubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0Lmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3VzaW5nIGNoYXJzZXQnLGNoYXJzZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoYXJzZXQgPSBkZWZhdWx0X2NoYXJzZXRcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBib2R5ZGF0YSA9IG5ldyBUZXh0RGVjb2RlcihjaGFyc2V0KS5kZWNvZGUoYm9keSlcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYm9keXBhcmFtcyA9IHt9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1zID0gYm9keWRhdGEuc3BsaXQoJyYnKVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxpdGVtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga3YgPSBpdGVtc1tpXS5zcGxpdCgnPScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHlwYXJhbXNbIGRlY29kZVVSSUNvbXBvbmVudChrdlswXSkgXSA9IGRlY29kZVVSSUNvbXBvbmVudChrdlsxXSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLmJvZHlwYXJhbXMgPSBib2R5cGFyYW1zXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5jdXJSZXF1ZXN0LmJvZHkgPSBib2R5XHJcbiAgICAgICAgICAgIHRoaXMub25SZXF1ZXN0KHRoaXMuY3VyUmVxdWVzdClcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUmVxdWVzdDogZnVuY3Rpb24ocmVxdWVzdCkge1xyXG4gICAgICAgICAgICB0aGlzLm9uUmVxdWVzdENhbGxiYWNrKHJlcXVlc3QpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIFdTQy5IVFRQQ29ubmVjdGlvbiA9IEhUVFBDb25uZWN0aW9uO1xyXG5cclxufSkoKTtcclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi93c2MtY2hyb21lL3dlYi1zZXJ2ZXItY2hyb21lL2Nvbm5lY3Rpb24udHNcbi8vIG1vZHVsZSBpZCA9IDRcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiKGZ1bmN0aW9uKCl7XHJcbiAgICBfREVCVUcgPSBmYWxzZVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldEVudHJ5RmlsZSggZW50cnksIGNhbGxiYWNrICkge1xyXG4gICAgICAgIC8vIFhYWCBpZiBmaWxlIGlzIDAgYnl0ZXMsIGFuZCB0aGVuIHdyaXRlIHNvbWUgZGF0YSwgaXQgc3RheXMgY2FjaGVkLi4uIHdoaWNoIGlzIGJhZC4uLlxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBjYWNoZUtleSA9IGVudHJ5LmZpbGVzeXN0ZW0ubmFtZSArICcvJyArIGVudHJ5LmZ1bGxQYXRoXHJcbiAgICAgICAgdmFyIGluQ2FjaGUgPSBXU0MuZW50cnlGaWxlQ2FjaGUuZ2V0KGNhY2hlS2V5KVxyXG4gICAgICAgIGlmIChpbkNhY2hlKSB7IFxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaWxlIGNhY2hlIGhpdCcpOyBcclxuICAgICAgICAgICAgY2FsbGJhY2soaW5DYWNoZSk7IHJldHVybiB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZW50cnkuZmlsZSggZnVuY3Rpb24oZmlsZSkge1xyXG4gICAgICAgICAgICBpZiAoZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIFdTQy5lbnRyeUZpbGVDYWNoZS5zZXQoY2FjaGVLZXksIGZpbGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FsbGJhY2soZmlsZSlcclxuICAgICAgICB9LCBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICAgICAgLy8gdG9kbyAtLSBhY3R1YWxseSByZXNwb25kIHdpdGggdGhlIGZpbGUgZXJyb3I/XHJcbiAgICAgICAgICAgIC8vIG9yIGNsZWFudXAgdGhlIGNvbnRleHQgYXQgbGVhc3RcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZW50cnkuZmlsZSgpIGVycm9yJyxldnQpXHJcbiAgICAgICAgICAgIGRlYnVnZ2VyXHJcbiAgICAgICAgICAgIGV2dC5lcnJvciA9IHRydWVcclxuICAgICAgICAgICAgLy8gY291bGQgYmUgTm90Rm91bmRFcnJvclxyXG4gICAgICAgICAgICBjYWxsYmFjayhldnQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBQcm94eUhhbmRsZXIodmFsaWRhdG9yLCByZXF1ZXN0KSB7XHJcbiAgICAgICAgV1NDLkJhc2VIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMpXHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3JcclxuICAgIH1cclxuICAgIF8uZXh0ZW5kKFByb3h5SGFuZGxlci5wcm90b3R5cGUsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoISB0aGlzLnZhbGlkYXRvcih0aGlzLnJlcXVlc3QpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlTGVuZ3RoID0gMFxyXG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZUhlYWRlcnMoNDAzKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2goKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Byb3h5aGFuZGxlciBnZXQnLHRoaXMucmVxdWVzdClcclxuICAgICAgICAgICAgdmFyIHVybCA9IHRoaXMucmVxdWVzdC5hcmd1bWVudHMudXJsXHJcbiAgICAgICAgICAgIHZhciB4aHIgPSBuZXcgV1NDLkNocm9tZVNvY2tldFhNTEh0dHBSZXF1ZXN0XHJcbiAgICAgICAgICAgIHZhciBjaHJvbWVoZWFkZXJzID0ge1xyXG4vLyAgICAgICAgICAgICAgICAnQWNjZXB0JzondGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksaW1hZ2Uvd2VicCwqLyo7cT0wLjgnLFxyXG4vLyAgICAgICAgICAgICAgICAnQWNjZXB0LUVuY29kaW5nJzonZ3ppcCwgZGVmbGF0ZSwgc2RjaCcsXHJcbiAgICAgICAgICAgICAgICAnQWNjZXB0LUxhbmd1YWdlJzonZW4tVVMsZW47cT0wLjgnLFxyXG4gICAgICAgICAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiduby1jYWNoZScsXHJcbi8vICAgICAgICAgICAgICAgICdDb25uZWN0aW9uJzona2VlcC1hbGl2ZScsXHJcbiAgICAgICAgICAgICAgICAnUHJhZ21hJzonbm8tY2FjaGUnLFxyXG4gICAgICAgICAgICAgICAgJ1VwZ3JhZGUtSW5zZWN1cmUtUmVxdWVzdHMnOicxJyxcclxuICAgICAgICAgICAgICAgICdVc2VyLUFnZW50JzonTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTFfNCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzQ5LjAuMjYyMy4xMTAgU2FmYXJpLzUzNy4zNidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIGNocm9tZWhlYWRlcnMpIHtcclxuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGssIGNocm9tZWhlYWRlcnNba10pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsKVxyXG4gICAgICAgICAgICB4aHIub25sb2FkID0gdGhpcy5vbmZldGNoZWQuYmluZCh0aGlzKVxyXG4gICAgICAgICAgICB4aHIuc2VuZCgpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbmZldGNoZWQ6IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBoZWFkZXIgaW4gZXZ0LnRhcmdldC5oZWFkZXJzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcihoZWFkZXIsIGV2dC50YXJnZXQuaGVhZGVyc1toZWFkZXJdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VMZW5ndGggPSBldnQudGFyZ2V0LnJlc3BvbnNlLmJ5dGVMZW5ndGhcclxuICAgICAgICAgICAgdGhpcy53cml0ZUhlYWRlcnMoZXZ0LnRhcmdldC5jb2RlKVxyXG4gICAgICAgICAgICB0aGlzLndyaXRlKGV2dC50YXJnZXQucmVzcG9uc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZmluaXNoKClcclxuICAgICAgICB9XHJcbiAgICB9LCBXU0MuQmFzZUhhbmRsZXIucHJvdG90eXBlKVxyXG4gICAgV1NDLlByb3h5SGFuZGxlciA9IFByb3h5SGFuZGxlclxyXG5cclxuICAgIGZ1bmN0aW9uIERpcmVjdG9yeUVudHJ5SGFuZGxlcihmcywgcmVxdWVzdCkge1xyXG4gICAgICAgIFdTQy5CYXNlSGFuZGxlci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzKVxyXG4gICAgICAgIHRoaXMuZnMgPSBmc1xyXG4gICAgICAgIC8vdGhpcy5kZWJ1Z0ludGVydmFsID0gc2V0SW50ZXJ2YWwoIHRoaXMuZGVidWcuYmluZCh0aGlzKSwgMTAwMClcclxuICAgICAgICB0aGlzLmVudHJ5ID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZmlsZSA9IG51bGxcclxuICAgICAgICB0aGlzLnJlYWRDaHVua1NpemUgPSA0MDk2ICogMTZcclxuICAgICAgICB0aGlzLmZpbGVPZmZzZXQgPSAwXHJcbiAgICAgICAgdGhpcy5maWxlRW5kT2Zmc2V0ID0gMFxyXG4gICAgICAgIHRoaXMuYm9keVdyaXR0ZW4gPSAwXHJcbiAgICAgICAgdGhpcy5pc0RpcmVjdG9yeUxpc3RpbmcgPSBmYWxzZVxyXG4gICAgICAgIHJlcXVlc3QuY29ubmVjdGlvbi5zdHJlYW0ub25jbG9zZSA9IHRoaXMub25DbG9zZS5iaW5kKHRoaXMpXHJcbiAgICB9XHJcbiAgICBfLmV4dGVuZChEaXJlY3RvcnlFbnRyeUhhbmRsZXIucHJvdG90eXBlLCB7XHJcbiAgICAgICAgb25DbG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2Nsb3NlZCcsdGhpcy5yZXF1ZXN0LnBhdGgpXHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5kZWJ1Z0ludGVydmFsKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVidWc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMucmVxdWVzdC5jb25uZWN0aW9uLnN0cmVhbS5zb2NrSWQsJ2RlYnVnIHdiOicsdGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uc3RyZWFtLndyaXRlQnVmZmVyLnNpemUoKSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmdldCgpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoISB0aGlzLmFwcC5vcHRzLm9wdFVwbG9hZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUxlbmd0aCA9IDBcclxuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDQwMClcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoKClcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpZiB1cGxvYWQgZW5hYmxlZCBpbiBvcHRpb25zLi4uXHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGZpbGUgZXhpc3RzLi4uXHJcbiAgICAgICAgICAgIHRoaXMuZnMuZ2V0QnlQYXRoKHRoaXMucmVxdWVzdC5wYXRoLCB0aGlzLm9uUHV0RW50cnkuYmluZCh0aGlzKSwgdHJ1ZSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUHV0RW50cnk6IGZ1bmN0aW9uKGVudHJ5KSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMucmVxdWVzdC5wYXRoLnNwbGl0KCcvJylcclxuICAgICAgICAgICAgdmFyIHBhdGggPSBwYXJ0cy5zbGljZSgwLHBhcnRzLmxlbmd0aC0xKS5qb2luKCcvJylcclxuICAgICAgICAgICAgdmFyIGZpbGVuYW1lID0gcGFydHNbcGFydHMubGVuZ3RoLTFdXHJcblxyXG4gICAgICAgICAgICBpZiAoZW50cnkgJiYgZW50cnkuZXJyb3IgPT0gJ3BhdGggbm90IGZvdW5kJykge1xyXG4gICAgICAgICAgICAgICAgLy8gZ29vZCwgd2UgY2FuIHVwbG9hZCBpdCBoZXJlIC4uLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5mcy5nZXRCeVBhdGgocGF0aCwgdGhpcy5vblB1dEZvbGRlci5iaW5kKHRoaXMsZmlsZW5hbWUpKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbG93UmVwbGFjZUZpbGUgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmlsZSBhbHJlYWR5IGV4aXN0cycsIGVudHJ5KVxyXG4gICAgICAgICAgICAgICAgaWYgKGFsbG93UmVwbGFjZUZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0cnVuY2F0ZSBmaWxlXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9ucmVtb3ZlID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnMuZ2V0QnlQYXRoKHBhdGgsIHRoaXMub25QdXRGb2xkZXIuYmluZCh0aGlzLGZpbGVuYW1lKSlcclxuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5yZW1vdmUoIG9ucmVtb3ZlLCBvbnJlbW92ZSApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUHV0Rm9sZGVyOiBmdW5jdGlvbihmaWxlbmFtZSwgZm9sZGVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvbndyaXR0ZW4gPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3cml0ZSBjb21wbGV0ZScsZXZ0KVxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyB3cml0ZSA0MDAgaW4gb3RoZXIgY2FzZXMuLi5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VMZW5ndGggPSAwXHJcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlSGVhZGVycygyMDApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaCgpXHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgICAgICAgICB2YXIgYm9keSA9IHRoaXMucmVxdWVzdC5ib2R5XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uZmlsZShlbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5LmlzRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG9ud3JpdGVyKHdyaXRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZXIub253cml0ZSA9IHdyaXRlci5vbmVycm9yID0gb253cml0dGVuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlci53cml0ZShuZXcgQmxvYihbYm9keV0pKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jcmVhdGVXcml0ZXIob253cml0ZXIsIG9ud3JpdGVyKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvbGRlci5nZXRGaWxlKGZpbGVuYW1lLCB7Y3JlYXRlOnRydWV9LCBvbmZpbGUsIG9uZmlsZSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vdGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uc3RyZWFtLm9uV3JpdGVCdWZmZXJFbXB0eSA9IHRoaXMub25Xcml0ZUJ1ZmZlckVtcHR5LmJpbmQodGhpcylcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVyKCdhY2NlcHQtcmFuZ2VzJywnYnl0ZXMnKVxyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcignY29ubmVjdGlvbicsJ2tlZXAtYWxpdmUnKVxyXG4gICAgICAgICAgICBpZiAoISB0aGlzLmZzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlKFwiZXJyb3I6IG5lZWQgdG8gc2VsZWN0IGEgZGlyZWN0b3J5IHRvIHNlcnZlXCIsNTAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy92YXIgcGF0aCA9IGRlY29kZVVSSSh0aGlzLnJlcXVlc3QucGF0aClcclxuXHJcbiAgICAgICAgICAgIC8vIHN0cmlwICcvJyBvZmYgZW5kIG9mIHBhdGhcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJld3JpdGVfdG8pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnMuZ2V0QnlQYXRoKHRoaXMucmV3cml0ZV90bywgdGhpcy5vbkVudHJ5LmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5mcy5pc0ZpbGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25FbnRyeSh0aGlzLmZzKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcy5nZXRCeVBhdGgodGhpcy5yZXF1ZXN0LnBhdGgsIHRoaXMub25FbnRyeS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkb1JlYWRDaHVuazogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2codGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uc3RyZWFtLnNvY2tJZCwgJ2RvUmVhZENodW5rJywgdGhpcy5maWxlT2Zmc2V0KVxyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXI7XHJcblxyXG4gICAgICAgICAgICB2YXIgZW5kQnl0ZSA9IE1hdGgubWluKHRoaXMuZmlsZU9mZnNldCArIHRoaXMucmVhZENodW5rU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVFbmRPZmZzZXQpXHJcbiAgICAgICAgICAgIGlmIChlbmRCeXRlID49IHRoaXMuZmlsZS5zaXplKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdiYWQgcmVhZENodW5rJylcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KGZhbHNlKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdkb1JlYWRDaHVuaycsdGhpcy5maWxlT2Zmc2V0LGVuZEJ5dGUtdGhpcy5maWxlT2Zmc2V0KVxyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gdGhpcy5vblJlYWRDaHVuay5iaW5kKHRoaXMpXHJcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gdGhpcy5vblJlYWRDaHVuay5iaW5kKHRoaXMpXHJcbiAgICAgICAgICAgIHZhciBibG9iU2xpY2UgPSB0aGlzLmZpbGUuc2xpY2UodGhpcy5maWxlT2Zmc2V0LCBlbmRCeXRlICsgMSlcclxuICAgICAgICAgICAgdmFyIG9sZE9mZnNldCA9IHRoaXMuZmlsZU9mZnNldFxyXG4gICAgICAgICAgICB0aGlzLmZpbGVPZmZzZXQgKz0gKGVuZEJ5dGUgLSB0aGlzLmZpbGVPZmZzZXQpICsgMVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdvZmZzZXQnLG9sZE9mZnNldCx0aGlzLmZpbGVPZmZzZXQpXHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iU2xpY2UpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbldyaXRlQnVmZmVyRW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoISB0aGlzLmZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyF0aGlzLmZpbGUnKVxyXG4gICAgICAgICAgICAgICAgZGVidWdnZXJcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KCB0aGlzLmJvZHlXcml0dGVuIDw9IHRoaXMucmVzcG9uc2VMZW5ndGggKVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdvbldyaXRlQnVmZmVyRW1wdHknLCB0aGlzLmJvZHlXcml0dGVuLCAnLycsIHRoaXMucmVzcG9uc2VMZW5ndGgpXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJvZHlXcml0dGVuID4gdGhpcy5yZXNwb25zZUxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoZmFsc2UpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5ib2R5V3JpdHRlbiA9PSB0aGlzLnJlc3BvbnNlTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QuY29ubmVjdGlvbi5zdHJlYW0ub25Xcml0ZUJ1ZmZlckVtcHR5ID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2goKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uc3RyZWFtLnJlbW90ZWNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdC5jb25uZWN0aW9uLmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAvLyBzdGlsbCByZWFkP1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIHRoaXMucmVxdWVzdC5jb25uZWN0aW9uLnN0cmVhbS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvUmVhZENodW5rKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25SZWFkQ2h1bms6IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdvblJlYWRDaHVuaycpXHJcbiAgICAgICAgICAgIGlmIChldnQudGFyZ2V0LnJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ib2R5V3JpdHRlbiArPSBldnQudGFyZ2V0LnJlc3VsdC5ieXRlTGVuZ3RoXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ib2R5V3JpdHRlbiA+PSB0aGlzLnJlc3BvbnNlTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLnJlcXVlc3QuY29ubmVjdGlvbi5zdHJlYW0ub25Xcml0ZUJ1ZmZlckVtcHR5ID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh0aGlzLnJlcXVlc3QuY29ubmVjdGlvbi5zdHJlYW0uc29ja0lkLCd3cml0ZScsZXZ0LnRhcmdldC5yZXN1bHQuYnl0ZUxlbmd0aClcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdC5jb25uZWN0aW9uLndyaXRlKGV2dC50YXJnZXQucmVzdWx0KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignb25yZWFkY2h1bmsgZXJyb3InLGV2dC50YXJnZXQuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QuY29ubmVjdGlvbi5jbG9zZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRW50cnk6IGZ1bmN0aW9uKGVudHJ5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50cnkgPSBlbnRyeVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuZW50cnkgJiYgdGhpcy5lbnRyeS5pc0RpcmVjdG9yeSAmJiAhIHRoaXMucmVxdWVzdC5vcmlncGF0aC5lbmRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3bG9jID0gdGhpcy5yZXF1ZXN0Lm9yaWdwYXRoICsgJy8nXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcignbG9jYXRpb24nLCBuZXdsb2MpIC8vIFhYWCAtIGVuY29kZSBsYXRpbi0xIHNvbWVob3c/XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlTGVuZ3RoID0gMFxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncmVkaXJlY3QgLT4nLG5ld2xvYylcclxuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDMwMSlcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaCgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uc3RyZWFtLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKHRoaXMucmVxdWVzdC5jb25uZWN0aW9uLnN0cmVhbS5zb2NrSWQsJ3JlcXVlc3QgY2xvc2VkIHdoaWxlIHByb2Nlc3NpbmcgcmVxdWVzdCcpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoISBlbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5tZXRob2QgPT0gXCJIRUFEXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlTGVuZ3RoID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDQwNClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaCgpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGUoJ25vIGVudHJ5Jyw0MDQpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50cnkuZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3QubWV0aG9kID09IFwiSEVBRFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUxlbmd0aCA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRlSGVhZGVycyg0MDQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5pc2goKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRlKCdlbnRyeSBub3QgZm91bmQ6ICcgKyAodGhpcy5yZXdyaXRlX3RvIHx8IHRoaXMucmVxdWVzdC5wYXRoKSwgNDA0KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJGaWxlQ29udGVudHMoZW50cnkpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkaXJlY3RvcnlcclxuICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBlbnRyeS5jcmVhdGVSZWFkZXIoKVxyXG4gICAgICAgICAgICAgICAgdmFyIGFsbHJlc3VsdHMgPSBbXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0RpcmVjdG9yeUxpc3RpbmcgPSB0cnVlXHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gb25yZWFkZXJyKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIFdTQy5lbnRyeUNhY2hlLnVuc2V0KHRoaXMuZW50cnkuZmlsZXN5c3RlbS5uYW1lICsgdGhpcy5lbnRyeS5mdWxsUGF0aClcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdlcnJvciByZWFkaW5nIGRpcicsZXZ0KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdC5jb25uZWN0aW9uLmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBhbGxkb25lKHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5hcHAub3B0cy5vcHRSZW5kZXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8cmVzdWx0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbaV0ubmFtZSA9PSAnaW5kZXgueGh0bWwnIHx8IHJlc3VsdHNbaV0ubmFtZSA9PSAnaW5kZXgueGh0bScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcignY29udGVudC10eXBlJywnYXBwbGljYXRpb24veGh0bWwreG1sOyBjaGFyc2V0PXV0Zi04JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckZpbGVDb250ZW50cyhyZXN1bHRzW2ldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocmVzdWx0c1tpXS5uYW1lID09ICdpbmRleC5odG1sJyB8fCByZXN1bHRzW2ldLm5hbWUgPT0gJ2luZGV4Lmh0bScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcignY29udGVudC10eXBlJywndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckZpbGVDb250ZW50cyhyZXN1bHRzW2ldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3QuYXJndW1lbnRzICYmIHRoaXMucmVxdWVzdC5hcmd1bWVudHMuanNvbiA9PSAnMScgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMucmVxdWVzdC5oZWFkZXJzWydhY2NlcHQnXSAmJiB0aGlzLnJlcXVlc3QuaGVhZGVyc1snYWNjZXB0J10udG9Mb3dlckNhc2UoKSA9PSAnYXBwbGljYWl0b24vanNvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRGlyZWN0b3J5TGlzdGluZ0pTT04ocmVzdWx0cylcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVxdWVzdC5hcmd1bWVudHMgJiYgdGhpcy5yZXF1ZXN0LmFyZ3VtZW50cy5zdGF0aWMgPT0gJzEnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hcmd1bWVudHMuc3RhdGljID09ICd0cnVlJyB8fFxyXG5cdFx0XHRcdFx0XHR0aGlzLmFwcC5vcHRzLm9wdFN0YXRpY1xyXG4gICAgICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckRpcmVjdG9yeUxpc3RpbmcocmVzdWx0cylcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckRpcmVjdG9yeUxpc3RpbmdUZW1wbGF0ZShyZXN1bHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBvbnJlYWRzdWNjZXNzKHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdvbnJlYWRzdWNjZXNzJyxyZXN1bHRzLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxkb25lLmJpbmQodGhpcykoYWxscmVzdWx0cylcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxyZXN1bHRzID0gYWxscmVzdWx0cy5jb25jYXQoIHJlc3VsdHMgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFkZXIucmVhZEVudHJpZXMoIG9ucmVhZHN1Y2Nlc3MuYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbnJlYWRlcnIuYmluZCh0aGlzKSApXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3JlYWRlbnRyaWVzJylcclxuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkRW50cmllcyggb25yZWFkc3VjY2Vzcy5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbnJlYWRlcnIuYmluZCh0aGlzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVuZGVyRmlsZUNvbnRlbnRzOiBmdW5jdGlvbihlbnRyeSwgZmlsZSkge1xyXG4gICAgICAgICAgICBnZXRFbnRyeUZpbGUoZW50cnksIGZ1bmN0aW9uKGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cml0ZShcIkZpbGUgbm90IGZvdW5kXCIsIDQwNClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaCgpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGUgPSBmaWxlXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PSBcIkhFQURcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VMZW5ndGggPSB0aGlzLmZpbGUuc2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDIwMClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaCgpXHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmZpbGUuc2l6ZSA+IHRoaXMucmVhZENodW5rU2l6ZSAqIDggfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3JhbmdlJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QuY29ubmVjdGlvbi5zdHJlYW0ub25Xcml0ZUJ1ZmZlckVtcHR5ID0gdGhpcy5vbldyaXRlQnVmZmVyRW1wdHkuYmluZCh0aGlzKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3JhbmdlJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uc3RyZWFtLnNvY2tJZCwnUkFOR0UnLHRoaXMucmVxdWVzdC5oZWFkZXJzWydyYW5nZSddKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3JhbmdlJ10uc3BsaXQoJz0nKVsxXS50cmltKClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBycGFydHMgPSByYW5nZS5zcGxpdCgnLScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghIHJwYXJ0c1sxXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlT2Zmc2V0ID0gcGFyc2VJbnQocnBhcnRzWzBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlRW5kT2Zmc2V0ID0gdGhpcy5maWxlLnNpemUgLSAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlTGVuZ3RoID0gdGhpcy5maWxlLnNpemUgLSB0aGlzLmZpbGVPZmZzZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcignY29udGVudC1yYW5nZScsJ2J5dGVzICcrdGhpcy5maWxlT2Zmc2V0KyctJysodGhpcy5maWxlLnNpemUtMSkrJy8nK3RoaXMuZmlsZS5zaXplKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsZU9mZnNldCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cml0ZUhlYWRlcnMoMjAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRlSGVhZGVycygyMDYpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9kZWJ1Z2dlciAvLyBUT0RPIC0tIGFkZCBzdXBwb3J0IGZvciBwYXJ0aWFsIGZpbGUgZmV0Y2hpbmcuLi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy53cml0ZUhlYWRlcnMoNTAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlT2Zmc2V0ID0gcGFyc2VJbnQocnBhcnRzWzBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlRW5kT2Zmc2V0ID0gcGFyc2VJbnQocnBhcnRzWzFdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUxlbmd0aCA9IHRoaXMuZmlsZUVuZE9mZnNldCAtIHRoaXMuZmlsZU9mZnNldCArIDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVyKCdjb250ZW50LXJhbmdlJywnYnl0ZXMgJyt0aGlzLmZpbGVPZmZzZXQrJy0nKyh0aGlzLmZpbGVFbmRPZmZzZXQpKycvJyt0aGlzLmZpbGUuc2l6ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDIwNilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9ERUJVRykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xhcmdlIGZpbGUsIHN0cmVhbWluZyBtb2RlIScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlT2Zmc2V0ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVFbmRPZmZzZXQgPSB0aGlzLmZpbGUuc2l6ZSAtIDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZUxlbmd0aCA9IHRoaXMuZmlsZS5zaXplXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDIwMClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coZW50cnksZmlsZSlcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlclxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYiA9IHRoaXMub25SZWFkRW50cnkuYmluZCh0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIGZyLm9ubG9hZCA9IGNiXHJcbiAgICAgICAgICAgICAgICAgICAgZnIub25lcnJvciA9IGNiXHJcbiAgICAgICAgICAgICAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW50cmllc1NvcnRGdW5jOiBmdW5jdGlvbihhLGIpIHtcclxuICAgICAgICAgICAgdmFyIGFubCA9IGEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgIHZhciBibmwgPSBiLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICBpZiAoYS5pc0RpcmVjdG9yeSAmJiBiLmlzRGlyZWN0b3J5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5sLmxvY2FsZUNvbXBhcmUoYm5sKVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGEuaXNEaXJlY3RvcnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGIuaXNEaXJlY3RvcnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLy8gYm90aCBmaWxlc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFubC5sb2NhbGVDb21wYXJlKGJubClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW5kZXJEaXJlY3RvcnlMaXN0aW5nSlNPTjogZnVuY3Rpb24ocmVzdWx0cykge1xyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcignY29udGVudC10eXBlJywnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcpXHJcbiAgICAgICAgICAgIHRoaXMud3JpdGUoSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5tYXAoZnVuY3Rpb24oZikgeyByZXR1cm4geyBuYW1lOmYubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxQYXRoOmYuZnVsbFBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0ZpbGU6Zi5pc0ZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0RpcmVjdG9yeTpmLmlzRGlyZWN0b3J5IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSwgbnVsbCwgMikpXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW5kZXJEaXJlY3RvcnlMaXN0aW5nVGVtcGxhdGU6IGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgaWYgKCEgV1NDLnRlbXBsYXRlX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbmRlckRpcmVjdG9yeUxpc3RpbmcocmVzdWx0cylcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXIoJ3RyYW5zZmVyLWVuY29kaW5nJywnY2h1bmtlZCcpXHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVIZWFkZXJzKDIwMClcclxuICAgICAgICAgICAgdGhpcy53cml0ZUNodW5rKFdTQy50ZW1wbGF0ZV9kYXRhIClcclxuICAgICAgICAgICAgdmFyIGh0bWwgPSBbJzxzY3JpcHQ+c3RhcnQoXCJjdXJyZW50IGRpcmVjdG9yeS4uLlwiKTwvc2NyaXB0PicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c2NyaXB0PmFkZFJvdyhcIi4uXCIsXCIuLlwiLDEsXCIxNzAgQlwiLFwiMTAvMi8xNSwgODozMjo0NSBQTVwiKTs8L3NjcmlwdD4nXVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciByYXduYW1lID0gcmVzdWx0c1tpXS5uYW1lXHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChyZXN1bHRzW2ldLm5hbWUpXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNkaXJlY3RvcnkgPSByZXN1bHRzW2ldLmlzRGlyZWN0b3J5XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlsZXNpemUgPSAnXCJcIidcclxuICAgICAgICAgICAgICAgIC8vdmFyIG1vZGlmaWVkID0gJzEwLzEzLzE1LCAxMDozODo0MCBBTSdcclxuICAgICAgICAgICAgICAgIHZhciBtb2RpZmllZCA9ICcnXHJcbiAgICAgICAgICAgICAgICAvLyByYXcsIHVybGVuY29kZWQsIGlzZGlyZWN0b3J5LCBzaXplLCBcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPHNjcmlwdD5hZGRSb3coXCInK3Jhd25hbWUrJ1wiLFwiJytuYW1lKydcIiwnK2lzZGlyZWN0b3J5KycsJytmaWxlc2l6ZSsnLFwiJyttb2RpZmllZCsnXCIpOzwvc2NyaXB0PicpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBodG1sLmpvaW4oJ1xcbicpXHJcbiAgICAgICAgICAgIGRhdGEgPSBuZXcgVGV4dEVuY29kZXIoJ3V0Zi04JykuZW5jb2RlKGRhdGEpLmJ1ZmZlclxyXG4gICAgICAgICAgICB0aGlzLndyaXRlQ2h1bmsoZGF0YSlcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24ud3JpdGUoV1NDLnN0cjJhYignMFxcclxcblxcclxcbicpKVxyXG4gICAgICAgICAgICB0aGlzLmZpbmlzaCgpXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW5kZXJEaXJlY3RvcnlMaXN0aW5nOiBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICAgICAgICAgIHZhciBodG1sID0gWyc8aHRtbD4nXVxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzxzdHlsZT5saS5kaXJlY3Rvcnkge2JhY2tncm91bmQ6I2FhYn08L3N0eWxlPicpXHJcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGEgaHJlZj1cIi4uLz9zdGF0aWM9MVwiPnBhcmVudDwvYT4nKVxyXG4gICAgICAgICAgICBodG1sLnB1c2goJzx1bD4nKVxyXG4gICAgICAgICAgICByZXN1bHRzLnNvcnQoIHRoaXMuZW50cmllc1NvcnRGdW5jIClcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRPRE8gLS0gYWRkIHNvcnRpbmcgKGJ5IHF1ZXJ5IHBhcmFtZXRlcj8pIHNob3cgZmlsZSBzaXplP1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gXy5lc2NhcGUocmVzdWx0c1tpXS5uYW1lKVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbaV0uaXNEaXJlY3RvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImRpcmVjdG9yeVwiPjxhIGhyZWY9XCInICsgbmFtZSArICcvP3N0YXRpYz0xXCI+JyArIG5hbWUgKyAnPC9hPjwvbGk+JylcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGk+PGEgaHJlZj1cIicgKyBuYW1lICsgJz9zdGF0aWM9MVwiPicgKyBuYW1lICsgJzwvYT48L2xpPicpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3VsPjwvaHRtbD4nKVxyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcignY29udGVudC10eXBlJywndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04JylcclxuICAgICAgICAgICAgdGhpcy53cml0ZShodG1sLmpvaW4oJ1xcbicpKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25SZWFkRW50cnk6IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZXJyb3IgcmVhZGluZycsZXZ0LnRhcmdldC5lcnJvcilcclxuICAgICAgICAgICAgICAgIC8vIGNsZWFyIHRoaXMgZmlsZSBmcm9tIGNhY2hlLi4uXHJcbiAgICAgICAgICAgICAgICBXU0MuZW50cnlGaWxlQ2FjaGUudW5zZXQoIHRoaXMuZW50cnkuZmlsZXN5c3RlbS5uYW1lICsgJy8nICsgdGhpcy5lbnRyeS5mdWxsUGF0aCApXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LmNvbm5lY3Rpb24uY2xvc2UoKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBzZXQgbWltZSB0eXBlcyBldGM/XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlKGV2dC50YXJnZXQucmVzdWx0KVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH0sIFdTQy5CYXNlSGFuZGxlci5wcm90b3R5cGUpXHJcblxyXG4gICAgaWYgKGNocm9tZS5ydW50aW1lLmlkID09IFdTQy5zdG9yZV9pZCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNocm9tZS5ydW50aW1lLmdldFBhY2thZ2VEaXJlY3RvcnlFbnRyeSggZnVuY3Rpb24ocGVudHJ5KSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZV9maWxlbmFtZSA9ICdkaXJlY3RvcnktbGlzdGluZy10ZW1wbGF0ZS5odG1sJ1xyXG4gICAgICAgICAgICB2YXIgb25maWxlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCd0ZW1wbGF0ZSBmZXRjaDonLGUpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmZpbGUgPSBmdW5jdGlvbihmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbnJlYWQgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdTQy50ZW1wbGF0ZV9kYXRhID0gZXZ0LnRhcmdldC5yZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBvbnJlYWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnIub25lcnJvciA9IG9ucmVhZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlLmZpbGUoIG9uZmlsZSwgb25maWxlIClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwZW50cnkuZ2V0RmlsZSh0ZW1wbGF0ZV9maWxlbmFtZSx7Y3JlYXRlOmZhbHNlfSxvbmZpbGUsb25maWxlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG5cclxuICAgIFdTQy5EaXJlY3RvcnlFbnRyeUhhbmRsZXIgPSBEaXJlY3RvcnlFbnRyeUhhbmRsZXJcclxuXHJcbn0pKCk7XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9oYW5kbGVycy50c1xuLy8gbW9kdWxlIGlkID0gN1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLGZ1bmN0aW9uKCl7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlndXJlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuZ2V0QmFja2dyb3VuZFBhZ2UoZnVuY3Rpb24oYmcpe1xyXG4gICAgICAgICAgICBiZy5oaWRkZW5fY2xpY2tfY29uZmlndXJlKClcclxuICAgICAgICAgICAgLy9jaHJvbWUuYXBwLndpbmRvdy5jdXJyZW50KCkuY2xvc2UoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG59KVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vd3NjLWNocm9tZS93ZWItc2VydmVyLWNocm9tZS9oaWRkZW4udHNcbi8vIG1vZHVsZSBpZCA9IDhcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiKGZ1bmN0aW9uKCkge1xyXG52YXIgSFRUUFJFU1BPTlNFUyA9IHtcclxuICAgIFwiMjAwXCI6IFwiT0tcIiwgXHJcbiAgICBcIjIwMVwiOiBcIkNyZWF0ZWRcIiwgXHJcbiAgICBcIjIwMlwiOiBcIkFjY2VwdGVkXCIsIFxyXG4gICAgXCIyMDNcIjogXCJOb24tQXV0aG9yaXRhdGl2ZSBJbmZvcm1hdGlvblwiLCBcclxuICAgIFwiMjA0XCI6IFwiTm8gQ29udGVudFwiLCBcclxuICAgIFwiMjA1XCI6IFwiUmVzZXQgQ29udGVudFwiLCBcclxuICAgIFwiMjA2XCI6IFwiUGFydGlhbCBDb250ZW50XCIsIFxyXG4gICAgXCI0MDBcIjogXCJCYWQgUmVxdWVzdFwiLCBcclxuICAgIFwiNDAxXCI6IFwiVW5hdXRob3JpemVkXCIsIFxyXG4gICAgXCI0MDJcIjogXCJQYXltZW50IFJlcXVpcmVkXCIsIFxyXG4gICAgXCI0MDNcIjogXCJGb3JiaWRkZW5cIiwgXHJcbiAgICBcIjQwNFwiOiBcIk5vdCBGb3VuZFwiLCBcclxuICAgIFwiNDA1XCI6IFwiTWV0aG9kIE5vdCBBbGxvd2VkXCIsIFxyXG4gICAgXCI0MDZcIjogXCJOb3QgQWNjZXB0YWJsZVwiLCBcclxuICAgIFwiNDA3XCI6IFwiUHJveHkgQXV0aGVudGljYXRpb24gUmVxdWlyZWRcIiwgXHJcbiAgICBcIjQwOFwiOiBcIlJlcXVlc3QgVGltZW91dFwiLCBcclxuICAgIFwiNDA5XCI6IFwiQ29uZmxpY3RcIiwgXHJcbiAgICBcIjQxMFwiOiBcIkdvbmVcIiwgXHJcbiAgICBcIjQxMVwiOiBcIkxlbmd0aCBSZXF1aXJlZFwiLCBcclxuICAgIFwiNDEyXCI6IFwiUHJlY29uZGl0aW9uIEZhaWxlZFwiLCBcclxuICAgIFwiNDEzXCI6IFwiUmVxdWVzdCBFbnRpdHkgVG9vIExhcmdlXCIsIFxyXG4gICAgXCI0MTRcIjogXCJSZXF1ZXN0LVVSSSBUb28gTG9uZ1wiLCBcclxuICAgIFwiNDE1XCI6IFwiVW5zdXBwb3J0ZWQgTWVkaWEgVHlwZVwiLCBcclxuICAgIFwiNDE2XCI6IFwiUmVxdWVzdGVkIFJhbmdlIE5vdCBTYXRpc2ZpYWJsZVwiLCBcclxuICAgIFwiNDE3XCI6IFwiRXhwZWN0YXRpb24gRmFpbGVkXCIsIFxyXG4gICAgXCIxMDBcIjogXCJDb250aW51ZVwiLCBcclxuICAgIFwiMTAxXCI6IFwiU3dpdGNoaW5nIFByb3RvY29sc1wiLCBcclxuICAgIFwiMzAwXCI6IFwiTXVsdGlwbGUgQ2hvaWNlc1wiLCBcclxuICAgIFwiMzAxXCI6IFwiTW92ZWQgUGVybWFuZW50bHlcIiwgXHJcbiAgICBcIjMwMlwiOiBcIkZvdW5kXCIsIFxyXG4gICAgXCIzMDNcIjogXCJTZWUgT3RoZXJcIiwgXHJcbiAgICBcIjMwNFwiOiBcIk5vdCBNb2RpZmllZFwiLCBcclxuICAgIFwiMzA1XCI6IFwiVXNlIFByb3h5XCIsIFxyXG4gICAgXCIzMDZcIjogXCIoVW51c2VkKVwiLCBcclxuICAgIFwiMzA3XCI6IFwiVGVtcG9yYXJ5IFJlZGlyZWN0XCIsIFxyXG4gICAgXCI1MDBcIjogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiwgXHJcbiAgICBcIjUwMVwiOiBcIk5vdCBJbXBsZW1lbnRlZFwiLCBcclxuICAgIFwiNTAyXCI6IFwiQmFkIEdhdGV3YXlcIiwgXHJcbiAgICBcIjUwM1wiOiBcIlNlcnZpY2UgVW5hdmFpbGFibGVcIiwgXHJcbiAgICBcIjUwNFwiOiBcIkdhdGV3YXkgVGltZW91dFwiLCBcclxuICAgIFwiNTA1XCI6IFwiSFRUUCBWZXJzaW9uIE5vdCBTdXBwb3J0ZWRcIlxyXG59XHJcbldTQy5IVFRQUkVTUE9OU0VTID0gSFRUUFJFU1BPTlNFU1xyXG59KSgpO1xyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3dzYy1jaHJvbWUvd2ViLXNlcnZlci1jaHJvbWUvaHR0cGxpYi50c1xuLy8gbW9kdWxlIGlkID0gOVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJ3aW5kb3cucmVsb2FkID0gY2hyb21lLnJ1bnRpbWUucmVsb2FkXHJcblxyXG5mdW5jdGlvbiBhZGRpbnRlcmZhY2VzKCkge1xyXG4gICAgdmFyIHZlcnNpb24gPSBnZXRjaHJvbWV2ZXJzaW9uKClcclxuICAgIGlmICh2ZXJzaW9uID49IDQ0KSB7XHJcbiAgICAgICAgY2hyb21lLnN5c3RlbS5uZXR3b3JrLmdldE5ldHdvcmtJbnRlcmZhY2VzKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHdwb3J0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nob29zZS1wb3J0JykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvcnQgZm91bmQ6IFwiICsgd3BvcnQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgY29udExvY2FsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2FsLWludGVyZmFjZScpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250TG9jYWwgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbnRMb2NhbC5maXJzdENoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRMb2NhbC5yZW1vdmVDaGlsZChjb250TG9jYWwuZmlyc3RDaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxyXG4gICAgICAgICAgICAgICAgICAgIGEudGFyZ2V0ID0gXCJfYmxhbmtcIjtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaHJlZiA9ICdodHRwOi8vMTI3LjAuMC4xOicgKyB3cG9ydDtcclxuICAgICAgICAgICAgICAgICAgICBhLmlubmVyVGV4dCA9IGhyZWY7XHJcbiAgICAgICAgICAgICAgICAgICAgYS5ocmVmID0gaHJlZjtcclxuICAgICAgICAgICAgICAgICAgICBjb250TG9jYWwuYXBwZW5kQ2hpbGQoYSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vdCBjb250TG9jYWwhXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgY29udCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdGhlci1pbnRlcmZhY2VzJylcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29udCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY29udC5maXJzdENoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnQucmVtb3ZlQ2hpbGQoY29udC5maXJzdENoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHJlc3VsdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbmV0d29yayBpbnRlcmZhY2U6JyxyZXN1bHRbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRbaV0ucHJlZml4TGVuZ3RoID09IDI0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS50YXJnZXQgPSBcIl9ibGFua1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhyZWYgPSAnaHR0cDovLycgKyByZXN1bHRbaV0uYWRkcmVzcyArICc6JyArIHdwb3J0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5pbm5lclRleHQgPSBocmVmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5ocmVmID0gaHJlZjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnQuYXBwZW5kQ2hpbGQoYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm90IGNvbnQhXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNocm9tZS5ydW50aW1lLmdldEJhY2tncm91bmRQYWdlKCBmdW5jdGlvbihiZykge1xyXG4gICAgY29uc29sZS5sb2coJ2dvdCBiZyBwYWdlJylcclxuICAgIHdpbmRvdy5iZyA9IGJnO1xyXG4gICAgXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJykuaW5uZXJUZXh0ID0gJ09LJ1xyXG5cclxuICAgIGFkZGludGVyZmFjZXMoKVxyXG5cclxuICAgIGZ1bmN0aW9uIGNob29zZWZvbGRlcigpIHtcclxuICAgICAgICBjaHJvbWUuZmlsZVN5c3RlbS5jaG9vc2VFbnRyeSh7dHlwZTonb3BlbkRpcmVjdG9yeSd9LCBvbmNob29zZWZvbGRlcilcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvbmNob29zZWZvbGRlcihlbnRyeSkge1xyXG4gICAgICAgIGlmIChlbnRyeSkge1xyXG4gICAgICAgICAgICB3aW5kb3cuZW50cnkgPSBlbnRyeVxyXG4gICAgICAgICAgICBiZy5lbnRyeSA9IGVudHJ5XHJcbiAgICAgICAgICAgIGJnLmhhdmVlbnRyeShlbnRyeSlcclxuICAgICAgICAgICAgdmFyIHJldGFpbnN0ciA9IGNocm9tZS5maWxlU3lzdGVtLnJldGFpbkVudHJ5KGVudHJ5KVxyXG4gICAgICAgICAgICB2YXIgZCA9IHsncmV0YWluc3RyJzpyZXRhaW5zdHJ9XHJcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldChkKVxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VyZm9sZGVyJykuaW5uZXJUZXh0ID0gZFsncmV0YWluc3RyJ11cclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cycpLmlubmVyVGV4dCA9ICdPSydcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NldCByZXRhaW5zdHIhJylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nob29zZS1mb2xkZXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNob29zZWZvbGRlcilcclxuXHJcbiAgICBmdW5jdGlvbiBvblJlc3RhcnQoKSB7XHJcbiAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nob29zZS1wb3J0Jyk7XHJcbiAgICAgICAgaWYgKCFpbnB1dCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAgICAgdmFyIHdwb3J0ID0gaW5wdXQudmFsdWU7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJwb3J0IGZvdW5kOiBcIiArIHdwb3J0KTtcclxuICAgICAgICBhZGRpbnRlcmZhY2VzKClcclxuICAgICAgICBpZiAoYmcpIHtcclxuICAgICAgICAgICAgYmcucmVzdGFydChwYXJzZUludCh3cG9ydCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGFydCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25SZXN0YXJ0KVxyXG5cclxuXHJcblxyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdyZXRhaW5zdHInLGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBpZiAoZFsncmV0YWluc3RyJ10pIHtcclxuICAgICAgICAgICAgY2hyb21lLmZpbGVTeXN0ZW0ucmVzdG9yZUVudHJ5KGRbJ3JldGFpbnN0ciddLCBmdW5jdGlvbihlbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmVudHJ5ID0gZW50cnlcclxuICAgICAgICAgICAgICAgICAgICBiZy5lbnRyeSA9IGVudHJ5XHJcbiAgICAgICAgICAgICAgICAgICAgYmcuaGF2ZWVudHJ5KGVudHJ5KVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJykuaW5uZXJUZXh0ID0gJ0RJUkVDVE9SWSBNSVNTSU5HLiBDSE9PU0UgQUdBSU4uJyAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJmb2xkZXInKS5pbm5lclRleHQgPSBkWydyZXRhaW5zdHInXVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG5cclxuXHJcblxyXG59KVxyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3dzYy1jaHJvbWUvd2ViLXNlcnZlci1jaHJvbWUvaW5kZXgudHNcbi8vIG1vZHVsZSBpZCA9IDEwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIGFkZCB0aGlzIGZpbGUgdG8geW91ciBcImJsYWNrYm94XCIgZS5nLiBibGFja2JveGluZywgbWFraW5nIGRldnRvb2xzIG5vdCBzaG93IGxvZ3MgYXMgY29taW5nIGZyb20gaGVyZVxyXG4oZnVuY3Rpb24oKSB7XHJcblx0aWYgKGNvbnNvbGUuY2xvZykgeyByZXR1cm4gfVxyXG5cdHZhciBMID0ge1xyXG5cdFx0VVBOUDogeyBzaG93OiB0cnVlLCBjb2xvcjonZ3JlZW4nIH0sXHJcblx0XHRXU0M6IHsgc2hvdzogdHJ1ZSwgY29sb3I6J2dyZWVuJyB9XHJcblx0fVxyXG4gICAgT2JqZWN0LmtleXMoTCkuZm9yRWFjaCggZnVuY3Rpb24oaykgeyBMW2tdLm5hbWUgPSBrIH0gKVxyXG4gICAgd2luZG93Lk9SSUdJTkFMQ09OU09MRSA9IHtsb2c6Y29uc29sZS5sb2csIHdhcm46Y29uc29sZS53YXJuLCBlcnJvcjpjb25zb2xlLmVycm9yfVxyXG4gICAgd2luZG93LkxPR0xJU1RFTkVSUyA9IFtdXHJcbiAgICBmdW5jdGlvbiB3cmFwcGVkbG9nKG1ldGhvZCkge1xyXG4gICAgICAgIHZhciB3cmFwcGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxyXG4gICAgICAgICAgICBPUklHSU5BTENPTlNPTEVbbWV0aG9kXS5hcHBseShjb25zb2xlLGFyZ3MpXHJcbiAgICAgICAgICAgIGlmIChtZXRob2QgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgYXJncyA9IFsnJWNFcnJvcicsJ2NvbG9yOnJlZCddLmNvbmNhdChhcmdzKVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1ldGhvZCA9PSAnd2FybicpIHtcclxuICAgICAgICAgICAgICAgIGFyZ3MgPSBbJyVjV2FybicsJ2NvbG9yOm9yYW5nZSddLmNvbmNhdChhcmdzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB3cmFwcGVkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nID0gd3JhcHBlZGxvZygnbG9nJylcclxuICAgIGNvbnNvbGUud2FybiA9IHdyYXBwZWRsb2coJ3dhcm4nKVxyXG4gICAgY29uc29sZS5lcnJvciA9IHdyYXBwZWRsb2coJ2Vycm9yJylcclxuICAgIGNvbnNvbGUuY2xvZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICghIFdTQy5ERUJVRykgeyByZXR1cm4gfVxyXG4gICAgICAgIC8vIGNhdGVnb3J5IHNwZWNpZmljIGxvZ2dpbmdcclxuICAgICAgICB2YXIgdG9sb2cgPSBhcmd1bWVudHNbMF1cclxuXHRcdHRvbG9nID0gTFt0b2xvZ11cclxuICAgICAgICBpZiAodG9sb2cgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywxLGFyZ3VtZW50cy5sZW5ndGgpXHJcbiAgICAgICAgICAgIGFyZ3MgPSBbJyVjJyArICdVTkRFRicsICdjb2xvcjojYWMwJ10uY29uY2F0KGFyZ3MpXHJcbiAgICAgICAgICAgIGNvbnNvbGVsb2cuYXBwbHkoY29uc29sZSxhcmdzKVxyXG4gICAgICAgIH0gZWxzZSBpZiAodG9sb2cuc2hvdykge1xyXG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywxLGFyZ3VtZW50cy5sZW5ndGgpXHJcbiAgICAgICAgICAgIGlmICh0b2xvZy5jb2xvcikge1xyXG4gICAgICAgICAgICAgICAgYXJncyA9IFsnJWMnICsgdG9sb2cubmFtZSwgJ2NvbG9yOicrdG9sb2cuY29sb3JdLmNvbmNhdChhcmdzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE9SSUdJTkFMQ09OU09MRS5sb2cuYXBwbHkoY29uc29sZSxhcmdzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSkoKTtcclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi93c2MtY2hyb21lL3dlYi1zZXJ2ZXItY2hyb21lL2xvZy1mdWxsLnRzXG4vLyBtb2R1bGUgaWQgPSAxMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCIoZnVuY3Rpb24oKSB7XHJcbnZhciBNSU1FVFlQRVMgPSB7XHJcbiAgXCIxMjNcIjogXCJhcHBsaWNhdGlvbi92bmQubG90dXMtMS0yLTNcIiwgXHJcbiAgXCIzZG1sXCI6IFwidGV4dC92bmQuaW4zZC4zZG1sXCIsIFxyXG4gIFwiM2RzXCI6IFwiaW1hZ2UveC0zZHNcIiwgXHJcbiAgXCIzZzJcIjogXCJ2aWRlby8zZ3BwMlwiLCBcclxuICBcIjNncFwiOiBcInZpZGVvLzNncHBcIiwgXHJcbiAgXCI3elwiOiBcImFwcGxpY2F0aW9uL3gtN3otY29tcHJlc3NlZFwiLCBcclxuICBcImFhYlwiOiBcImFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1iaW5cIiwgXHJcbiAgXCJhYWNcIjogXCJhdWRpby94LWFhY1wiLCBcclxuICBcImFhbVwiOiBcImFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1tYXBcIiwgXHJcbiAgXCJhYXNcIjogXCJhcHBsaWNhdGlvbi94LWF1dGhvcndhcmUtc2VnXCIsIFxyXG4gIFwiYWJ3XCI6IFwiYXBwbGljYXRpb24veC1hYml3b3JkXCIsIFxyXG4gIFwiYWNcIjogXCJhcHBsaWNhdGlvbi9wa2l4LWF0dHItY2VydFwiLCBcclxuICBcImFjY1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5hbWVyaWNhbmR5bmFtaWNzLmFjY1wiLCBcclxuICBcImFjZVwiOiBcImFwcGxpY2F0aW9uL3gtYWNlLWNvbXByZXNzZWRcIiwgXHJcbiAgXCJhY3VcIjogXCJhcHBsaWNhdGlvbi92bmQuYWN1Y29ib2xcIiwgXHJcbiAgXCJhY3V0Y1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5hY3Vjb3JwXCIsIFxyXG4gIFwiYWRwXCI6IFwiYXVkaW8vYWRwY21cIiwgXHJcbiAgXCJhZXBcIjogXCJhcHBsaWNhdGlvbi92bmQuYXVkaW9ncmFwaFwiLCBcclxuICBcImFmbVwiOiBcImFwcGxpY2F0aW9uL3gtZm9udC10eXBlMVwiLCBcclxuICBcImFmcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5pYm0ubW9kY2FwXCIsIFxyXG4gIFwiYWhlYWRcIjogXCJhcHBsaWNhdGlvbi92bmQuYWhlYWQuc3BhY2VcIiwgXHJcbiAgXCJhaVwiOiBcImFwcGxpY2F0aW9uL3Bvc3RzY3JpcHRcIiwgXHJcbiAgXCJhaWZcIjogXCJhdWRpby94LWFpZmZcIiwgXHJcbiAgXCJhaWZjXCI6IFwiYXVkaW8veC1haWZmXCIsIFxyXG4gIFwiYWlmZlwiOiBcImF1ZGlvL3gtYWlmZlwiLCBcclxuICBcImFpclwiOiBcImFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5haXItYXBwbGljYXRpb24taW5zdGFsbGVyLXBhY2thZ2UremlwXCIsIFxyXG4gIFwiYWl0XCI6IFwiYXBwbGljYXRpb24vdm5kLmR2Yi5haXRcIiwgXHJcbiAgXCJhbWlcIjogXCJhcHBsaWNhdGlvbi92bmQuYW1pZ2EuYW1pXCIsIFxyXG4gIFwiYXBrXCI6IFwiYXBwbGljYXRpb24vdm5kLmFuZHJvaWQucGFja2FnZS1hcmNoaXZlXCIsIFxyXG4gIFwiYXBwY2FjaGVcIjogXCJ0ZXh0L2NhY2hlLW1hbmlmZXN0XCIsIFxyXG4gIFwiYXBwbGljYXRpb25cIjogXCJhcHBsaWNhdGlvbi94LW1zLWFwcGxpY2F0aW9uXCIsIFxyXG4gIFwiYXByXCI6IFwiYXBwbGljYXRpb24vdm5kLmxvdHVzLWFwcHJvYWNoXCIsIFxyXG4gIFwiYXJjXCI6IFwiYXBwbGljYXRpb24veC1mcmVlYXJjXCIsIFxyXG4gIFwiYXNjXCI6IFwiYXBwbGljYXRpb24vcGdwLXNpZ25hdHVyZVwiLCBcclxuICBcImFzZlwiOiBcInZpZGVvL3gtbXMtYXNmXCIsIFxyXG4gIFwiYXNtXCI6IFwidGV4dC94LWFzbVwiLCBcclxuICBcImFzb1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5hY2NwYWMuc2ltcGx5LmFzb1wiLCBcclxuICBcImFzeFwiOiBcInZpZGVvL3gtbXMtYXNmXCIsIFxyXG4gIFwiYXRjXCI6IFwiYXBwbGljYXRpb24vdm5kLmFjdWNvcnBcIiwgXHJcbiAgXCJhdG9tXCI6IFwiYXBwbGljYXRpb24vYXRvbSt4bWxcIiwgXHJcbiAgXCJhdG9tY2F0XCI6IFwiYXBwbGljYXRpb24vYXRvbWNhdCt4bWxcIiwgXHJcbiAgXCJhdG9tc3ZjXCI6IFwiYXBwbGljYXRpb24vYXRvbXN2Yyt4bWxcIiwgXHJcbiAgXCJhdHhcIjogXCJhcHBsaWNhdGlvbi92bmQuYW50aXguZ2FtZS1jb21wb25lbnRcIiwgXHJcbiAgXCJhdVwiOiBcImF1ZGlvL2Jhc2ljXCIsIFxyXG4gIFwiYXZpXCI6IFwidmlkZW8veC1tc3ZpZGVvXCIsIFxyXG4gIFwiYXdcIjogXCJhcHBsaWNhdGlvbi9hcHBsaXh3YXJlXCIsIFxyXG4gIFwiYXpmXCI6IFwiYXBwbGljYXRpb24vdm5kLmFpcnppcC5maWxlc2VjdXJlLmF6ZlwiLCBcclxuICBcImF6c1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5haXJ6aXAuZmlsZXNlY3VyZS5henNcIiwgXHJcbiAgXCJhendcIjogXCJhcHBsaWNhdGlvbi92bmQuYW1hem9uLmVib29rXCIsIFxyXG4gIFwiYmF0XCI6IFwiYXBwbGljYXRpb24veC1tc2Rvd25sb2FkXCIsIFxyXG4gIFwiYmNwaW9cIjogXCJhcHBsaWNhdGlvbi94LWJjcGlvXCIsIFxyXG4gIFwiYmRmXCI6IFwiYXBwbGljYXRpb24veC1mb250LWJkZlwiLCBcclxuICBcImJkbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zeW5jbWwuZG0rd2J4bWxcIiwgXHJcbiAgXCJiZWRcIjogXCJhcHBsaWNhdGlvbi92bmQucmVhbHZuYy5iZWRcIiwgXHJcbiAgXCJiaDJcIjogXCJhcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5c3Byc1wiLCBcclxuICBcImJpblwiOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiLCBcclxuICBcImJsYlwiOiBcImFwcGxpY2F0aW9uL3gtYmxvcmJcIiwgXHJcbiAgXCJibG9yYlwiOiBcImFwcGxpY2F0aW9uL3gtYmxvcmJcIiwgXHJcbiAgXCJibWlcIjogXCJhcHBsaWNhdGlvbi92bmQuYm1pXCIsIFxyXG4gIFwiYm1wXCI6IFwiaW1hZ2UvYm1wXCIsIFxyXG4gIFwiYm9va1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5mcmFtZW1ha2VyXCIsIFxyXG4gIFwiYm94XCI6IFwiYXBwbGljYXRpb24vdm5kLnByZXZpZXdzeXN0ZW1zLmJveFwiLCBcclxuICBcImJvelwiOiBcImFwcGxpY2F0aW9uL3gtYnppcDJcIiwgXHJcbiAgXCJicGtcIjogXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIiwgXHJcbiAgXCJidGlmXCI6IFwiaW1hZ2UvcHJzLmJ0aWZcIiwgXHJcbiAgXCJielwiOiBcImFwcGxpY2F0aW9uL3gtYnppcFwiLCBcclxuICBcImJ6MlwiOiBcImFwcGxpY2F0aW9uL3gtYnppcDJcIiwgXHJcbiAgXCJjXCI6IFwidGV4dC94LWNcIiwgXHJcbiAgXCJjMTFhbWNcIjogXCJhcHBsaWNhdGlvbi92bmQuY2x1ZXRydXN0LmNhcnRvbW9iaWxlLWNvbmZpZ1wiLCBcclxuICBcImMxMWFtelwiOiBcImFwcGxpY2F0aW9uL3ZuZC5jbHVldHJ1c3QuY2FydG9tb2JpbGUtY29uZmlnLXBrZ1wiLCBcclxuICBcImM0ZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5jbG9uay5jNGdyb3VwXCIsIFxyXG4gIFwiYzRmXCI6IFwiYXBwbGljYXRpb24vdm5kLmNsb25rLmM0Z3JvdXBcIiwgXHJcbiAgXCJjNGdcIjogXCJhcHBsaWNhdGlvbi92bmQuY2xvbmsuYzRncm91cFwiLCBcclxuICBcImM0cFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5jbG9uay5jNGdyb3VwXCIsIFxyXG4gIFwiYzR1XCI6IFwiYXBwbGljYXRpb24vdm5kLmNsb25rLmM0Z3JvdXBcIiwgXHJcbiAgXCJjYWJcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtY2FiLWNvbXByZXNzZWRcIiwgXHJcbiAgXCJjYWZcIjogXCJhdWRpby94LWNhZlwiLCBcclxuICBcImNhcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC50Y3BkdW1wLnBjYXBcIiwgXHJcbiAgXCJjYXJcIjogXCJhcHBsaWNhdGlvbi92bmQuY3VybC5jYXJcIiwgXHJcbiAgXCJjYXRcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtcGtpLnNlY2NhdFwiLCBcclxuICBcImNiN1wiOiBcImFwcGxpY2F0aW9uL3gtY2JyXCIsIFxyXG4gIFwiY2JhXCI6IFwiYXBwbGljYXRpb24veC1jYnJcIiwgXHJcbiAgXCJjYnJcIjogXCJhcHBsaWNhdGlvbi94LWNiclwiLCBcclxuICBcImNidFwiOiBcImFwcGxpY2F0aW9uL3gtY2JyXCIsIFxyXG4gIFwiY2J6XCI6IFwiYXBwbGljYXRpb24veC1jYnJcIiwgXHJcbiAgXCJjY1wiOiBcInRleHQveC1jXCIsIFxyXG4gIFwiY2N0XCI6IFwiYXBwbGljYXRpb24veC1kaXJlY3RvclwiLCBcclxuICBcImNjeG1sXCI6IFwiYXBwbGljYXRpb24vY2N4bWwreG1sXCIsIFxyXG4gIFwiY2RiY21zZ1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5jb250YWN0LmNtc2dcIiwgXHJcbiAgXCJjZGZcIjogXCJhcHBsaWNhdGlvbi94LW5ldGNkZlwiLCBcclxuICBcImNka2V5XCI6IFwiYXBwbGljYXRpb24vdm5kLm1lZGlhc3RhdGlvbi5jZGtleVwiLCBcclxuICBcImNkbWlhXCI6IFwiYXBwbGljYXRpb24vY2RtaS1jYXBhYmlsaXR5XCIsIFxyXG4gIFwiY2RtaWNcIjogXCJhcHBsaWNhdGlvbi9jZG1pLWNvbnRhaW5lclwiLCBcclxuICBcImNkbWlkXCI6IFwiYXBwbGljYXRpb24vY2RtaS1kb21haW5cIiwgXHJcbiAgXCJjZG1pb1wiOiBcImFwcGxpY2F0aW9uL2NkbWktb2JqZWN0XCIsIFxyXG4gIFwiY2RtaXFcIjogXCJhcHBsaWNhdGlvbi9jZG1pLXF1ZXVlXCIsIFxyXG4gIFwiY2R4XCI6IFwiY2hlbWljYWwveC1jZHhcIiwgXHJcbiAgXCJjZHhtbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5jaGVtZHJhdyt4bWxcIiwgXHJcbiAgXCJjZHlcIjogXCJhcHBsaWNhdGlvbi92bmQuY2luZGVyZWxsYVwiLCBcclxuICBcImNlclwiOiBcImFwcGxpY2F0aW9uL3BraXgtY2VydFwiLCBcclxuICBcImNmc1wiOiBcImFwcGxpY2F0aW9uL3gtY2ZzLWNvbXByZXNzZWRcIiwgXHJcbiAgXCJjZ21cIjogXCJpbWFnZS9jZ21cIiwgXHJcbiAgXCJjaGF0XCI6IFwiYXBwbGljYXRpb24veC1jaGF0XCIsIFxyXG4gIFwiY2htXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLWh0bWxoZWxwXCIsIFxyXG4gIFwiY2hydFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5rZGUua2NoYXJ0XCIsIFxyXG4gIFwiY2lmXCI6IFwiY2hlbWljYWwveC1jaWZcIiwgXHJcbiAgXCJjaWlcIjogXCJhcHBsaWNhdGlvbi92bmQuYW5zZXItd2ViLWNlcnRpZmljYXRlLWlzc3VlLWluaXRpYXRpb25cIiwgXHJcbiAgXCJjaWxcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtYXJ0Z2FscnlcIiwgXHJcbiAgXCJjbGFcIjogXCJhcHBsaWNhdGlvbi92bmQuY2xheW1vcmVcIiwgXHJcbiAgXCJjbGFzc1wiOiBcImFwcGxpY2F0aW9uL2phdmEtdm1cIiwgXHJcbiAgXCJjbGtrXCI6IFwiYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIua2V5Ym9hcmRcIiwgXHJcbiAgXCJjbGtwXCI6IFwiYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIucGFsZXR0ZVwiLCBcclxuICBcImNsa3RcIjogXCJhcHBsaWNhdGlvbi92bmQuY3JpY2suY2xpY2tlci50ZW1wbGF0ZVwiLCBcclxuICBcImNsa3dcIjogXCJhcHBsaWNhdGlvbi92bmQuY3JpY2suY2xpY2tlci53b3JkYmFua1wiLCBcclxuICBcImNsa3hcIjogXCJhcHBsaWNhdGlvbi92bmQuY3JpY2suY2xpY2tlclwiLCBcclxuICBcImNscFwiOiBcImFwcGxpY2F0aW9uL3gtbXNjbGlwXCIsIFxyXG4gIFwiY21jXCI6IFwiYXBwbGljYXRpb24vdm5kLmNvc21vY2FsbGVyXCIsIFxyXG4gIFwiY21kZlwiOiBcImNoZW1pY2FsL3gtY21kZlwiLCBcclxuICBcImNtbFwiOiBcImNoZW1pY2FsL3gtY21sXCIsIFxyXG4gIFwiY21wXCI6IFwiYXBwbGljYXRpb24vdm5kLnllbGxvd3JpdmVyLWN1c3RvbS1tZW51XCIsIFxyXG4gIFwiY214XCI6IFwiaW1hZ2UveC1jbXhcIiwgXHJcbiAgXCJjb2RcIjogXCJhcHBsaWNhdGlvbi92bmQucmltLmNvZFwiLCBcclxuICBcImNvbVwiOiBcImFwcGxpY2F0aW9uL3gtbXNkb3dubG9hZFwiLCBcclxuICBcImNvbmZcIjogXCJ0ZXh0L3BsYWluXCIsIFxyXG4gIFwiY3Bpb1wiOiBcImFwcGxpY2F0aW9uL3gtY3Bpb1wiLCBcclxuICBcImNwcFwiOiBcInRleHQveC1jXCIsIFxyXG4gIFwiY3B0XCI6IFwiYXBwbGljYXRpb24vbWFjLWNvbXBhY3Rwcm9cIiwgXHJcbiAgXCJjcmRcIjogXCJhcHBsaWNhdGlvbi94LW1zY2FyZGZpbGVcIiwgXHJcbiAgXCJjcmxcIjogXCJhcHBsaWNhdGlvbi9wa2l4LWNybFwiLCBcclxuICBcImNydFwiOiBcImFwcGxpY2F0aW9uL3gteDUwOS1jYS1jZXJ0XCIsIFxyXG4gIFwiY3J5cHRvbm90ZVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5yaWcuY3J5cHRvbm90ZVwiLCBcclxuICBcImNzaFwiOiBcImFwcGxpY2F0aW9uL3gtY3NoXCIsIFxyXG4gIFwiY3NtbFwiOiBcImNoZW1pY2FsL3gtY3NtbFwiLCBcclxuICBcImNzcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5jb21tb25zcGFjZVwiLCBcclxuICBcImNzc1wiOiBcInRleHQvY3NzXCIsIFxyXG4gIFwiY3N0XCI6IFwiYXBwbGljYXRpb24veC1kaXJlY3RvclwiLCBcclxuICBcImNzdlwiOiBcInRleHQvY3N2XCIsIFxyXG4gIFwiY3VcIjogXCJhcHBsaWNhdGlvbi9jdS1zZWVtZVwiLCBcclxuICBcImN1cmxcIjogXCJ0ZXh0L3ZuZC5jdXJsXCIsIFxyXG4gIFwiY3d3XCI6IFwiYXBwbGljYXRpb24vcHJzLmN3d1wiLCBcclxuICBcImN4dFwiOiBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIiwgXHJcbiAgXCJjeHhcIjogXCJ0ZXh0L3gtY1wiLCBcclxuICBcImRhZVwiOiBcIm1vZGVsL3ZuZC5jb2xsYWRhK3htbFwiLCBcclxuICBcImRhZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMuZGFmXCIsIFxyXG4gIFwiZGFydFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kYXJ0XCIsIFxyXG4gIFwiZGF0YWxlc3NcIjogXCJhcHBsaWNhdGlvbi92bmQuZmRzbi5zZWVkXCIsIFxyXG4gIFwiZGF2bW91bnRcIjogXCJhcHBsaWNhdGlvbi9kYXZtb3VudCt4bWxcIiwgXHJcbiAgXCJkYmtcIjogXCJhcHBsaWNhdGlvbi9kb2Nib29rK3htbFwiLCBcclxuICBcImRjclwiOiBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIiwgXHJcbiAgXCJkY3VybFwiOiBcInRleHQvdm5kLmN1cmwuZGN1cmxcIiwgXHJcbiAgXCJkZDJcIjogXCJhcHBsaWNhdGlvbi92bmQub21hLmRkMit4bWxcIiwgXHJcbiAgXCJkZGRcIjogXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmRkZFwiLCBcclxuICBcImRlYlwiOiBcImFwcGxpY2F0aW9uL3gtZGViaWFuLXBhY2thZ2VcIiwgXHJcbiAgXCJkZWZcIjogXCJ0ZXh0L3BsYWluXCIsIFxyXG4gIFwiZGVwbG95XCI6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIsIFxyXG4gIFwiZGVyXCI6IFwiYXBwbGljYXRpb24veC14NTA5LWNhLWNlcnRcIiwgXHJcbiAgXCJkZmFjXCI6IFwiYXBwbGljYXRpb24vdm5kLmRyZWFtZmFjdG9yeVwiLCBcclxuICBcImRnY1wiOiBcImFwcGxpY2F0aW9uL3gtZGdjLWNvbXByZXNzZWRcIiwgXHJcbiAgXCJkaWNcIjogXCJ0ZXh0L3gtY1wiLCBcclxuICBcImRpclwiOiBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIiwgXHJcbiAgXCJkaXNcIjogXCJhcHBsaWNhdGlvbi92bmQubW9iaXVzLmRpc1wiLCBcclxuICBcImRpc3RcIjogXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIiwgXHJcbiAgXCJkaXN0elwiOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiLCBcclxuICBcImRqdlwiOiBcImltYWdlL3ZuZC5kanZ1XCIsIFxyXG4gIFwiZGp2dVwiOiBcImltYWdlL3ZuZC5kanZ1XCIsIFxyXG4gIFwiZGxsXCI6IFwiYXBwbGljYXRpb24veC1tc2Rvd25sb2FkXCIsIFxyXG4gIFwiZG1nXCI6IFwiYXBwbGljYXRpb24veC1hcHBsZS1kaXNraW1hZ2VcIiwgXHJcbiAgXCJkbXBcIjogXCJhcHBsaWNhdGlvbi92bmQudGNwZHVtcC5wY2FwXCIsIFxyXG4gIFwiZG1zXCI6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIsIFxyXG4gIFwiZG5hXCI6IFwiYXBwbGljYXRpb24vdm5kLmRuYVwiLCBcclxuICBcImRvY1wiOiBcImFwcGxpY2F0aW9uL21zd29yZFwiLCBcclxuICBcImRvY21cIjogXCJhcHBsaWNhdGlvbi92bmQubXMtd29yZC5kb2N1bWVudC5tYWNyb2VuYWJsZWQuMTJcIiwgXHJcbiAgXCJkb2N4XCI6IFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnRcIiwgXHJcbiAgXCJkb3RcIjogXCJhcHBsaWNhdGlvbi9tc3dvcmRcIiwgXHJcbiAgXCJkb3RtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXdvcmQudGVtcGxhdGUubWFjcm9lbmFibGVkLjEyXCIsIFxyXG4gIFwiZG90eFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLnRlbXBsYXRlXCIsIFxyXG4gIFwiZHBcIjogXCJhcHBsaWNhdGlvbi92bmQub3NnaS5kcFwiLCBcclxuICBcImRwZ1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5kcGdyYXBoXCIsIFxyXG4gIFwiZHJhXCI6IFwiYXVkaW8vdm5kLmRyYVwiLCBcclxuICBcImRzY1wiOiBcInRleHQvcHJzLmxpbmVzLnRhZ1wiLCBcclxuICBcImRzc2NcIjogXCJhcHBsaWNhdGlvbi9kc3NjK2RlclwiLCBcclxuICBcImR0YlwiOiBcImFwcGxpY2F0aW9uL3gtZHRib29rK3htbFwiLCBcclxuICBcImR0ZFwiOiBcImFwcGxpY2F0aW9uL3htbC1kdGRcIiwgXHJcbiAgXCJkdHNcIjogXCJhdWRpby92bmQuZHRzXCIsIFxyXG4gIFwiZHRzaGRcIjogXCJhdWRpby92bmQuZHRzLmhkXCIsIFxyXG4gIFwiZHVtcFwiOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiLCBcclxuICBcImR2YlwiOiBcInZpZGVvL3ZuZC5kdmIuZmlsZVwiLCBcclxuICBcImR2aVwiOiBcImFwcGxpY2F0aW9uL3gtZHZpXCIsIFxyXG4gIFwiZHdmXCI6IFwibW9kZWwvdm5kLmR3ZlwiLCBcclxuICBcImR3Z1wiOiBcImltYWdlL3ZuZC5kd2dcIiwgXHJcbiAgXCJkeGZcIjogXCJpbWFnZS92bmQuZHhmXCIsIFxyXG4gIFwiZHhwXCI6IFwiYXBwbGljYXRpb24vdm5kLnNwb3RmaXJlLmR4cFwiLCBcclxuICBcImR4clwiOiBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIiwgXHJcbiAgXCJlY2VscDQ4MDBcIjogXCJhdWRpby92bmQubnVlcmEuZWNlbHA0ODAwXCIsIFxyXG4gIFwiZWNlbHA3NDcwXCI6IFwiYXVkaW8vdm5kLm51ZXJhLmVjZWxwNzQ3MFwiLCBcclxuICBcImVjZWxwOTYwMFwiOiBcImF1ZGlvL3ZuZC5udWVyYS5lY2VscDk2MDBcIiwgXHJcbiAgXCJlY21hXCI6IFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdFwiLCBcclxuICBcImVkbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ub3ZhZGlnbS5lZG1cIiwgXHJcbiAgXCJlZHhcIjogXCJhcHBsaWNhdGlvbi92bmQubm92YWRpZ20uZWR4XCIsIFxyXG4gIFwiZWZpZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5waWNzZWxcIiwgXHJcbiAgXCJlaTZcIjogXCJhcHBsaWNhdGlvbi92bmQucGcub3Nhc2xpXCIsIFxyXG4gIFwiZWxjXCI6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIsIFxyXG4gIFwiZW1mXCI6IFwiYXBwbGljYXRpb24veC1tc21ldGFmaWxlXCIsIFxyXG4gIFwiZW1sXCI6IFwibWVzc2FnZS9yZmM4MjJcIiwgXHJcbiAgXCJlbW1hXCI6IFwiYXBwbGljYXRpb24vZW1tYSt4bWxcIiwgXHJcbiAgXCJlbXpcIjogXCJhcHBsaWNhdGlvbi94LW1zbWV0YWZpbGVcIiwgXHJcbiAgXCJlb2xcIjogXCJhdWRpby92bmQuZGlnaXRhbC13aW5kc1wiLCBcclxuICBcImVvdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1mb250b2JqZWN0XCIsIFxyXG4gIFwiZXBzXCI6IFwiYXBwbGljYXRpb24vcG9zdHNjcmlwdFwiLCBcclxuICBcImVwdWJcIjogXCJhcHBsaWNhdGlvbi9lcHViK3ppcFwiLCBcclxuICBcImVzM1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5lc3ppZ25vMyt4bWxcIiwgXHJcbiAgXCJlc2FcIjogXCJhcHBsaWNhdGlvbi92bmQub3NnaS5zdWJzeXN0ZW1cIiwgXHJcbiAgXCJlc2ZcIjogXCJhcHBsaWNhdGlvbi92bmQuZXBzb24uZXNmXCIsIFxyXG4gIFwiZXQzXCI6IFwiYXBwbGljYXRpb24vdm5kLmVzemlnbm8zK3htbFwiLCBcclxuICBcImV0eFwiOiBcInRleHQveC1zZXRleHRcIiwgXHJcbiAgXCJldmFcIjogXCJhcHBsaWNhdGlvbi94LWV2YVwiLCBcclxuICBcImV2eVwiOiBcImFwcGxpY2F0aW9uL3gtZW52b3lcIiwgXHJcbiAgXCJleGVcIjogXCJhcHBsaWNhdGlvbi94LW1zZG93bmxvYWRcIiwgXHJcbiAgXCJleGlcIjogXCJhcHBsaWNhdGlvbi9leGlcIiwgXHJcbiAgXCJleHRcIjogXCJhcHBsaWNhdGlvbi92bmQubm92YWRpZ20uZXh0XCIsIFxyXG4gIFwiZXpcIjogXCJhcHBsaWNhdGlvbi9hbmRyZXctaW5zZXRcIiwgXHJcbiAgXCJlejJcIjogXCJhcHBsaWNhdGlvbi92bmQuZXpwaXgtYWxidW1cIiwgXHJcbiAgXCJlejNcIjogXCJhcHBsaWNhdGlvbi92bmQuZXpwaXgtcGFja2FnZVwiLCBcclxuICBcImZcIjogXCJ0ZXh0L3gtZm9ydHJhblwiLCBcclxuICBcImY0dlwiOiBcInZpZGVvL3gtZjR2XCIsIFxyXG4gIFwiZjc3XCI6IFwidGV4dC94LWZvcnRyYW5cIiwgXHJcbiAgXCJmOTBcIjogXCJ0ZXh0L3gtZm9ydHJhblwiLCBcclxuICBcImZic1wiOiBcImltYWdlL3ZuZC5mYXN0Ymlkc2hlZXRcIiwgXHJcbiAgXCJmY2R0XCI6IFwiYXBwbGljYXRpb24vdm5kLmFkb2JlLmZvcm1zY2VudHJhbC5mY2R0XCIsIFxyXG4gIFwiZmNzXCI6IFwiYXBwbGljYXRpb24vdm5kLmlzYWMuZmNzXCIsIFxyXG4gIFwiZmRmXCI6IFwiYXBwbGljYXRpb24vdm5kLmZkZlwiLCBcclxuICBcImZlX2xhdW5jaFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kZW5vdm8uZmNzZWxheW91dC1saW5rXCIsIFxyXG4gIFwiZmc1XCI6IFwiYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNncFwiLCBcclxuICBcImZnZFwiOiBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIiwgXHJcbiAgXCJmaFwiOiBcImltYWdlL3gtZnJlZWhhbmRcIiwgXHJcbiAgXCJmaDRcIjogXCJpbWFnZS94LWZyZWVoYW5kXCIsIFxyXG4gIFwiZmg1XCI6IFwiaW1hZ2UveC1mcmVlaGFuZFwiLCBcclxuICBcImZoN1wiOiBcImltYWdlL3gtZnJlZWhhbmRcIiwgXHJcbiAgXCJmaGNcIjogXCJpbWFnZS94LWZyZWVoYW5kXCIsIFxyXG4gIFwiZmlnXCI6IFwiYXBwbGljYXRpb24veC14ZmlnXCIsIFxyXG4gIFwiZmxhY1wiOiBcImF1ZGlvL3gtZmxhY1wiLCBcclxuICBcImZsaVwiOiBcInZpZGVvL3gtZmxpXCIsIFxyXG4gIFwiZmxvXCI6IFwiYXBwbGljYXRpb24vdm5kLm1pY3JvZ3JhZnguZmxvXCIsIFxyXG4gIFwiZmx2XCI6IFwidmlkZW8veC1mbHZcIiwgXHJcbiAgXCJmbHdcIjogXCJhcHBsaWNhdGlvbi92bmQua2RlLmtpdmlvXCIsIFxyXG4gIFwiZmx4XCI6IFwidGV4dC92bmQuZm1pLmZsZXhzdG9yXCIsIFxyXG4gIFwiZmx5XCI6IFwidGV4dC92bmQuZmx5XCIsIFxyXG4gIFwiZm1cIjogXCJhcHBsaWNhdGlvbi92bmQuZnJhbWVtYWtlclwiLCBcclxuICBcImZuY1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmZuY1wiLCBcclxuICBcImZvclwiOiBcInRleHQveC1mb3J0cmFuXCIsIFxyXG4gIFwiZnB4XCI6IFwiaW1hZ2Uvdm5kLmZweFwiLCBcclxuICBcImZyYW1lXCI6IFwiYXBwbGljYXRpb24vdm5kLmZyYW1lbWFrZXJcIiwgXHJcbiAgXCJmc2NcIjogXCJhcHBsaWNhdGlvbi92bmQuZnNjLndlYmxhdW5jaFwiLCBcclxuICBcImZzdFwiOiBcImltYWdlL3ZuZC5mc3RcIiwgXHJcbiAgXCJmdGNcIjogXCJhcHBsaWNhdGlvbi92bmQuZmx1eHRpbWUuY2xpcFwiLCBcclxuICBcImZ0aVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5hbnNlci13ZWItZnVuZHMtdHJhbnNmZXItaW5pdGlhdGlvblwiLCBcclxuICBcImZ2dFwiOiBcInZpZGVvL3ZuZC5mdnRcIiwgXHJcbiAgXCJmeHBcIjogXCJhcHBsaWNhdGlvbi92bmQuYWRvYmUuZnhwXCIsIFxyXG4gIFwiZnhwbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5meHBcIiwgXHJcbiAgXCJmenNcIjogXCJhcHBsaWNhdGlvbi92bmQuZnV6enlzaGVldFwiLCBcclxuICBcImcyd1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5nZW9wbGFuXCIsIFxyXG4gIFwiZzNcIjogXCJpbWFnZS9nM2ZheFwiLCBcclxuICBcImczd1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5nZW9zcGFjZVwiLCBcclxuICBcImdhY1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtYWNjb3VudFwiLCBcclxuICBcImdhbVwiOiBcImFwcGxpY2F0aW9uL3gtdGFkc1wiLCBcclxuICBcImdiclwiOiBcImFwcGxpY2F0aW9uL3Jwa2ktZ2hvc3RidXN0ZXJzXCIsIFxyXG4gIFwiZ2NhXCI6IFwiYXBwbGljYXRpb24veC1nY2EtY29tcHJlc3NlZFwiLCBcclxuICBcImdkbFwiOiBcIm1vZGVsL3ZuZC5nZGxcIiwgXHJcbiAgXCJnZW9cIjogXCJhcHBsaWNhdGlvbi92bmQuZHluYWdlb1wiLCBcclxuICBcImdleFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5nZW9tZXRyeS1leHBsb3JlclwiLCBcclxuICBcImdnYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5nZW9nZWJyYS5maWxlXCIsIFxyXG4gIFwiZ2d0XCI6IFwiYXBwbGljYXRpb24vdm5kLmdlb2dlYnJhLnRvb2xcIiwgXHJcbiAgXCJnaGZcIjogXCJhcHBsaWNhdGlvbi92bmQuZ3Jvb3ZlLWhlbHBcIiwgXHJcbiAgXCJnaWZcIjogXCJpbWFnZS9naWZcIiwgXHJcbiAgXCJnaW1cIjogXCJhcHBsaWNhdGlvbi92bmQuZ3Jvb3ZlLWlkZW50aXR5LW1lc3NhZ2VcIiwgXHJcbiAgXCJnbWxcIjogXCJhcHBsaWNhdGlvbi9nbWwreG1sXCIsIFxyXG4gIFwiZ214XCI6IFwiYXBwbGljYXRpb24vdm5kLmdteFwiLCBcclxuICBcImdudW1lcmljXCI6IFwiYXBwbGljYXRpb24veC1nbnVtZXJpY1wiLCBcclxuICBcImdwaFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5mbG9ncmFwaGl0XCIsIFxyXG4gIFwiZ3B4XCI6IFwiYXBwbGljYXRpb24vZ3B4K3htbFwiLCBcclxuICBcImdxZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ncmFmZXFcIiwgXHJcbiAgXCJncXNcIjogXCJhcHBsaWNhdGlvbi92bmQuZ3JhZmVxXCIsIFxyXG4gIFwiZ3JhbVwiOiBcImFwcGxpY2F0aW9uL3NyZ3NcIiwgXHJcbiAgXCJncmFtcHNcIjogXCJhcHBsaWNhdGlvbi94LWdyYW1wcy14bWxcIiwgXHJcbiAgXCJncmVcIjogXCJhcHBsaWNhdGlvbi92bmQuZ2VvbWV0cnktZXhwbG9yZXJcIiwgXHJcbiAgXCJncnZcIjogXCJhcHBsaWNhdGlvbi92bmQuZ3Jvb3ZlLWluamVjdG9yXCIsIFxyXG4gIFwiZ3J4bWxcIjogXCJhcHBsaWNhdGlvbi9zcmdzK3htbFwiLCBcclxuICBcImdzZlwiOiBcImFwcGxpY2F0aW9uL3gtZm9udC1naG9zdHNjcmlwdFwiLCBcclxuICBcImd0YXJcIjogXCJhcHBsaWNhdGlvbi94LWd0YXJcIiwgXHJcbiAgXCJndG1cIjogXCJhcHBsaWNhdGlvbi92bmQuZ3Jvb3ZlLXRvb2wtbWVzc2FnZVwiLCBcclxuICBcImd0d1wiOiBcIm1vZGVsL3ZuZC5ndHdcIiwgXHJcbiAgXCJndlwiOiBcInRleHQvdm5kLmdyYXBodml6XCIsIFxyXG4gIFwiZ3hmXCI6IFwiYXBwbGljYXRpb24vZ3hmXCIsIFxyXG4gIFwiZ3h0XCI6IFwiYXBwbGljYXRpb24vdm5kLmdlb25leHRcIiwgXHJcbiAgXCJoXCI6IFwidGV4dC94LWNcIiwgXHJcbiAgXCJoMjYxXCI6IFwidmlkZW8vaDI2MVwiLCBcclxuICBcImgyNjNcIjogXCJ2aWRlby9oMjYzXCIsIFxyXG4gIFwiaDI2NFwiOiBcInZpZGVvL2gyNjRcIiwgXHJcbiAgXCJoYWxcIjogXCJhcHBsaWNhdGlvbi92bmQuaGFsK3htbFwiLCBcclxuICBcImhiY2lcIjogXCJhcHBsaWNhdGlvbi92bmQuaGJjaVwiLCBcclxuICBcImhkZlwiOiBcImFwcGxpY2F0aW9uL3gtaGRmXCIsIFxyXG4gIFwiaGhcIjogXCJ0ZXh0L3gtY1wiLCBcclxuICBcImhscFwiOiBcImFwcGxpY2F0aW9uL3dpbmhscFwiLCBcclxuICBcImhwZ2xcIjogXCJhcHBsaWNhdGlvbi92bmQuaHAtaHBnbFwiLCBcclxuICBcImhwaWRcIjogXCJhcHBsaWNhdGlvbi92bmQuaHAtaHBpZFwiLCBcclxuICBcImhwc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5ocC1ocHNcIiwgXHJcbiAgXCJocXhcIjogXCJhcHBsaWNhdGlvbi9tYWMtYmluaGV4NDBcIiwgXHJcbiAgXCJodGtlXCI6IFwiYXBwbGljYXRpb24vdm5kLmtlbmFtZWFhcHBcIiwgXHJcbiAgXCJodG1cIjogXCJ0ZXh0L2h0bWxcIiwgXHJcbiAgXCJodG1sXCI6IFwidGV4dC9odG1sXCIsIFxyXG4gIFwiaHZkXCI6IFwiYXBwbGljYXRpb24vdm5kLnlhbWFoYS5odi1kaWNcIiwgXHJcbiAgXCJodnBcIjogXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLmh2LXZvaWNlXCIsIFxyXG4gIFwiaHZzXCI6IFwiYXBwbGljYXRpb24vdm5kLnlhbWFoYS5odi1zY3JpcHRcIiwgXHJcbiAgXCJpMmdcIjogXCJhcHBsaWNhdGlvbi92bmQuaW50ZXJnZW9cIiwgXHJcbiAgXCJpY2NcIjogXCJhcHBsaWNhdGlvbi92bmQuaWNjcHJvZmlsZVwiLCBcclxuICBcImljZVwiOiBcIngtY29uZmVyZW5jZS94LWNvb2x0YWxrXCIsIFxyXG4gIFwiaWNtXCI6IFwiYXBwbGljYXRpb24vdm5kLmljY3Byb2ZpbGVcIiwgXHJcbiAgXCJpY29cIjogXCJpbWFnZS94LWljb25cIiwgXHJcbiAgXCJpY3NcIjogXCJ0ZXh0L2NhbGVuZGFyXCIsIFxyXG4gIFwiaWVmXCI6IFwiaW1hZ2UvaWVmXCIsIFxyXG4gIFwiaWZiXCI6IFwidGV4dC9jYWxlbmRhclwiLCBcclxuICBcImlmbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtZGF0YVwiLCBcclxuICBcImlnZXNcIjogXCJtb2RlbC9pZ2VzXCIsIFxyXG4gIFwiaWdsXCI6IFwiYXBwbGljYXRpb24vdm5kLmlnbG9hZGVyXCIsIFxyXG4gIFwiaWdtXCI6IFwiYXBwbGljYXRpb24vdm5kLmluc29ycy5pZ21cIiwgXHJcbiAgXCJpZ3NcIjogXCJtb2RlbC9pZ2VzXCIsIFxyXG4gIFwiaWd4XCI6IFwiYXBwbGljYXRpb24vdm5kLm1pY3JvZ3JhZnguaWd4XCIsIFxyXG4gIFwiaWlmXCI6IFwiYXBwbGljYXRpb24vdm5kLnNoYW5hLmluZm9ybWVkLmludGVyY2hhbmdlXCIsIFxyXG4gIFwiaW1wXCI6IFwiYXBwbGljYXRpb24vdm5kLmFjY3BhYy5zaW1wbHkuaW1wXCIsIFxyXG4gIFwiaW1zXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLWltc1wiLCBcclxuICBcImluXCI6IFwidGV4dC9wbGFpblwiLCBcclxuICBcImlua1wiOiBcImFwcGxpY2F0aW9uL2lua21sK3htbFwiLCBcclxuICBcImlua21sXCI6IFwiYXBwbGljYXRpb24vaW5rbWwreG1sXCIsIFxyXG4gIFwiaW5zdGFsbFwiOiBcImFwcGxpY2F0aW9uL3gtaW5zdGFsbC1pbnN0cnVjdGlvbnNcIiwgXHJcbiAgXCJpb3RhXCI6IFwiYXBwbGljYXRpb24vdm5kLmFzdHJhZWEtc29mdHdhcmUuaW90YVwiLCBcclxuICBcImlwZml4XCI6IFwiYXBwbGljYXRpb24vaXBmaXhcIiwgXHJcbiAgXCJpcGtcIjogXCJhcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQucGFja2FnZVwiLCBcclxuICBcImlybVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5pYm0ucmlnaHRzLW1hbmFnZW1lbnRcIiwgXHJcbiAgXCJpcnBcIjogXCJhcHBsaWNhdGlvbi92bmQuaXJlcG9zaXRvcnkucGFja2FnZSt4bWxcIiwgXHJcbiAgXCJpc29cIjogXCJhcHBsaWNhdGlvbi94LWlzbzk2NjAtaW1hZ2VcIiwgXHJcbiAgXCJpdHBcIjogXCJhcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQuZm9ybXRlbXBsYXRlXCIsIFxyXG4gIFwiaXZwXCI6IFwiYXBwbGljYXRpb24vdm5kLmltbWVydmlzaW9uLWl2cFwiLCBcclxuICBcIml2dVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5pbW1lcnZpc2lvbi1pdnVcIiwgXHJcbiAgXCJqYWRcIjogXCJ0ZXh0L3ZuZC5zdW4uajJtZS5hcHAtZGVzY3JpcHRvclwiLCBcclxuICBcImphbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5qYW1cIiwgXHJcbiAgXCJqYXJcIjogXCJhcHBsaWNhdGlvbi9qYXZhLWFyY2hpdmVcIiwgXHJcbiAgXCJqYXZhXCI6IFwidGV4dC94LWphdmEtc291cmNlXCIsIFxyXG4gIFwiamlzcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5qaXNwXCIsIFxyXG4gIFwiamx0XCI6IFwiYXBwbGljYXRpb24vdm5kLmhwLWpseXRcIiwgXHJcbiAgXCJqbmxwXCI6IFwiYXBwbGljYXRpb24veC1qYXZhLWpubHAtZmlsZVwiLCBcclxuICBcImpvZGFcIjogXCJhcHBsaWNhdGlvbi92bmQuam9vc3Quam9kYS1hcmNoaXZlXCIsIFxyXG4gIFwianBlXCI6IFwiaW1hZ2UvanBlZ1wiLCBcclxuICBcImpwZWdcIjogXCJpbWFnZS9qcGVnXCIsIFxyXG4gIFwianBnXCI6IFwiaW1hZ2UvanBlZ1wiLCBcclxuICBcImpwZ21cIjogXCJ2aWRlby9qcG1cIiwgXHJcbiAgXCJqcGd2XCI6IFwidmlkZW8vanBlZ1wiLCBcclxuICBcImpwbVwiOiBcInZpZGVvL2pwbVwiLCBcclxuICBcImpzXCI6IFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiLCBcclxuICBcImpzb25cIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsIFxyXG4gIFwianNvbm1sXCI6IFwiYXBwbGljYXRpb24vanNvbm1sK2pzb25cIiwgXHJcbiAgXCJrYXJcIjogXCJhdWRpby9taWRpXCIsIFxyXG4gIFwia2FyYm9uXCI6IFwiYXBwbGljYXRpb24vdm5kLmtkZS5rYXJib25cIiwgXHJcbiAgXCJrZm9cIjogXCJhcHBsaWNhdGlvbi92bmQua2RlLmtmb3JtdWxhXCIsIFxyXG4gIFwia2lhXCI6IFwiYXBwbGljYXRpb24vdm5kLmtpZHNwaXJhdGlvblwiLCBcclxuICBcImttbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5nb29nbGUtZWFydGgua21sK3htbFwiLCBcclxuICBcImttelwiOiBcImFwcGxpY2F0aW9uL3ZuZC5nb29nbGUtZWFydGgua216XCIsIFxyXG4gIFwia25lXCI6IFwiYXBwbGljYXRpb24vdm5kLmtpbmFyXCIsIFxyXG4gIFwia25wXCI6IFwiYXBwbGljYXRpb24vdm5kLmtpbmFyXCIsIFxyXG4gIFwia29uXCI6IFwiYXBwbGljYXRpb24vdm5kLmtkZS5rb250b3VyXCIsIFxyXG4gIFwia3ByXCI6IFwiYXBwbGljYXRpb24vdm5kLmtkZS5rcHJlc2VudGVyXCIsIFxyXG4gIFwia3B0XCI6IFwiYXBwbGljYXRpb24vdm5kLmtkZS5rcHJlc2VudGVyXCIsIFxyXG4gIFwia3B4eFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kcy1rZXlwb2ludFwiLCBcclxuICBcImtzcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5rZGUua3NwcmVhZFwiLCBcclxuICBcImt0clwiOiBcImFwcGxpY2F0aW9uL3ZuZC5rYWhvb3R6XCIsIFxyXG4gIFwia3R4XCI6IFwiaW1hZ2Uva3R4XCIsIFxyXG4gIFwia3R6XCI6IFwiYXBwbGljYXRpb24vdm5kLmthaG9vdHpcIiwgXHJcbiAgXCJrd2RcIjogXCJhcHBsaWNhdGlvbi92bmQua2RlLmt3b3JkXCIsIFxyXG4gIFwia3d0XCI6IFwiYXBwbGljYXRpb24vdm5kLmtkZS5rd29yZFwiLCBcclxuICBcImxhc3htbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5sYXMubGFzK3htbFwiLCBcclxuICBcImxhdGV4XCI6IFwiYXBwbGljYXRpb24veC1sYXRleFwiLCBcclxuICBcImxiZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5sbGFtYWdyYXBoaWNzLmxpZmUtYmFsYW5jZS5kZXNrdG9wXCIsIFxyXG4gIFwibGJlXCI6IFwiYXBwbGljYXRpb24vdm5kLmxsYW1hZ3JhcGhpY3MubGlmZS1iYWxhbmNlLmV4Y2hhbmdlK3htbFwiLCBcclxuICBcImxlc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5oaGUubGVzc29uLXBsYXllclwiLCBcclxuICBcImxoYVwiOiBcImFwcGxpY2F0aW9uL3gtbHpoLWNvbXByZXNzZWRcIiwgXHJcbiAgXCJsaW5rNjZcIjogXCJhcHBsaWNhdGlvbi92bmQucm91dGU2Ni5saW5rNjYreG1sXCIsIFxyXG4gIFwibGlzdFwiOiBcInRleHQvcGxhaW5cIiwgXHJcbiAgXCJsaXN0MzgyMFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5pYm0ubW9kY2FwXCIsIFxyXG4gIFwibGlzdGFmcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5pYm0ubW9kY2FwXCIsIFxyXG4gIFwibG5rXCI6IFwiYXBwbGljYXRpb24veC1tcy1zaG9ydGN1dFwiLCBcclxuICBcImxvZ1wiOiBcInRleHQvcGxhaW5cIiwgXHJcbiAgXCJsb3N0eG1sXCI6IFwiYXBwbGljYXRpb24vbG9zdCt4bWxcIiwgXHJcbiAgXCJscmZcIjogXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIiwgXHJcbiAgXCJscm1cIjogXCJhcHBsaWNhdGlvbi92bmQubXMtbHJtXCIsIFxyXG4gIFwibHRmXCI6IFwiYXBwbGljYXRpb24vdm5kLmZyb2dhbnMubHRmXCIsIFxyXG4gIFwibHZwXCI6IFwiYXVkaW8vdm5kLmx1Y2VudC52b2ljZVwiLCBcclxuICBcImx3cFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5sb3R1cy13b3JkcHJvXCIsIFxyXG4gIFwibHpoXCI6IFwiYXBwbGljYXRpb24veC1semgtY29tcHJlc3NlZFwiLCBcclxuICBcIm0xM1wiOiBcImFwcGxpY2F0aW9uL3gtbXNtZWRpYXZpZXdcIiwgXHJcbiAgXCJtMTRcIjogXCJhcHBsaWNhdGlvbi94LW1zbWVkaWF2aWV3XCIsIFxyXG4gIFwibTF2XCI6IFwidmlkZW8vbXBlZ1wiLCBcclxuICBcIm0yMVwiOiBcImFwcGxpY2F0aW9uL21wMjFcIiwgXHJcbiAgXCJtMmFcIjogXCJhdWRpby9tcGVnXCIsIFxyXG4gIFwibTJ2XCI6IFwidmlkZW8vbXBlZ1wiLCBcclxuICBcIm0zYVwiOiBcImF1ZGlvL21wZWdcIiwgXHJcbiAgXCJtM3VcIjogXCJhdWRpby94LW1wZWd1cmxcIiwgXHJcbiAgXCJtM3U4XCI6IFwiYXBwbGljYXRpb24vdm5kLmFwcGxlLm1wZWd1cmxcIiwgXHJcbiAgXCJtNHVcIjogXCJ2aWRlby92bmQubXBlZ3VybFwiLCBcclxuICBcIm00dlwiOiBcInZpZGVvL3gtbTR2XCIsIFxyXG4gIFwibWFcIjogXCJhcHBsaWNhdGlvbi9tYXRoZW1hdGljYVwiLCBcclxuICBcIm1hZHNcIjogXCJhcHBsaWNhdGlvbi9tYWRzK3htbFwiLCBcclxuICBcIm1hZ1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5lY293aW4uY2hhcnRcIiwgXHJcbiAgXCJtYWtlclwiOiBcImFwcGxpY2F0aW9uL3ZuZC5mcmFtZW1ha2VyXCIsIFxyXG4gIFwibWFuXCI6IFwidGV4dC90cm9mZlwiLCBcclxuICBcIm1hclwiOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiLCBcclxuICBcIm1hdGhtbFwiOiBcImFwcGxpY2F0aW9uL21hdGhtbCt4bWxcIiwgXHJcbiAgXCJtYlwiOiBcImFwcGxpY2F0aW9uL21hdGhlbWF0aWNhXCIsIFxyXG4gIFwibWJrXCI6IFwiYXBwbGljYXRpb24vdm5kLm1vYml1cy5tYmtcIiwgXHJcbiAgXCJtYm94XCI6IFwiYXBwbGljYXRpb24vbWJveFwiLCBcclxuICBcIm1jMVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tZWRjYWxjZGF0YVwiLCBcclxuICBcIm1jZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tY2RcIiwgXHJcbiAgXCJtY3VybFwiOiBcInRleHQvdm5kLmN1cmwubWN1cmxcIiwgXHJcbiAgXCJtZGJcIjogXCJhcHBsaWNhdGlvbi94LW1zYWNjZXNzXCIsIFxyXG4gIFwibWRpXCI6IFwiaW1hZ2Uvdm5kLm1zLW1vZGlcIiwgXHJcbiAgXCJtZVwiOiBcInRleHQvdHJvZmZcIiwgXHJcbiAgXCJtZXNoXCI6IFwibW9kZWwvbWVzaFwiLCBcclxuICBcIm1ldGE0XCI6IFwiYXBwbGljYXRpb24vbWV0YWxpbms0K3htbFwiLCBcclxuICBcIm1ldGFsaW5rXCI6IFwiYXBwbGljYXRpb24vbWV0YWxpbmsreG1sXCIsIFxyXG4gIFwibWV0c1wiOiBcImFwcGxpY2F0aW9uL21ldHMreG1sXCIsIFxyXG4gIFwibWZtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1mbXBcIiwgXHJcbiAgXCJtZnRcIjogXCJhcHBsaWNhdGlvbi9ycGtpLW1hbmlmZXN0XCIsIFxyXG4gIFwibWdwXCI6IFwiYXBwbGljYXRpb24vdm5kLm9zZ2VvLm1hcGd1aWRlLnBhY2thZ2VcIiwgXHJcbiAgXCJtZ3pcIjogXCJhcHBsaWNhdGlvbi92bmQucHJvdGV1cy5tYWdhemluZVwiLCBcclxuICBcIm1pZFwiOiBcImF1ZGlvL21pZGlcIiwgXHJcbiAgXCJtaWRpXCI6IFwiYXVkaW8vbWlkaVwiLCBcclxuICBcIm1pZVwiOiBcImFwcGxpY2F0aW9uL3gtbWllXCIsIFxyXG4gIFwibWlmXCI6IFwiYXBwbGljYXRpb24vdm5kLm1pZlwiLCBcclxuICBcIm1pbWVcIjogXCJtZXNzYWdlL3JmYzgyMlwiLCBcclxuICBcIm1qMlwiOiBcInZpZGVvL21qMlwiLCBcclxuICBcIm1qcDJcIjogXCJ2aWRlby9tajJcIiwgXHJcbiAgXCJtazNkXCI6IFwidmlkZW8veC1tYXRyb3NrYVwiLCBcclxuICBcIm1rYVwiOiBcImF1ZGlvL3gtbWF0cm9za2FcIiwgXHJcbiAgXCJta3NcIjogXCJ2aWRlby94LW1hdHJvc2thXCIsIFxyXG4gIFwibWt2XCI6IFwidmlkZW8veC1tYXRyb3NrYVwiLCBcclxuICBcIm1scFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kb2xieS5tbHBcIiwgXHJcbiAgXCJtbWRcIjogXCJhcHBsaWNhdGlvbi92bmQuY2hpcG51dHMua2FyYW9rZS1tbWRcIiwgXHJcbiAgXCJtbWZcIjogXCJhcHBsaWNhdGlvbi92bmQuc21hZlwiLCBcclxuICBcIm1tclwiOiBcImltYWdlL3ZuZC5mdWppeGVyb3guZWRtaWNzLW1tclwiLCBcclxuICBcIm1uZ1wiOiBcInZpZGVvL3gtbW5nXCIsIFxyXG4gIFwibW55XCI6IFwiYXBwbGljYXRpb24veC1tc21vbmV5XCIsIFxyXG4gIFwibW9iaVwiOiBcImFwcGxpY2F0aW9uL3gtbW9iaXBvY2tldC1lYm9va1wiLCBcclxuICBcIm1vZHNcIjogXCJhcHBsaWNhdGlvbi9tb2RzK3htbFwiLCBcclxuICBcIm1vdlwiOiBcInZpZGVvL3F1aWNrdGltZVwiLCBcclxuICBcIm1vdmllXCI6IFwidmlkZW8veC1zZ2ktbW92aWVcIiwgXHJcbiAgXCJtcDJcIjogXCJhdWRpby9tcGVnXCIsIFxyXG4gIFwibXAyMVwiOiBcImFwcGxpY2F0aW9uL21wMjFcIiwgXHJcbiAgXCJtcDJhXCI6IFwiYXVkaW8vbXBlZ1wiLCBcclxuICBcIm1wM1wiOiBcImF1ZGlvL21wZWdcIiwgXHJcbiAgXCJtcDRcIjogXCJ2aWRlby9tcDRcIiwgXHJcbiAgXCJtcDRhXCI6IFwiYXVkaW8vbXA0XCIsIFxyXG4gIFwibXA0c1wiOiBcImFwcGxpY2F0aW9uL21wNFwiLCBcclxuICBcIm1wNHZcIjogXCJ2aWRlby9tcDRcIiwgXHJcbiAgXCJtcGNcIjogXCJhcHBsaWNhdGlvbi92bmQubW9waHVuLmNlcnRpZmljYXRlXCIsIFxyXG4gIFwibXBlXCI6IFwidmlkZW8vbXBlZ1wiLCBcclxuICBcIm1wZWdcIjogXCJ2aWRlby9tcGVnXCIsIFxyXG4gIFwibXBnXCI6IFwidmlkZW8vbXBlZ1wiLCBcclxuICBcIm1wZzRcIjogXCJ2aWRlby9tcDRcIiwgXHJcbiAgXCJtcGdhXCI6IFwiYXVkaW8vbXBlZ1wiLCBcclxuICBcIm1wa2dcIjogXCJhcHBsaWNhdGlvbi92bmQuYXBwbGUuaW5zdGFsbGVyK3htbFwiLCBcclxuICBcIm1wbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ibHVlaWNlLm11bHRpcGFzc1wiLCBcclxuICBcIm1wblwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tb3BodW4uYXBwbGljYXRpb25cIiwgXHJcbiAgXCJtcHBcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtcHJvamVjdFwiLCBcclxuICBcIm1wdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wcm9qZWN0XCIsIFxyXG4gIFwibXB5XCI6IFwiYXBwbGljYXRpb24vdm5kLmlibS5taW5pcGF5XCIsIFxyXG4gIFwibXF5XCI6IFwiYXBwbGljYXRpb24vdm5kLm1vYml1cy5tcXlcIiwgXHJcbiAgXCJtcmNcIjogXCJhcHBsaWNhdGlvbi9tYXJjXCIsIFxyXG4gIFwibXJjeFwiOiBcImFwcGxpY2F0aW9uL21hcmN4bWwreG1sXCIsIFxyXG4gIFwibXNcIjogXCJ0ZXh0L3Ryb2ZmXCIsIFxyXG4gIFwibXNjbWxcIjogXCJhcHBsaWNhdGlvbi9tZWRpYXNlcnZlcmNvbnRyb2wreG1sXCIsIFxyXG4gIFwibXNlZWRcIjogXCJhcHBsaWNhdGlvbi92bmQuZmRzbi5tc2VlZFwiLCBcclxuICBcIm1zZXFcIjogXCJhcHBsaWNhdGlvbi92bmQubXNlcVwiLCBcclxuICBcIm1zZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5tc2ZcIiwgXHJcbiAgXCJtc2hcIjogXCJtb2RlbC9tZXNoXCIsIFxyXG4gIFwibXNpXCI6IFwiYXBwbGljYXRpb24veC1tc2Rvd25sb2FkXCIsIFxyXG4gIFwibXNsXCI6IFwiYXBwbGljYXRpb24vdm5kLm1vYml1cy5tc2xcIiwgXHJcbiAgXCJtc3R5XCI6IFwiYXBwbGljYXRpb24vdm5kLm11dmVlLnN0eWxlXCIsIFxyXG4gIFwibXRzXCI6IFwibW9kZWwvdm5kLm10c1wiLCBcclxuICBcIm11c1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5tdXNpY2lhblwiLCBcclxuICBcIm11c2ljeG1sXCI6IFwiYXBwbGljYXRpb24vdm5kLnJlY29yZGFyZS5tdXNpY3htbCt4bWxcIiwgXHJcbiAgXCJtdmJcIjogXCJhcHBsaWNhdGlvbi94LW1zbWVkaWF2aWV3XCIsIFxyXG4gIFwibXdmXCI6IFwiYXBwbGljYXRpb24vdm5kLm1mZXJcIiwgXHJcbiAgXCJteGZcIjogXCJhcHBsaWNhdGlvbi9teGZcIiwgXHJcbiAgXCJteGxcIjogXCJhcHBsaWNhdGlvbi92bmQucmVjb3JkYXJlLm11c2ljeG1sXCIsIFxyXG4gIFwibXhtbFwiOiBcImFwcGxpY2F0aW9uL3h2K3htbFwiLCBcclxuICBcIm14c1wiOiBcImFwcGxpY2F0aW9uL3ZuZC50cmlzY2FwZS5teHNcIiwgXHJcbiAgXCJteHVcIjogXCJ2aWRlby92bmQubXBlZ3VybFwiLCBcclxuICBcIm4tZ2FnZVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5uLWdhZ2Uuc3ltYmlhbi5pbnN0YWxsXCIsIFxyXG4gIFwibjNcIjogXCJ0ZXh0L24zXCIsIFxyXG4gIFwibmJcIjogXCJhcHBsaWNhdGlvbi9tYXRoZW1hdGljYVwiLCBcclxuICBcIm5icFwiOiBcImFwcGxpY2F0aW9uL3ZuZC53b2xmcmFtLnBsYXllclwiLCBcclxuICBcIm5jXCI6IFwiYXBwbGljYXRpb24veC1uZXRjZGZcIiwgXHJcbiAgXCJuY3hcIjogXCJhcHBsaWNhdGlvbi94LWR0Ym5jeCt4bWxcIiwgXHJcbiAgXCJuZm9cIjogXCJ0ZXh0L3gtbmZvXCIsIFxyXG4gIFwibmdkYXRcIjogXCJhcHBsaWNhdGlvbi92bmQubm9raWEubi1nYWdlLmRhdGFcIiwgXHJcbiAgXCJuaXRmXCI6IFwiYXBwbGljYXRpb24vdm5kLm5pdGZcIiwgXHJcbiAgXCJubHVcIjogXCJhcHBsaWNhdGlvbi92bmQubmV1cm9sYW5ndWFnZS5ubHVcIiwgXHJcbiAgXCJubWxcIjogXCJhcHBsaWNhdGlvbi92bmQuZW5saXZlblwiLCBcclxuICBcIm5uZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ub2JsZW5ldC1kaXJlY3RvcnlcIiwgXHJcbiAgXCJubnNcIjogXCJhcHBsaWNhdGlvbi92bmQubm9ibGVuZXQtc2VhbGVyXCIsIFxyXG4gIFwibm53XCI6IFwiYXBwbGljYXRpb24vdm5kLm5vYmxlbmV0LXdlYlwiLCBcclxuICBcIm5weFwiOiBcImltYWdlL3ZuZC5uZXQtZnB4XCIsIFxyXG4gIFwibnNjXCI6IFwiYXBwbGljYXRpb24veC1jb25mZXJlbmNlXCIsIFxyXG4gIFwibnNmXCI6IFwiYXBwbGljYXRpb24vdm5kLmxvdHVzLW5vdGVzXCIsIFxyXG4gIFwibnRmXCI6IFwiYXBwbGljYXRpb24vdm5kLm5pdGZcIiwgXHJcbiAgXCJuemJcIjogXCJhcHBsaWNhdGlvbi94LW56YlwiLCBcclxuICBcIm9hMlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5mdWppdHN1Lm9hc3lzMlwiLCBcclxuICBcIm9hM1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5mdWppdHN1Lm9hc3lzM1wiLCBcclxuICBcIm9hc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5mdWppdHN1Lm9hc3lzXCIsIFxyXG4gIFwib2JkXCI6IFwiYXBwbGljYXRpb24veC1tc2JpbmRlclwiLCBcclxuICBcIm9ialwiOiBcImFwcGxpY2F0aW9uL3gtdGdpZlwiLCBcclxuICBcIm9kYVwiOiBcImFwcGxpY2F0aW9uL29kYVwiLCBcclxuICBcIm9kYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZGF0YWJhc2VcIiwgXHJcbiAgXCJvZGNcIjogXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmNoYXJ0XCIsIFxyXG4gIFwib2RmXCI6IFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5mb3JtdWxhXCIsIFxyXG4gIFwib2RmdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZm9ybXVsYS10ZW1wbGF0ZVwiLCBcclxuICBcIm9kZ1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZ3JhcGhpY3NcIiwgXHJcbiAgXCJvZGlcIjogXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmltYWdlXCIsIFxyXG4gIFwib2RtXCI6IFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0LW1hc3RlclwiLCBcclxuICBcIm9kcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQucHJlc2VudGF0aW9uXCIsIFxyXG4gIFwib2RzXCI6IFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5zcHJlYWRzaGVldFwiLCBcclxuICBcIm9kdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dFwiLCBcclxuICBcIm9nYVwiOiBcImF1ZGlvL29nZ1wiLCBcclxuICBcIm9nZ1wiOiBcImF1ZGlvL29nZ1wiLCBcclxuICBcIm9ndlwiOiBcInZpZGVvL29nZ1wiLCBcclxuICBcIm9neFwiOiBcImFwcGxpY2F0aW9uL29nZ1wiLCBcclxuICBcIm9tZG9jXCI6IFwiYXBwbGljYXRpb24vb21kb2MreG1sXCIsIFxyXG4gIFwib25lcGtnXCI6IFwiYXBwbGljYXRpb24vb25lbm90ZVwiLCBcclxuICBcIm9uZXRtcFwiOiBcImFwcGxpY2F0aW9uL29uZW5vdGVcIiwgXHJcbiAgXCJvbmV0b2NcIjogXCJhcHBsaWNhdGlvbi9vbmVub3RlXCIsIFxyXG4gIFwib25ldG9jMlwiOiBcImFwcGxpY2F0aW9uL29uZW5vdGVcIiwgXHJcbiAgXCJvcGZcIjogXCJhcHBsaWNhdGlvbi9vZWJwcy1wYWNrYWdlK3htbFwiLCBcclxuICBcIm9wbWxcIjogXCJ0ZXh0L3gtb3BtbFwiLCBcclxuICBcIm9wcmNcIjogXCJhcHBsaWNhdGlvbi92bmQucGFsbVwiLCBcclxuICBcIm9yZ1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1vcmdhbml6ZXJcIiwgXHJcbiAgXCJvc2ZcIjogXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLm9wZW5zY29yZWZvcm1hdFwiLCBcclxuICBcIm9zZnB2Z1wiOiBcImFwcGxpY2F0aW9uL3ZuZC55YW1haGEub3BlbnNjb3JlZm9ybWF0Lm9zZnB2Zyt4bWxcIiwgXHJcbiAgXCJvdGNcIjogXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmNoYXJ0LXRlbXBsYXRlXCIsIFxyXG4gIFwib3RmXCI6IFwiYXBwbGljYXRpb24veC1mb250LW90ZlwiLCBcclxuICBcIm90Z1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZ3JhcGhpY3MtdGVtcGxhdGVcIiwgXHJcbiAgXCJvdGhcIjogXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQtd2ViXCIsIFxyXG4gIFwib3RpXCI6IFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5pbWFnZS10ZW1wbGF0ZVwiLCBcclxuICBcIm90cFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQucHJlc2VudGF0aW9uLXRlbXBsYXRlXCIsIFxyXG4gIFwib3RzXCI6IFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5zcHJlYWRzaGVldC10ZW1wbGF0ZVwiLCBcclxuICBcIm90dFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC10ZW1wbGF0ZVwiLCBcclxuICBcIm94cHNcIjogXCJhcHBsaWNhdGlvbi9veHBzXCIsIFxyXG4gIFwib3h0XCI6IFwiYXBwbGljYXRpb24vdm5kLm9wZW5vZmZpY2VvcmcuZXh0ZW5zaW9uXCIsIFxyXG4gIFwicFwiOiBcInRleHQveC1wYXNjYWxcIiwgXHJcbiAgXCJwMTBcIjogXCJhcHBsaWNhdGlvbi9wa2NzMTBcIiwgXHJcbiAgXCJwMTJcIjogXCJhcHBsaWNhdGlvbi94LXBrY3MxMlwiLCBcclxuICBcInA3YlwiOiBcImFwcGxpY2F0aW9uL3gtcGtjczctY2VydGlmaWNhdGVzXCIsIFxyXG4gIFwicDdjXCI6IFwiYXBwbGljYXRpb24vcGtjczctbWltZVwiLCBcclxuICBcInA3bVwiOiBcImFwcGxpY2F0aW9uL3BrY3M3LW1pbWVcIiwgXHJcbiAgXCJwN3JcIjogXCJhcHBsaWNhdGlvbi94LXBrY3M3LWNlcnRyZXFyZXNwXCIsIFxyXG4gIFwicDdzXCI6IFwiYXBwbGljYXRpb24vcGtjczctc2lnbmF0dXJlXCIsIFxyXG4gIFwicDhcIjogXCJhcHBsaWNhdGlvbi9wa2NzOFwiLCBcclxuICBcInBhc1wiOiBcInRleHQveC1wYXNjYWxcIiwgXHJcbiAgXCJwYXdcIjogXCJhcHBsaWNhdGlvbi92bmQucGF3YWFmaWxlXCIsIFxyXG4gIFwicGJkXCI6IFwiYXBwbGljYXRpb24vdm5kLnBvd2VyYnVpbGRlcjZcIiwgXHJcbiAgXCJwYm1cIjogXCJpbWFnZS94LXBvcnRhYmxlLWJpdG1hcFwiLCBcclxuICBcInBjYXBcIjogXCJhcHBsaWNhdGlvbi92bmQudGNwZHVtcC5wY2FwXCIsIFxyXG4gIFwicGNmXCI6IFwiYXBwbGljYXRpb24veC1mb250LXBjZlwiLCBcclxuICBcInBjbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ocC1wY2xcIiwgXHJcbiAgXCJwY2x4bFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5ocC1wY2x4bFwiLCBcclxuICBcInBjdFwiOiBcImltYWdlL3gtcGljdFwiLCBcclxuICBcInBjdXJsXCI6IFwiYXBwbGljYXRpb24vdm5kLmN1cmwucGN1cmxcIiwgXHJcbiAgXCJwY3hcIjogXCJpbWFnZS94LXBjeFwiLCBcclxuICBcInBkYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5wYWxtXCIsIFxyXG4gIFwicGRmXCI6IFwiYXBwbGljYXRpb24vcGRmXCIsIFxyXG4gIFwicGZhXCI6IFwiYXBwbGljYXRpb24veC1mb250LXR5cGUxXCIsIFxyXG4gIFwicGZiXCI6IFwiYXBwbGljYXRpb24veC1mb250LXR5cGUxXCIsIFxyXG4gIFwicGZtXCI6IFwiYXBwbGljYXRpb24veC1mb250LXR5cGUxXCIsIFxyXG4gIFwicGZyXCI6IFwiYXBwbGljYXRpb24vZm9udC10ZHBmclwiLCBcclxuICBcInBmeFwiOiBcImFwcGxpY2F0aW9uL3gtcGtjczEyXCIsIFxyXG4gIFwicGdtXCI6IFwiaW1hZ2UveC1wb3J0YWJsZS1ncmF5bWFwXCIsIFxyXG4gIFwicGduXCI6IFwiYXBwbGljYXRpb24veC1jaGVzcy1wZ25cIiwgXHJcbiAgXCJwZ3BcIjogXCJhcHBsaWNhdGlvbi9wZ3AtZW5jcnlwdGVkXCIsIFxyXG4gIFwicGljXCI6IFwiaW1hZ2UveC1waWN0XCIsIFxyXG4gIFwicGtnXCI6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIsIFxyXG4gIFwicGtpXCI6IFwiYXBwbGljYXRpb24vcGtpeGNtcFwiLCBcclxuICBcInBraXBhdGhcIjogXCJhcHBsaWNhdGlvbi9wa2l4LXBraXBhdGhcIiwgXHJcbiAgXCJwbGJcIjogXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctbGFyZ2VcIiwgXHJcbiAgXCJwbGNcIjogXCJhcHBsaWNhdGlvbi92bmQubW9iaXVzLnBsY1wiLCBcclxuICBcInBsZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5wb2NrZXRsZWFyblwiLCBcclxuICBcInBsc1wiOiBcImFwcGxpY2F0aW9uL3Bscyt4bWxcIiwgXHJcbiAgXCJwbWxcIjogXCJhcHBsaWNhdGlvbi92bmQuY3RjLXBvc21sXCIsIFxyXG4gIFwicG5nXCI6IFwiaW1hZ2UvcG5nXCIsIFxyXG4gIFwicG5tXCI6IFwiaW1hZ2UveC1wb3J0YWJsZS1hbnltYXBcIiwgXHJcbiAgXCJwb3J0cGtnXCI6IFwiYXBwbGljYXRpb24vdm5kLm1hY3BvcnRzLnBvcnRwa2dcIiwgXHJcbiAgXCJwb3RcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludFwiLCBcclxuICBcInBvdG1cIjogXCJhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludC50ZW1wbGF0ZS5tYWNyb2VuYWJsZWQuMTJcIiwgXHJcbiAgXCJwb3R4XCI6IFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnRlbXBsYXRlXCIsIFxyXG4gIFwicHBhbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LmFkZGluLm1hY3JvZW5hYmxlZC4xMlwiLCBcclxuICBcInBwZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5jdXBzLXBwZFwiLCBcclxuICBcInBwbVwiOiBcImltYWdlL3gtcG9ydGFibGUtcGl4bWFwXCIsIFxyXG4gIFwicHBzXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnRcIiwgXHJcbiAgXCJwcHNtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQuc2xpZGVzaG93Lm1hY3JvZW5hYmxlZC4xMlwiLCBcclxuICBcInBwc3hcIjogXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuc2xpZGVzaG93XCIsIFxyXG4gIFwicHB0XCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnRcIiwgXHJcbiAgXCJwcHRtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQucHJlc2VudGF0aW9uLm1hY3JvZW5hYmxlZC4xMlwiLCBcclxuICBcInBwdHhcIjogXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwucHJlc2VudGF0aW9uXCIsIFxyXG4gIFwicHFhXCI6IFwiYXBwbGljYXRpb24vdm5kLnBhbG1cIiwgXHJcbiAgXCJwcmNcIjogXCJhcHBsaWNhdGlvbi94LW1vYmlwb2NrZXQtZWJvb2tcIiwgXHJcbiAgXCJwcmVcIjogXCJhcHBsaWNhdGlvbi92bmQubG90dXMtZnJlZWxhbmNlXCIsIFxyXG4gIFwicHJmXCI6IFwiYXBwbGljYXRpb24vcGljcy1ydWxlc1wiLCBcclxuICBcInBzXCI6IFwiYXBwbGljYXRpb24vcG9zdHNjcmlwdFwiLCBcclxuICBcInBzYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC4zZ3BwLnBpYy1idy1zbWFsbFwiLCBcclxuICBcInBzZFwiOiBcImltYWdlL3ZuZC5hZG9iZS5waG90b3Nob3BcIiwgXHJcbiAgXCJwc2ZcIjogXCJhcHBsaWNhdGlvbi94LWZvbnQtbGludXgtcHNmXCIsIFxyXG4gIFwicHNrY3htbFwiOiBcImFwcGxpY2F0aW9uL3Bza2MreG1sXCIsIFxyXG4gIFwicHRpZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5wdmkucHRpZDFcIiwgXHJcbiAgXCJwdWJcIjogXCJhcHBsaWNhdGlvbi94LW1zcHVibGlzaGVyXCIsIFxyXG4gIFwicHZiXCI6IFwiYXBwbGljYXRpb24vdm5kLjNncHAucGljLWJ3LXZhclwiLCBcclxuICBcInB3blwiOiBcImFwcGxpY2F0aW9uL3ZuZC4zbS5wb3N0LWl0LW5vdGVzXCIsIFxyXG4gIFwicHlhXCI6IFwiYXVkaW8vdm5kLm1zLXBsYXlyZWFkeS5tZWRpYS5weWFcIiwgXHJcbiAgXCJweXZcIjogXCJ2aWRlby92bmQubXMtcGxheXJlYWR5Lm1lZGlhLnB5dlwiLCBcclxuICBcInFhbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5xdWlja2FuaW1lXCIsIFxyXG4gIFwicWJvXCI6IFwiYXBwbGljYXRpb24vdm5kLmludHUucWJvXCIsIFxyXG4gIFwicWZ4XCI6IFwiYXBwbGljYXRpb24vdm5kLmludHUucWZ4XCIsIFxyXG4gIFwicXBzXCI6IFwiYXBwbGljYXRpb24vdm5kLnB1Ymxpc2hhcmUtZGVsdGEtdHJlZVwiLCBcclxuICBcInF0XCI6IFwidmlkZW8vcXVpY2t0aW1lXCIsIFxyXG4gIFwicXdkXCI6IFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCIsIFxyXG4gIFwicXd0XCI6IFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCIsIFxyXG4gIFwicXhiXCI6IFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCIsIFxyXG4gIFwicXhkXCI6IFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCIsIFxyXG4gIFwicXhsXCI6IFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCIsIFxyXG4gIFwicXh0XCI6IFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCIsIFxyXG4gIFwicmFcIjogXCJhdWRpby94LXBuLXJlYWxhdWRpb1wiLCBcclxuICBcInJhbVwiOiBcImF1ZGlvL3gtcG4tcmVhbGF1ZGlvXCIsIFxyXG4gIFwicmFyXCI6IFwiYXBwbGljYXRpb24veC1yYXItY29tcHJlc3NlZFwiLCBcclxuICBcInJhc1wiOiBcImltYWdlL3gtY211LXJhc3RlclwiLCBcclxuICBcInJjcHJvZmlsZVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5pcHVucGx1Z2dlZC5yY3Byb2ZpbGVcIiwgXHJcbiAgXCJyZGZcIjogXCJhcHBsaWNhdGlvbi9yZGYreG1sXCIsIFxyXG4gIFwicmR6XCI6IFwiYXBwbGljYXRpb24vdm5kLmRhdGEtdmlzaW9uLnJkelwiLCBcclxuICBcInJlcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5idXNpbmVzc29iamVjdHNcIiwgXHJcbiAgXCJyZXNcIjogXCJhcHBsaWNhdGlvbi94LWR0YnJlc291cmNlK3htbFwiLCBcclxuICBcInJnYlwiOiBcImltYWdlL3gtcmdiXCIsIFxyXG4gIFwicmlmXCI6IFwiYXBwbGljYXRpb24vcmVnaW5mbyt4bWxcIiwgXHJcbiAgXCJyaXBcIjogXCJhdWRpby92bmQucmlwXCIsIFxyXG4gIFwicmlzXCI6IFwiYXBwbGljYXRpb24veC1yZXNlYXJjaC1pbmZvLXN5c3RlbXNcIiwgXHJcbiAgXCJybFwiOiBcImFwcGxpY2F0aW9uL3Jlc291cmNlLWxpc3RzK3htbFwiLCBcclxuICBcInJsY1wiOiBcImltYWdlL3ZuZC5mdWppeGVyb3guZWRtaWNzLXJsY1wiLCBcclxuICBcInJsZFwiOiBcImFwcGxpY2F0aW9uL3Jlc291cmNlLWxpc3RzLWRpZmYreG1sXCIsIFxyXG4gIFwicm1cIjogXCJhcHBsaWNhdGlvbi92bmQucm4tcmVhbG1lZGlhXCIsIFxyXG4gIFwicm1pXCI6IFwiYXVkaW8vbWlkaVwiLCBcclxuICBcInJtcFwiOiBcImF1ZGlvL3gtcG4tcmVhbGF1ZGlvLXBsdWdpblwiLCBcclxuICBcInJtc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5qY3AuamF2YW1lLm1pZGxldC1ybXNcIiwgXHJcbiAgXCJybXZiXCI6IFwiYXBwbGljYXRpb24vdm5kLnJuLXJlYWxtZWRpYS12YnJcIiwgXHJcbiAgXCJybmNcIjogXCJhcHBsaWNhdGlvbi9yZWxheC1uZy1jb21wYWN0LXN5bnRheFwiLCBcclxuICBcInJvYVwiOiBcImFwcGxpY2F0aW9uL3Jwa2ktcm9hXCIsIFxyXG4gIFwicm9mZlwiOiBcInRleHQvdHJvZmZcIiwgXHJcbiAgXCJycDlcIjogXCJhcHBsaWNhdGlvbi92bmQuY2xvYW50by5ycDlcIiwgXHJcbiAgXCJycHNzXCI6IFwiYXBwbGljYXRpb24vdm5kLm5va2lhLnJhZGlvLXByZXNldHNcIiwgXHJcbiAgXCJycHN0XCI6IFwiYXBwbGljYXRpb24vdm5kLm5va2lhLnJhZGlvLXByZXNldFwiLCBcclxuICBcInJxXCI6IFwiYXBwbGljYXRpb24vc3BhcnFsLXF1ZXJ5XCIsIFxyXG4gIFwicnNcIjogXCJhcHBsaWNhdGlvbi9ybHMtc2VydmljZXMreG1sXCIsIFxyXG4gIFwicnNkXCI6IFwiYXBwbGljYXRpb24vcnNkK3htbFwiLCBcclxuICBcInJzc1wiOiBcImFwcGxpY2F0aW9uL3Jzcyt4bWxcIiwgXHJcbiAgXCJydGZcIjogXCJhcHBsaWNhdGlvbi9ydGZcIiwgXHJcbiAgXCJydHhcIjogXCJ0ZXh0L3JpY2h0ZXh0XCIsIFxyXG4gIFwic1wiOiBcInRleHQveC1hc21cIiwgXHJcbiAgXCJzM21cIjogXCJhdWRpby9zM21cIiwgXHJcbiAgXCJzYWZcIjogXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtYXVkaW9cIiwgXHJcbiAgXCJzYm1sXCI6IFwiYXBwbGljYXRpb24vc2JtbCt4bWxcIiwgXHJcbiAgXCJzY1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5pYm0uc2VjdXJlLWNvbnRhaW5lclwiLCBcclxuICBcInNjZFwiOiBcImFwcGxpY2F0aW9uL3gtbXNzY2hlZHVsZVwiLCBcclxuICBcInNjbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1zY3JlZW5jYW1cIiwgXHJcbiAgXCJzY3FcIjogXCJhcHBsaWNhdGlvbi9zY3ZwLWN2LXJlcXVlc3RcIiwgXHJcbiAgXCJzY3NcIjogXCJhcHBsaWNhdGlvbi9zY3ZwLWN2LXJlc3BvbnNlXCIsIFxyXG4gIFwic2N1cmxcIjogXCJ0ZXh0L3ZuZC5jdXJsLnNjdXJsXCIsIFxyXG4gIFwic2RhXCI6IFwiYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5kcmF3XCIsIFxyXG4gIFwic2RjXCI6IFwiYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5jYWxjXCIsIFxyXG4gIFwic2RkXCI6IFwiYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5pbXByZXNzXCIsIFxyXG4gIFwic2RrZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zb2xlbnQuc2RrbSt4bWxcIiwgXHJcbiAgXCJzZGttXCI6IFwiYXBwbGljYXRpb24vdm5kLnNvbGVudC5zZGttK3htbFwiLCBcclxuICBcInNkcFwiOiBcImFwcGxpY2F0aW9uL3NkcFwiLCBcclxuICBcInNkd1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdGFyZGl2aXNpb24ud3JpdGVyXCIsIFxyXG4gIFwic2VlXCI6IFwiYXBwbGljYXRpb24vdm5kLnNlZW1haWxcIiwgXHJcbiAgXCJzZWVkXCI6IFwiYXBwbGljYXRpb24vdm5kLmZkc24uc2VlZFwiLCBcclxuICBcInNlbWFcIjogXCJhcHBsaWNhdGlvbi92bmQuc2VtYVwiLCBcclxuICBcInNlbWRcIjogXCJhcHBsaWNhdGlvbi92bmQuc2VtZFwiLCBcclxuICBcInNlbWZcIjogXCJhcHBsaWNhdGlvbi92bmQuc2VtZlwiLCBcclxuICBcInNlclwiOiBcImFwcGxpY2F0aW9uL2phdmEtc2VyaWFsaXplZC1vYmplY3RcIiwgXHJcbiAgXCJzZXRwYXlcIjogXCJhcHBsaWNhdGlvbi9zZXQtcGF5bWVudC1pbml0aWF0aW9uXCIsIFxyXG4gIFwic2V0cmVnXCI6IFwiYXBwbGljYXRpb24vc2V0LXJlZ2lzdHJhdGlvbi1pbml0aWF0aW9uXCIsIFxyXG4gIFwic2ZkLWhkc3R4XCI6IFwiYXBwbGljYXRpb24vdm5kLmh5ZHJvc3RhdGl4LnNvZi1kYXRhXCIsIFxyXG4gIFwic2ZzXCI6IFwiYXBwbGljYXRpb24vdm5kLnNwb3RmaXJlLnNmc1wiLCBcclxuICBcInNmdlwiOiBcInRleHQveC1zZnZcIiwgXHJcbiAgXCJzZ2lcIjogXCJpbWFnZS9zZ2lcIiwgXHJcbiAgXCJzZ2xcIjogXCJhcHBsaWNhdGlvbi92bmQuc3RhcmRpdmlzaW9uLndyaXRlci1nbG9iYWxcIiwgXHJcbiAgXCJzZ21cIjogXCJ0ZXh0L3NnbWxcIiwgXHJcbiAgXCJzZ21sXCI6IFwidGV4dC9zZ21sXCIsIFxyXG4gIFwic2hcIjogXCJhcHBsaWNhdGlvbi94LXNoXCIsIFxyXG4gIFwic2hhclwiOiBcImFwcGxpY2F0aW9uL3gtc2hhclwiLCBcclxuICBcInNoZlwiOiBcImFwcGxpY2F0aW9uL3NoZit4bWxcIiwgXHJcbiAgXCJzaWRcIjogXCJpbWFnZS94LW1yc2lkLWltYWdlXCIsIFxyXG4gIFwic2lnXCI6IFwiYXBwbGljYXRpb24vcGdwLXNpZ25hdHVyZVwiLCBcclxuICBcInNpbFwiOiBcImF1ZGlvL3NpbGtcIiwgXHJcbiAgXCJzaWxvXCI6IFwibW9kZWwvbWVzaFwiLCBcclxuICBcInNpc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5zeW1iaWFuLmluc3RhbGxcIiwgXHJcbiAgXCJzaXN4XCI6IFwiYXBwbGljYXRpb24vdm5kLnN5bWJpYW4uaW5zdGFsbFwiLCBcclxuICBcInNpdFwiOiBcImFwcGxpY2F0aW9uL3gtc3R1ZmZpdFwiLCBcclxuICBcInNpdHhcIjogXCJhcHBsaWNhdGlvbi94LXN0dWZmaXR4XCIsIFxyXG4gIFwic2tkXCI6IFwiYXBwbGljYXRpb24vdm5kLmtvYW5cIiwgXHJcbiAgXCJza21cIjogXCJhcHBsaWNhdGlvbi92bmQua29hblwiLCBcclxuICBcInNrcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5rb2FuXCIsIFxyXG4gIFwic2t0XCI6IFwiYXBwbGljYXRpb24vdm5kLmtvYW5cIiwgXHJcbiAgXCJzbGRtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQuc2xpZGUubWFjcm9lbmFibGVkLjEyXCIsIFxyXG4gIFwic2xkeFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5zbGlkZVwiLCBcclxuICBcInNsdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5zYWx0XCIsIFxyXG4gIFwic21cIjogXCJhcHBsaWNhdGlvbi92bmQuc3RlcG1hbmlhLnN0ZXBjaGFydFwiLCBcclxuICBcInNtZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdGFyZGl2aXNpb24ubWF0aFwiLCBcclxuICBcInNtaVwiOiBcImFwcGxpY2F0aW9uL3NtaWwreG1sXCIsIFxyXG4gIFwic21pbFwiOiBcImFwcGxpY2F0aW9uL3NtaWwreG1sXCIsIFxyXG4gIFwic212XCI6IFwidmlkZW8veC1zbXZcIiwgXHJcbiAgXCJzbXppcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdGVwbWFuaWEucGFja2FnZVwiLCBcclxuICBcInNuZFwiOiBcImF1ZGlvL2Jhc2ljXCIsIFxyXG4gIFwic25mXCI6IFwiYXBwbGljYXRpb24veC1mb250LXNuZlwiLCBcclxuICBcInNvXCI6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIsIFxyXG4gIFwic3BjXCI6IFwiYXBwbGljYXRpb24veC1wa2NzNy1jZXJ0aWZpY2F0ZXNcIiwgXHJcbiAgXCJzcGZcIjogXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtcGhyYXNlXCIsIFxyXG4gIFwic3BsXCI6IFwiYXBwbGljYXRpb24veC1mdXR1cmVzcGxhc2hcIiwgXHJcbiAgXCJzcG90XCI6IFwidGV4dC92bmQuaW4zZC5zcG90XCIsIFxyXG4gIFwic3BwXCI6IFwiYXBwbGljYXRpb24vc2N2cC12cC1yZXNwb25zZVwiLCBcclxuICBcInNwcVwiOiBcImFwcGxpY2F0aW9uL3NjdnAtdnAtcmVxdWVzdFwiLCBcclxuICBcInNweFwiOiBcImF1ZGlvL29nZ1wiLCBcclxuICBcInNxbFwiOiBcImFwcGxpY2F0aW9uL3gtc3FsXCIsIFxyXG4gIFwic3JjXCI6IFwiYXBwbGljYXRpb24veC13YWlzLXNvdXJjZVwiLCBcclxuICBcInNydFwiOiBcImFwcGxpY2F0aW9uL3gtc3VicmlwXCIsIFxyXG4gIFwic3J1XCI6IFwiYXBwbGljYXRpb24vc3J1K3htbFwiLCBcclxuICBcInNyeFwiOiBcImFwcGxpY2F0aW9uL3NwYXJxbC1yZXN1bHRzK3htbFwiLCBcclxuICBcInNzZGxcIjogXCJhcHBsaWNhdGlvbi9zc2RsK3htbFwiLCBcclxuICBcInNzZVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5rb2Rhay1kZXNjcmlwdG9yXCIsIFxyXG4gIFwic3NmXCI6IFwiYXBwbGljYXRpb24vdm5kLmVwc29uLnNzZlwiLCBcclxuICBcInNzbWxcIjogXCJhcHBsaWNhdGlvbi9zc21sK3htbFwiLCBcclxuICBcInN0XCI6IFwiYXBwbGljYXRpb24vdm5kLnNhaWxpbmd0cmFja2VyLnRyYWNrXCIsIFxyXG4gIFwic3RjXCI6IFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwuY2FsYy50ZW1wbGF0ZVwiLCBcclxuICBcInN0ZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmRyYXcudGVtcGxhdGVcIiwgXHJcbiAgXCJzdGZcIjogXCJhcHBsaWNhdGlvbi92bmQud3Quc3RmXCIsIFxyXG4gIFwic3RpXCI6IFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwuaW1wcmVzcy50ZW1wbGF0ZVwiLCBcclxuICBcInN0a1wiOiBcImFwcGxpY2F0aW9uL2h5cGVyc3R1ZGlvXCIsIFxyXG4gIFwic3RsXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLXBraS5zdGxcIiwgXHJcbiAgXCJzdHJcIjogXCJhcHBsaWNhdGlvbi92bmQucGcuZm9ybWF0XCIsIFxyXG4gIFwic3R3XCI6IFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwud3JpdGVyLnRlbXBsYXRlXCIsIFxyXG4gIFwic3ViXCI6IFwidGV4dC92bmQuZHZiLnN1YnRpdGxlXCIsIFxyXG4gIFwic3VzXCI6IFwiYXBwbGljYXRpb24vdm5kLnN1cy1jYWxlbmRhclwiLCBcclxuICBcInN1c3BcIjogXCJhcHBsaWNhdGlvbi92bmQuc3VzLWNhbGVuZGFyXCIsIFxyXG4gIFwic3Y0Y3Bpb1wiOiBcImFwcGxpY2F0aW9uL3gtc3Y0Y3Bpb1wiLCBcclxuICBcInN2NGNyY1wiOiBcImFwcGxpY2F0aW9uL3gtc3Y0Y3JjXCIsIFxyXG4gIFwic3ZjXCI6IFwiYXBwbGljYXRpb24vdm5kLmR2Yi5zZXJ2aWNlXCIsIFxyXG4gIFwic3ZkXCI6IFwiYXBwbGljYXRpb24vdm5kLnN2ZFwiLCBcclxuICBcInN2Z1wiOiBcImltYWdlL3N2Zyt4bWxcIiwgXHJcbiAgXCJzdmd6XCI6IFwiaW1hZ2Uvc3ZnK3htbFwiLCBcclxuICBcInN3YVwiOiBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIiwgXHJcbiAgXCJzd2ZcIjogXCJhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaFwiLCBcclxuICBcInN3aVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5hcmlzdGFuZXR3b3Jrcy5zd2lcIiwgXHJcbiAgXCJzeGNcIjogXCJhcHBsaWNhdGlvbi92bmQuc3VuLnhtbC5jYWxjXCIsIFxyXG4gIFwic3hkXCI6IFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwuZHJhd1wiLCBcclxuICBcInN4Z1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlci5nbG9iYWxcIiwgXHJcbiAgXCJzeGlcIjogXCJhcHBsaWNhdGlvbi92bmQuc3VuLnhtbC5pbXByZXNzXCIsIFxyXG4gIFwic3htXCI6IFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwubWF0aFwiLCBcclxuICBcInN4d1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlclwiLCBcclxuICBcInRcIjogXCJ0ZXh0L3Ryb2ZmXCIsIFxyXG4gIFwidDNcIjogXCJhcHBsaWNhdGlvbi94LXQzdm0taW1hZ2VcIiwgXHJcbiAgXCJ0YWdsZXRcIjogXCJhcHBsaWNhdGlvbi92bmQubXluZmNcIiwgXHJcbiAgXCJ0YW9cIjogXCJhcHBsaWNhdGlvbi92bmQudGFvLmludGVudC1tb2R1bGUtYXJjaGl2ZVwiLCBcclxuICBcInRhclwiOiBcImFwcGxpY2F0aW9uL3gtdGFyXCIsIFxyXG4gIFwidGNhcFwiOiBcImFwcGxpY2F0aW9uL3ZuZC4zZ3BwMi50Y2FwXCIsIFxyXG4gIFwidGNsXCI6IFwiYXBwbGljYXRpb24veC10Y2xcIiwgXHJcbiAgXCJ0ZWFjaGVyXCI6IFwiYXBwbGljYXRpb24vdm5kLnNtYXJ0LnRlYWNoZXJcIiwgXHJcbiAgXCJ0ZWlcIjogXCJhcHBsaWNhdGlvbi90ZWkreG1sXCIsIFxyXG4gIFwidGVpY29ycHVzXCI6IFwiYXBwbGljYXRpb24vdGVpK3htbFwiLCBcclxuICBcInRleFwiOiBcImFwcGxpY2F0aW9uL3gtdGV4XCIsIFxyXG4gIFwidGV4aVwiOiBcImFwcGxpY2F0aW9uL3gtdGV4aW5mb1wiLCBcclxuICBcInRleGluZm9cIjogXCJhcHBsaWNhdGlvbi94LXRleGluZm9cIiwgXHJcbiAgXCJ0ZXh0XCI6IFwidGV4dC9wbGFpblwiLCBcclxuICBcInRmaVwiOiBcImFwcGxpY2F0aW9uL3RocmF1ZCt4bWxcIiwgXHJcbiAgXCJ0Zm1cIjogXCJhcHBsaWNhdGlvbi94LXRleC10Zm1cIiwgXHJcbiAgXCJ0Z2FcIjogXCJpbWFnZS94LXRnYVwiLCBcclxuICBcInRobXhcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtb2ZmaWNldGhlbWVcIiwgXHJcbiAgXCJ0aWZcIjogXCJpbWFnZS90aWZmXCIsIFxyXG4gIFwidGlmZlwiOiBcImltYWdlL3RpZmZcIiwgXHJcbiAgXCJ0bW9cIjogXCJhcHBsaWNhdGlvbi92bmQudG1vYmlsZS1saXZldHZcIiwgXHJcbiAgXCJ0b3JyZW50XCI6IFwiYXBwbGljYXRpb24veC1iaXR0b3JyZW50XCIsIFxyXG4gIFwidHBsXCI6IFwiYXBwbGljYXRpb24vdm5kLmdyb292ZS10b29sLXRlbXBsYXRlXCIsIFxyXG4gIFwidHB0XCI6IFwiYXBwbGljYXRpb24vdm5kLnRyaWQudHB0XCIsIFxyXG4gIFwidHJcIjogXCJ0ZXh0L3Ryb2ZmXCIsIFxyXG4gIFwidHJhXCI6IFwiYXBwbGljYXRpb24vdm5kLnRydWVhcHBcIiwgXHJcbiAgXCJ0cm1cIjogXCJhcHBsaWNhdGlvbi94LW1zdGVybWluYWxcIiwgXHJcbiAgXCJ0c2RcIjogXCJhcHBsaWNhdGlvbi90aW1lc3RhbXBlZC1kYXRhXCIsIFxyXG4gIFwidHN2XCI6IFwidGV4dC90YWItc2VwYXJhdGVkLXZhbHVlc1wiLCBcclxuICBcInR0Y1wiOiBcImFwcGxpY2F0aW9uL3gtZm9udC10dGZcIiwgXHJcbiAgXCJ0dGZcIjogXCJhcHBsaWNhdGlvbi94LWZvbnQtdHRmXCIsIFxyXG4gIFwidHRsXCI6IFwidGV4dC90dXJ0bGVcIiwgXHJcbiAgXCJ0d2RcIjogXCJhcHBsaWNhdGlvbi92bmQuc2ltdGVjaC1taW5kbWFwcGVyXCIsIFxyXG4gIFwidHdkc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5zaW10ZWNoLW1pbmRtYXBwZXJcIiwgXHJcbiAgXCJ0eGRcIjogXCJhcHBsaWNhdGlvbi92bmQuZ2Vub21hdGl4LnR1eGVkb1wiLCBcclxuICBcInR4ZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMudHhmXCIsIFxyXG4gIFwidHh0XCI6IFwidGV4dC9wbGFpblwiLCBcclxuICBcInUzMlwiOiBcImFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1iaW5cIiwgXHJcbiAgXCJ1ZGViXCI6IFwiYXBwbGljYXRpb24veC1kZWJpYW4tcGFja2FnZVwiLCBcclxuICBcInVmZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC51ZmRsXCIsIFxyXG4gIFwidWZkbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC51ZmRsXCIsIFxyXG4gIFwidWx4XCI6IFwiYXBwbGljYXRpb24veC1nbHVseFwiLCBcclxuICBcInVtalwiOiBcImFwcGxpY2F0aW9uL3ZuZC51bWFqaW5cIiwgXHJcbiAgXCJ1bml0eXdlYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC51bml0eVwiLCBcclxuICBcInVvbWxcIjogXCJhcHBsaWNhdGlvbi92bmQudW9tbCt4bWxcIiwgXHJcbiAgXCJ1cmlcIjogXCJ0ZXh0L3VyaS1saXN0XCIsIFxyXG4gIFwidXJpc1wiOiBcInRleHQvdXJpLWxpc3RcIiwgXHJcbiAgXCJ1cmxzXCI6IFwidGV4dC91cmktbGlzdFwiLCBcclxuICBcInVzdGFyXCI6IFwiYXBwbGljYXRpb24veC11c3RhclwiLCBcclxuICBcInV0elwiOiBcImFwcGxpY2F0aW9uL3ZuZC51aXEudGhlbWVcIiwgXHJcbiAgXCJ1dVwiOiBcInRleHQveC11dWVuY29kZVwiLCBcclxuICBcInV2YVwiOiBcImF1ZGlvL3ZuZC5kZWNlLmF1ZGlvXCIsIFxyXG4gIFwidXZkXCI6IFwiYXBwbGljYXRpb24vdm5kLmRlY2UuZGF0YVwiLCBcclxuICBcInV2ZlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLmRhdGFcIiwgXHJcbiAgXCJ1dmdcIjogXCJpbWFnZS92bmQuZGVjZS5ncmFwaGljXCIsIFxyXG4gIFwidXZoXCI6IFwidmlkZW8vdm5kLmRlY2UuaGRcIiwgXHJcbiAgXCJ1dmlcIjogXCJpbWFnZS92bmQuZGVjZS5ncmFwaGljXCIsIFxyXG4gIFwidXZtXCI6IFwidmlkZW8vdm5kLmRlY2UubW9iaWxlXCIsIFxyXG4gIFwidXZwXCI6IFwidmlkZW8vdm5kLmRlY2UucGRcIiwgXHJcbiAgXCJ1dnNcIjogXCJ2aWRlby92bmQuZGVjZS5zZFwiLCBcclxuICBcInV2dFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLnR0bWwreG1sXCIsIFxyXG4gIFwidXZ1XCI6IFwidmlkZW8vdm5kLnV2dnUubXA0XCIsIFxyXG4gIFwidXZ2XCI6IFwidmlkZW8vdm5kLmRlY2UudmlkZW9cIiwgXHJcbiAgXCJ1dnZhXCI6IFwiYXVkaW8vdm5kLmRlY2UuYXVkaW9cIiwgXHJcbiAgXCJ1dnZkXCI6IFwiYXBwbGljYXRpb24vdm5kLmRlY2UuZGF0YVwiLCBcclxuICBcInV2dmZcIjogXCJhcHBsaWNhdGlvbi92bmQuZGVjZS5kYXRhXCIsIFxyXG4gIFwidXZ2Z1wiOiBcImltYWdlL3ZuZC5kZWNlLmdyYXBoaWNcIiwgXHJcbiAgXCJ1dnZoXCI6IFwidmlkZW8vdm5kLmRlY2UuaGRcIiwgXHJcbiAgXCJ1dnZpXCI6IFwiaW1hZ2Uvdm5kLmRlY2UuZ3JhcGhpY1wiLCBcclxuICBcInV2dm1cIjogXCJ2aWRlby92bmQuZGVjZS5tb2JpbGVcIiwgXHJcbiAgXCJ1dnZwXCI6IFwidmlkZW8vdm5kLmRlY2UucGRcIiwgXHJcbiAgXCJ1dnZzXCI6IFwidmlkZW8vdm5kLmRlY2Uuc2RcIiwgXHJcbiAgXCJ1dnZ0XCI6IFwiYXBwbGljYXRpb24vdm5kLmRlY2UudHRtbCt4bWxcIiwgXHJcbiAgXCJ1dnZ1XCI6IFwidmlkZW8vdm5kLnV2dnUubXA0XCIsIFxyXG4gIFwidXZ2dlwiOiBcInZpZGVvL3ZuZC5kZWNlLnZpZGVvXCIsIFxyXG4gIFwidXZ2eFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLnVuc3BlY2lmaWVkXCIsIFxyXG4gIFwidXZ2elwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLnppcFwiLCBcclxuICBcInV2eFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLnVuc3BlY2lmaWVkXCIsIFxyXG4gIFwidXZ6XCI6IFwiYXBwbGljYXRpb24vdm5kLmRlY2UuemlwXCIsIFxyXG4gIFwidmNhcmRcIjogXCJ0ZXh0L3ZjYXJkXCIsIFxyXG4gIFwidmNkXCI6IFwiYXBwbGljYXRpb24veC1jZGxpbmtcIiwgXHJcbiAgXCJ2Y2ZcIjogXCJ0ZXh0L3gtdmNhcmRcIiwgXHJcbiAgXCJ2Y2dcIjogXCJhcHBsaWNhdGlvbi92bmQuZ3Jvb3ZlLXZjYXJkXCIsIFxyXG4gIFwidmNzXCI6IFwidGV4dC94LXZjYWxlbmRhclwiLCBcclxuICBcInZjeFwiOiBcImFwcGxpY2F0aW9uL3ZuZC52Y3hcIiwgXHJcbiAgXCJ2aXNcIjogXCJhcHBsaWNhdGlvbi92bmQudmlzaW9uYXJ5XCIsIFxyXG4gIFwidml2XCI6IFwidmlkZW8vdm5kLnZpdm9cIiwgXHJcbiAgXCJ2b2JcIjogXCJ2aWRlby94LW1zLXZvYlwiLCBcclxuICBcInZvclwiOiBcImFwcGxpY2F0aW9uL3ZuZC5zdGFyZGl2aXNpb24ud3JpdGVyXCIsIFxyXG4gIFwidm94XCI6IFwiYXBwbGljYXRpb24veC1hdXRob3J3YXJlLWJpblwiLCBcclxuICBcInZybWxcIjogXCJtb2RlbC92cm1sXCIsIFxyXG4gIFwidnNkXCI6IFwiYXBwbGljYXRpb24vdm5kLnZpc2lvXCIsIFxyXG4gIFwidnNmXCI6IFwiYXBwbGljYXRpb24vdm5kLnZzZlwiLCBcclxuICBcInZzc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC52aXNpb1wiLCBcclxuICBcInZzdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC52aXNpb1wiLCBcclxuICBcInZzd1wiOiBcImFwcGxpY2F0aW9uL3ZuZC52aXNpb1wiLCBcclxuICBcInZ0dVwiOiBcIm1vZGVsL3ZuZC52dHVcIixcclxuICBcInZ0dFwiOiBcInRleHQvdnR0XCIsXHJcbiAgXCJ2eG1sXCI6IFwiYXBwbGljYXRpb24vdm9pY2V4bWwreG1sXCIsIFxyXG4gIFwidzNkXCI6IFwiYXBwbGljYXRpb24veC1kaXJlY3RvclwiLCBcclxuICBcIndhZFwiOiBcImFwcGxpY2F0aW9uL3gtZG9vbVwiLCBcclxuICBcIndhdlwiOiBcImF1ZGlvL3gtd2F2XCIsIFxyXG4gIFwid2F4XCI6IFwiYXVkaW8veC1tcy13YXhcIiwgXHJcbiAgXCJ3Ym1wXCI6IFwiaW1hZ2Uvdm5kLndhcC53Ym1wXCIsIFxyXG4gIFwid2JzXCI6IFwiYXBwbGljYXRpb24vdm5kLmNyaXRpY2FsdG9vbHMud2JzK3htbFwiLCBcclxuICBcIndieG1sXCI6IFwiYXBwbGljYXRpb24vdm5kLndhcC53YnhtbFwiLCBcclxuICBcIndjbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy13b3Jrc1wiLCBcclxuICBcIndkYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy13b3Jrc1wiLCBcclxuICBcIndkcFwiOiBcImltYWdlL3ZuZC5tcy1waG90b1wiLCBcclxuICBcIndlYmFcIjogXCJhdWRpby93ZWJtXCIsIFxyXG4gIFwid2VibVwiOiBcInZpZGVvL3dlYm1cIiwgXHJcbiAgXCJ3ZWJwXCI6IFwiaW1hZ2Uvd2VicFwiLCBcclxuICBcIndnXCI6IFwiYXBwbGljYXRpb24vdm5kLnBtaS53aWRnZXRcIiwgXHJcbiAgXCJ3Z3RcIjogXCJhcHBsaWNhdGlvbi93aWRnZXRcIiwgXHJcbiAgXCJ3a3NcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtd29ya3NcIiwgXHJcbiAgXCJ3bVwiOiBcInZpZGVvL3gtbXMtd21cIiwgXHJcbiAgXCJ3bWFcIjogXCJhdWRpby94LW1zLXdtYVwiLCBcclxuICBcIndtZFwiOiBcImFwcGxpY2F0aW9uL3gtbXMtd21kXCIsIFxyXG4gIFwid21mXCI6IFwiYXBwbGljYXRpb24veC1tc21ldGFmaWxlXCIsIFxyXG4gIFwid21sXCI6IFwidGV4dC92bmQud2FwLndtbFwiLCBcclxuICBcIndtbGNcIjogXCJhcHBsaWNhdGlvbi92bmQud2FwLndtbGNcIiwgXHJcbiAgXCJ3bWxzXCI6IFwidGV4dC92bmQud2FwLndtbHNjcmlwdFwiLCBcclxuICBcIndtbHNjXCI6IFwiYXBwbGljYXRpb24vdm5kLndhcC53bWxzY3JpcHRjXCIsIFxyXG4gIFwid212XCI6IFwidmlkZW8veC1tcy13bXZcIiwgXHJcbiAgXCJ3bXhcIjogXCJ2aWRlby94LW1zLXdteFwiLCBcclxuICBcIndtelwiOiBcImFwcGxpY2F0aW9uL3gtbXNtZXRhZmlsZVwiLCBcclxuICBcIndvZmZcIjogXCJhcHBsaWNhdGlvbi94LWZvbnQtd29mZlwiLCBcclxuICBcIndwZFwiOiBcImFwcGxpY2F0aW9uL3ZuZC53b3JkcGVyZmVjdFwiLCBcclxuICBcIndwbFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy13cGxcIiwgXHJcbiAgXCJ3cHNcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtd29ya3NcIiwgXHJcbiAgXCJ3cWRcIjogXCJhcHBsaWNhdGlvbi92bmQud3FkXCIsIFxyXG4gIFwid3JpXCI6IFwiYXBwbGljYXRpb24veC1tc3dyaXRlXCIsIFxyXG4gIFwid3JsXCI6IFwibW9kZWwvdnJtbFwiLCBcclxuICBcIndzZGxcIjogXCJhcHBsaWNhdGlvbi93c2RsK3htbFwiLCBcclxuICBcIndzcG9saWN5XCI6IFwiYXBwbGljYXRpb24vd3Nwb2xpY3kreG1sXCIsIFxyXG4gIFwid3RiXCI6IFwiYXBwbGljYXRpb24vdm5kLndlYnR1cmJvXCIsIFxyXG4gIFwid3Z4XCI6IFwidmlkZW8veC1tcy13dnhcIiwgXHJcbiAgXCJ4MzJcIjogXCJhcHBsaWNhdGlvbi94LWF1dGhvcndhcmUtYmluXCIsIFxyXG4gIFwieDNkXCI6IFwibW9kZWwveDNkK3htbFwiLCBcclxuICBcIngzZGJcIjogXCJtb2RlbC94M2QrYmluYXJ5XCIsIFxyXG4gIFwieDNkYnpcIjogXCJtb2RlbC94M2QrYmluYXJ5XCIsIFxyXG4gIFwieDNkdlwiOiBcIm1vZGVsL3gzZCt2cm1sXCIsIFxyXG4gIFwieDNkdnpcIjogXCJtb2RlbC94M2QrdnJtbFwiLCBcclxuICBcIngzZHpcIjogXCJtb2RlbC94M2QreG1sXCIsIFxyXG4gIFwieGFtbFwiOiBcImFwcGxpY2F0aW9uL3hhbWwreG1sXCIsIFxyXG4gIFwieGFwXCI6IFwiYXBwbGljYXRpb24veC1zaWx2ZXJsaWdodC1hcHBcIiwgXHJcbiAgXCJ4YXJcIjogXCJhcHBsaWNhdGlvbi92bmQueGFyYVwiLCBcclxuICBcInhiYXBcIjogXCJhcHBsaWNhdGlvbi94LW1zLXhiYXBcIiwgXHJcbiAgXCJ4YmRcIjogXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmRvY3V3b3Jrcy5iaW5kZXJcIiwgXHJcbiAgXCJ4Ym1cIjogXCJpbWFnZS94LXhiaXRtYXBcIiwgXHJcbiAgXCJ4ZGZcIjogXCJhcHBsaWNhdGlvbi94Y2FwLWRpZmYreG1sXCIsIFxyXG4gIFwieGRtXCI6IFwiYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kbSt4bWxcIiwgXHJcbiAgXCJ4ZHBcIjogXCJhcHBsaWNhdGlvbi92bmQuYWRvYmUueGRwK3htbFwiLCBcclxuICBcInhkc3NjXCI6IFwiYXBwbGljYXRpb24vZHNzYyt4bWxcIiwgXHJcbiAgXCJ4ZHdcIjogXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmRvY3V3b3Jrc1wiLCBcclxuICBcInhlbmNcIjogXCJhcHBsaWNhdGlvbi94ZW5jK3htbFwiLCBcclxuICBcInhlclwiOiBcImFwcGxpY2F0aW9uL3BhdGNoLW9wcy1lcnJvcit4bWxcIiwgXHJcbiAgXCJ4ZmRmXCI6IFwiYXBwbGljYXRpb24vdm5kLmFkb2JlLnhmZGZcIiwgXHJcbiAgXCJ4ZmRsXCI6IFwiYXBwbGljYXRpb24vdm5kLnhmZGxcIiwgXHJcbiAgXCJ4aHRcIjogXCJhcHBsaWNhdGlvbi94aHRtbCt4bWxcIiwgXHJcbiAgXCJ4aHRtbFwiOiBcImFwcGxpY2F0aW9uL3hodG1sK3htbFwiLCBcclxuICBcInhodm1sXCI6IFwiYXBwbGljYXRpb24veHYreG1sXCIsIFxyXG4gIFwieGlmXCI6IFwiaW1hZ2Uvdm5kLnhpZmZcIiwgXHJcbiAgXCJ4bGFcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtZXhjZWxcIiwgXHJcbiAgXCJ4bGFtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLmFkZGluLm1hY3JvZW5hYmxlZC4xMlwiLCBcclxuICBcInhsY1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbFwiLCBcclxuICBcInhsZlwiOiBcImFwcGxpY2F0aW9uL3gteGxpZmYreG1sXCIsIFxyXG4gIFwieGxtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsXCIsIFxyXG4gIFwieGxzXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsXCIsIFxyXG4gIFwieGxzYlwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC5zaGVldC5iaW5hcnkubWFjcm9lbmFibGVkLjEyXCIsIFxyXG4gIFwieGxzbVwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC5zaGVldC5tYWNyb2VuYWJsZWQuMTJcIiwgXHJcbiAgXCJ4bHN4XCI6IFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXRcIiwgXHJcbiAgXCJ4bHRcIjogXCJhcHBsaWNhdGlvbi92bmQubXMtZXhjZWxcIiwgXHJcbiAgXCJ4bHRtXCI6IFwiYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLnRlbXBsYXRlLm1hY3JvZW5hYmxlZC4xMlwiLCBcclxuICBcInhsdHhcIjogXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC50ZW1wbGF0ZVwiLCBcclxuICBcInhsd1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbFwiLCBcclxuICBcInhtXCI6IFwiYXVkaW8veG1cIiwgXHJcbiAgXCJ4bWxcIjogXCJhcHBsaWNhdGlvbi94bWxcIiwgXHJcbiAgXCJ4b1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5vbHBjLXN1Z2FyXCIsIFxyXG4gIFwieG9wXCI6IFwiYXBwbGljYXRpb24veG9wK3htbFwiLCBcclxuICBcInhwaVwiOiBcImFwcGxpY2F0aW9uL3gteHBpbnN0YWxsXCIsIFxyXG4gIFwieHBsXCI6IFwiYXBwbGljYXRpb24veHByb2MreG1sXCIsIFxyXG4gIFwieHBtXCI6IFwiaW1hZ2UveC14cGl4bWFwXCIsIFxyXG4gIFwieHByXCI6IFwiYXBwbGljYXRpb24vdm5kLmlzLXhwclwiLCBcclxuICBcInhwc1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5tcy14cHNkb2N1bWVudFwiLCBcclxuICBcInhwd1wiOiBcImFwcGxpY2F0aW9uL3ZuZC5pbnRlcmNvbi5mb3JtbmV0XCIsIFxyXG4gIFwieHB4XCI6IFwiYXBwbGljYXRpb24vdm5kLmludGVyY29uLmZvcm1uZXRcIiwgXHJcbiAgXCJ4c2xcIjogXCJhcHBsaWNhdGlvbi94bWxcIiwgXHJcbiAgXCJ4c2x0XCI6IFwiYXBwbGljYXRpb24veHNsdCt4bWxcIiwgXHJcbiAgXCJ4c21cIjogXCJhcHBsaWNhdGlvbi92bmQuc3luY21sK3htbFwiLCBcclxuICBcInhzcGZcIjogXCJhcHBsaWNhdGlvbi94c3BmK3htbFwiLCBcclxuICBcInh1bFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5tb3ppbGxhLnh1bCt4bWxcIiwgXHJcbiAgXCJ4dm1cIjogXCJhcHBsaWNhdGlvbi94dit4bWxcIiwgXHJcbiAgXCJ4dm1sXCI6IFwiYXBwbGljYXRpb24veHYreG1sXCIsIFxyXG4gIFwieHdkXCI6IFwiaW1hZ2UveC14d2luZG93ZHVtcFwiLCBcclxuICBcInh5elwiOiBcImNoZW1pY2FsL3gteHl6XCIsIFxyXG4gIFwieHpcIjogXCJhcHBsaWNhdGlvbi94LXh6XCIsIFxyXG4gIFwieWFuZ1wiOiBcImFwcGxpY2F0aW9uL3lhbmdcIiwgXHJcbiAgXCJ5aW5cIjogXCJhcHBsaWNhdGlvbi95aW4reG1sXCIsIFxyXG4gIFwiejFcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejJcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejNcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejRcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejVcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejZcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejdcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiejhcIjogXCJhcHBsaWNhdGlvbi94LXptYWNoaW5lXCIsIFxyXG4gIFwiemF6XCI6IFwiYXBwbGljYXRpb24vdm5kLnp6YXp6LmRlY2sreG1sXCIsIFxyXG4gIFwiemlwXCI6IFwiYXBwbGljYXRpb24vemlwXCIsIFxyXG4gIFwiemlyXCI6IFwiYXBwbGljYXRpb24vdm5kLnp1bFwiLCBcclxuICBcInppcnpcIjogXCJhcHBsaWNhdGlvbi92bmQuenVsXCIsIFxyXG4gIFwiem1tXCI6IFwiYXBwbGljYXRpb24vdm5kLmhhbmRoZWxkLWVudGVydGFpbm1lbnQreG1sXCJcclxufTtcclxudmFyIE1JTUVDQVRFR09SSUVTID0geyd2aWRlbyc6W10sJ2F1ZGlvJzpbXX1cclxuZm9yICh2YXIga2V5IGluIE1JTUVUWVBFUykge1xyXG4gICAgaWYgKE1JTUVUWVBFU1trZXldLnN0YXJ0c1dpdGgoJ3ZpZGVvLycpKSB7XHJcbiAgICAgICAgTUlNRUNBVEVHT1JJRVNbJ3ZpZGVvJ10ucHVzaCgga2V5IClcclxuICAgIH0gZWxzZSBpZiAoTUlNRVRZUEVTW2tleV0uc3RhcnRzV2l0aCgnYXVkaW8vJykpIHtcclxuICAgICAgICBNSU1FQ0FURUdPUklFU1snYXVkaW8nXS5wdXNoKCBrZXkgKVxyXG4gICAgfVxyXG59XHJcbldTQy5NSU1FQ0FURUdPUklFUyA9IE1JTUVDQVRFR09SSUVTXHJcbldTQy5NSU1FVFlQRVMgPSBNSU1FVFlQRVNcclxufSkoKTtcclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi93c2MtY2hyb21lL3dlYi1zZXJ2ZXItY2hyb21lL21pbWUudHNcbi8vIG1vZHVsZSBpZCA9IDEyXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIG11bHRpcGxlIGRldmljZXMgYXJlIHVzaW5nIHRoZSBzYW1lIGV4dGVuYWwgcG9ydC4gbmVlZCB0byByZXRyeSBmb3Igb3RoZXIgcG9ydHMsIG9yIHJhbmRvbWl6ZSBjaG9zZW4gcG9ydCBiYXNlZCBvbiBHVUlEIHdvdWxkIGJlIGVhc2llc3QuXHJcblxyXG4vLyBpZiBzd2l0Y2hpbmcgZnJvbSB3bGFuIHRvIGV0aCwgaXQgd2lsbCBmYWlsIHRvIG1hcCB0aGUgcG9ydCBiZWNhdXNlIHdlIG1hcHBlZCBvbiB0aGUgb3RoZXIgaW50ZXJmYWNlLlxyXG5cclxuLy8gY2hlY2sgY3VycmVudCBtYXBwaW5ncyBhbmQgZG9uJ3QgYXR0ZW1wdCB0byBtYXAgdG8gYW4gZXh0ZXJuYWxseSBib3VuZCBwb3J0XHJcblxyXG4vLyBjb3VsZCBjaG9vc2UgcG9ydCBieSBoYXNoaW5nIEdVSUQgKyBpbnRlcmZhY2UgbmFtZVxyXG5cclxuLy8gaW5zcGlyYXRpb24gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ub2RlLW5hdC11cG5wXHJcbihmdW5jdGlvbigpIHtcclxuICAgIGZ1bmN0aW9uIGZsYXRQYXJzZU5vZGUobm9kZSkge1xyXG4gICAgICAgIHZhciBkID0ge31cclxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8bm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IG5vZGUuY2hpbGRyZW5baV1cclxuICAgICAgICAgICAgaWYgKGMuY2hpbGRyZW4ubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIGRbYy50YWdOYW1lXSA9IGMuaW5uZXJIVE1MXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRcclxuICAgIH1cclxuICAgIFxyXG4gICAgZnVuY3Rpb24gVVBOUChvcHRzKSB7XHJcbiAgICAgICAgdGhpcy5wb3J0ID0gb3B0cy5wb3J0XHJcblx0XHR0aGlzLm5hbWUgPSBvcHRzLm5hbWUgfHwgJ3dlYi1zZXJ2ZXItY2hyb21lIHVwbnAuanMnXHJcblx0XHR0aGlzLnNlYXJjaHRpbWUgPSBvcHRzLnNlYXJjaHRpbWUgfHwgMjAwMFxyXG4gICAgICAgIHRoaXMuc3NkcCA9IG5ldyBTU0RQKHtwb3J0Om9wdHMucG9ydCwgc2VhcmNodGltZTp0aGlzLnNlYXJjaHRpbWV9KVxyXG4gICAgICAgIHRoaXMuZGVzaXJlZFNlcnZpY2VzID0gW1xyXG4gICAgICAgICAgICAndXJuOnNjaGVtYXMtdXBucC1vcmc6c2VydmljZTpXQU5JUENvbm5lY3Rpb246MScsXHJcbiAgICAgICAgICAgICd1cm46c2NoZW1hcy11cG5wLW9yZzpzZXJ2aWNlOldBTlBQUENvbm5lY3Rpb246MSdcclxuICAgICAgICBdXHJcbiAgICAgICAgdGhpcy52YWxpZEdhdGV3YXkgPSBudWxsXHJcbiAgICAgICAgdGhpcy5pbnRlcmZhY2VzID0gbnVsbFxyXG4gICAgICAgIHRoaXMubWFwcGluZyA9IG51bGxcclxuICAgICAgICB0aGlzLnNlYXJjaGluZyA9IGZhbHNlXHJcbiAgICB9XHJcbiAgICBVUE5QLnByb3RvdHlwZSA9IHtcclxuICAgICAgICBhbGxEb25lOiBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2spIHsgdGhpcy5jYWxsYmFjayhyZXN1bHQpIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldEludGVybmFsQWRkcmVzczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBnYXRld2F5aG9zdCA9IHRoaXMudmFsaWRHYXRld2F5LmRldmljZS51cmwuaG9zdG5hbWVcclxuICAgICAgICAgICAgdmFyIGdhdGVwYXJ0cyA9IGdhdGV3YXlob3N0LnNwbGl0KCcuJylcclxuICAgICAgICAgICAgdmFyIG1hdGNoID0gZmFsc2VcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGk9Z2F0ZXBhcnRzLmxlbmd0aC0xO2ktLTtpPDEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcmUgPSBnYXRlcGFydHMuc2xpY2UoMCwgaSkuam9pbignLicpXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8dGhpcy5pbnRlcmZhY2VzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJmYWNlc1tqXS5wcmVmaXhMZW5ndGggPT0gMjQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlwYXJ0cyA9IHRoaXMuaW50ZXJmYWNlc1tqXS5hZGRyZXNzLnNwbGl0KCcuJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlwcmUgPSBpcGFydHMuc2xpY2UoMCxpKS5qb2luKCcuJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlwcmUgPT0gcHJlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHRoaXMuaW50ZXJmYWNlc1tqXS5hZGRyZXNzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmNsb2coXCJVUE5QXCIsXCJzZWxlY3RlZCBpbnRlcm5hbCBhZGRyZXNzXCIsbWF0Y2gpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2tcclxuICAgICAgICAgICAgY29uc29sZS5jbG9nKCdVUE5QJywgXCJzZWFyY2ggc3RhcnRcIilcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hpbmcgPSB0cnVlXHJcbiAgICAgICAgICAgIGNocm9tZS5zeXN0ZW0ubmV0d29yay5nZXROZXR3b3JrSW50ZXJmYWNlcyggZnVuY3Rpb24oaW50ZXJmYWNlcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcmZhY2VzID0gaW50ZXJmYWNlc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXZpY2VzID0gW11cclxuXHRcdFx0XHQvLyBUT0RPIC0tIHJlbW92ZSBldmVudCBsaXN0ZW5lcnNcclxuICAgICAgICAgICAgICAgIHRoaXMuc3NkcC5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2UnLHRoaXMub25EZXZpY2UuYmluZCh0aGlzKSlcclxuICAgICAgICAgICAgICAgIHRoaXMuc3NkcC5hZGRFdmVudExpc3RlbmVyKCdzdG9wJyx0aGlzLm9uU2VhcmNoU3RvcC5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zc2RwLnNlYXJjaCgpIC8vIHN0b3Agc2VhcmNoaW5nIGFmdGVyIGEgYml0LlxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykgKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25TZWFyY2hTdG9wOiBmdW5jdGlvbihpbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuY2xvZygnVVBOUCcsIFwic2VhcmNoIHN0b3BcIilcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hpbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLmdldElQKCBmdW5jdGlvbihnb3RJUCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEgZ290SVApIHsgcmV0dXJuIHRoaXMuYWxsRG9uZShmYWxzZSkgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRNYXBwaW5ncyggZnVuY3Rpb24obWFwcGluZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISBtYXBwaW5ncykgeyByZXR1cm4gdGhpcy5hbGxEb25lKGZhbHNlKSB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxyZWFkeSBleGlzdHMgbmljZSBtYXBwaW5nIHdlIGNhbiB1c2UuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGludGVybmFsID0gdGhpcy5nZXRJbnRlcm5hbEFkZHJlc3MoKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuY2xvZygnVVBOUCcsJ2dvdCBjdXJyZW50IG1hcHBpbmdzJyxtYXBwaW5ncywnaW50ZXJuYWwgYWRkcmVzcycsaW50ZXJuYWwpXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPG1hcHBpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXBwaW5nc1tpXS5OZXdJbnRlcm5hbENsaWVudCA9PSBpbnRlcm5hbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwcGluZ3NbaV0uTmV3SW50ZXJuYWxQb3J0ID09IHRoaXMucG9ydCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwcGluZ3NbaV0uTmV3UHJvdG9jb2wgPT0gXCJUQ1BcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm91bmQgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuY2xvZygnVVBOUCcsJ2FscmVhZHkgaGF2ZSBwb3J0IG1hcHBlZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcHBpbmcgPSBtYXBwaW5nc1tpXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxEb25lKHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE1hcHBpbmcodGhpcy5wb3J0LCAnVENQJywgZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuY2xvZygnVVBOUCcsICdhZGQgVENQIG1hcHBpbmcgcmVzdWx0JyxyZXN1bHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLndhbnRVRFApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTWFwcGluZyh0aGlzLnBvcnQsICdVRFAnLCBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmNsb2coJ1VQTlAnLCAnYWRkIFVEUCBtYXBwaW5nIHJlc3VsdCcscmVzdWx0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsRG9uZShyZXN1bHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxEb25lKHJlc3VsdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25EZXZpY2U6IGZ1bmN0aW9uKGluZm8pIHtcclxuICAgICAgICAgICAgY29uc29sZS5jbG9nKCdVUE5QJywgJ2ZvdW5kIGFuIGludGVybmV0IGdhdGV3YXkgZGV2aWNlJyxpbmZvKVxyXG4gICAgICAgICAgICB2YXIgZGV2aWNlID0gbmV3IEdhdGV3YXlEZXZpY2UoaW5mbylcclxuICAgICAgICAgICAgZGV2aWNlLmdldERlc2NyaXB0aW9uKCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKCBkZXZpY2UgKVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykgKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0V0FOU2VydmljZUluZm86IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgaW5mb3MgPSBbXVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5kZXZpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VydmljZXMgPSB0aGlzLmRldmljZXNbaV0uZ2V0U2VydmljZSh0aGlzLmRlc2lyZWRTZXJ2aWNlcylcclxuICAgICAgICAgICAgICAgIGlmIChzZXJ2aWNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaj0wOyBqPHNlcnZpY2VzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm9zLnB1c2goIHtzZXJ2aWNlOnNlcnZpY2VzW2pdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlOnRoaXMuZGV2aWNlc1tpXX0gKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmb3VuZCBXQU4gc2VydmljZXMnLGluZm9zKVxyXG4gICAgICAgICAgICByZXR1cm4gaW5mb3NcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFkZE1hcHBpbmc6IGZ1bmN0aW9uKHBvcnQsIHByb3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlTWFwcGluZyhwb3J0LCBwcm90LCAxLCBjYWxsYmFjaylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZU1hcHBpbmc6IGZ1bmN0aW9uKHBvcnQsIHByb3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlTWFwcGluZyhwb3J0LCBwcm90LCAwLCBjYWxsYmFjaylcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNoYW5nZU1hcHBpbmc6IGZ1bmN0aW9uKHBvcnQsIHByb3QsIGVuYWJsZWQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICghIHRoaXMudmFsaWRHYXRld2F5KSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBvbnJlc3VsdChldnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0LnRhcmdldC5jb2RlID09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IGV2dC50YXJnZXQucmVzcG9uc2VYTUwuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoZW5hYmxlZD8nQWRkUG9ydE1hcHBpbmdSZXNwb25zZSc6J0RlbGV0ZVBvcnRNYXBwaW5nUmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmxhdFBhcnNlTm9kZShyZXNwKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHtlcnJvcjondW5rbm93bicsZXZ0OmV2dH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYXliZSBwYXJzZSBvdXQgdGhlIGVycm9yIGFsbCBuaWNlP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh7ZXJyb3I6ZXZ0LnRhcmdldC5jb2RlLGV2dDpldnR9KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBleHRlcm5hbFBvcnQgPSBwb3J0XHJcblx0XHRcdFx0aWYgKGVuYWJsZWQpIHtcclxuXHRcdFx0XHRcdHZhciBhcmdzID0gW1xyXG5cdFx0XHRcdFx0XHRbJ05ld0VuYWJsZWQnLGVuYWJsZWRdLFxyXG5cdFx0XHRcdFx0XHRbJ05ld0V4dGVybmFsUG9ydCcsZXh0ZXJuYWxQb3J0XSxcclxuXHRcdFx0XHRcdFx0WydOZXdJbnRlcm5hbENsaWVudCcsdGhpcy5nZXRJbnRlcm5hbEFkZHJlc3MoKV0sXHJcblx0XHRcdFx0XHRcdFsnTmV3SW50ZXJuYWxQb3J0Jyxwb3J0XSxcclxuXHRcdFx0XHRcdFx0WydOZXdMZWFzZUR1cmF0aW9uJywwXSxcclxuXHRcdFx0XHRcdFx0WydOZXdQb3J0TWFwcGluZ0Rlc2NyaXB0aW9uJyx0aGlzLm5hbWVdLFxyXG5cdFx0XHRcdFx0XHRbJ05ld1Byb3RvY29sJyxwcm90XSxcclxuXHRcdFx0XHRcdFx0WydOZXdSZW1vdGVIb3N0JyxcIlwiXVxyXG5cdFx0XHRcdFx0XVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR2YXIgYXJncyA9IFtcclxuLy9cdFx0XHRcdFx0XHRbJ05ld0VuYWJsZWQnLGVuYWJsZWRdLFxyXG5cdFx0XHRcdFx0XHRbJ05ld0V4dGVybmFsUG9ydCcsZXh0ZXJuYWxQb3J0XSxcclxuLy9cdFx0XHRcdFx0XHRbJ05ld0ludGVybmFsQ2xpZW50Jyx0aGlzLmdldEludGVybmFsQWRkcmVzcygpXSxcclxuLy9cdFx0XHRcdFx0XHRbJ05ld0ludGVybmFsUG9ydCcscG9ydF0sXHJcblx0XHRcdFx0XHRcdFsnTmV3UHJvdG9jb2wnLHByb3RdLFxyXG5cdFx0XHRcdFx0XHRbJ05ld1JlbW90ZUhvc3QnLFwiXCJdXHJcblx0XHRcdFx0XHRdXHJcblx0XHRcdFx0fVxyXG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZEdhdGV3YXkuZGV2aWNlLnJ1blNlcnZpY2UodGhpcy52YWxpZEdhdGV3YXkuc2VydmljZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ/J0FkZFBvcnRNYXBwaW5nJzonRGVsZXRlUG9ydE1hcHBpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncywgb25yZXN1bHQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldE1hcHBpbmdzOiBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAoISB0aGlzLnZhbGlkR2F0ZXdheSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZm8gPSB0aGlzLnZhbGlkR2F0ZXdheVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDBcclxuICAgICAgICAgICAgICAgIHZhciBhbGxtYXBwaW5ncyA9IFtdXHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gb25lUmVzdWx0KGV2dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnQudGFyZ2V0LmNvZGUgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwID0gZXZ0LnRhcmdldC5yZXNwb25zZVhNTC5xdWVyeVNlbGVjdG9yKFwiR2V0R2VuZXJpY1BvcnRNYXBwaW5nRW50cnlSZXNwb25zZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwcGluZyA9IGZsYXRQYXJzZU5vZGUocmVzcClcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsbWFwcGluZ3MucHVzaChtYXBwaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRPbmUoKVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGFsbG1hcHBpbmdzKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRPbmUoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5mby5kZXZpY2UucnVuU2VydmljZShpbmZvLnNlcnZpY2UsICdHZXRHZW5lcmljUG9ydE1hcHBpbmdFbnRyeScsIFtbJ05ld1BvcnRNYXBwaW5nSW5kZXgnLGlkeCsrXV0sIG9uZVJlc3VsdClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGdldE9uZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldElQOiBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgaW5mb3MgPSB0aGlzLmdldFdBTlNlcnZpY2VJbmZvKClcclxuICAgICAgICAgICAgdmFyIGZvdW5kSVAgPSBudWxsXHJcbiAgICAgICAgICAgIHZhciByZXR1cm5lZCA9IDBcclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uZVJlc3VsdChpbmZvLCBldnQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSBldnQudGFyZ2V0LnJlc3BvbnNlWE1MIC8vIGRvYyB1bmRlZmluZWQgc29tZXRpbWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgaXBlbHQgPSBkb2MuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ05ld0V4dGVybmFsSVBBZGRyZXNzJylcclxuICAgICAgICAgICAgICAgIHZhciBpcCA9IGlwZWx0ID8gaXBlbHQuaW5uZXJIVE1MIDogbnVsbFxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybmVkKytcclxuICAgICAgICAgICAgICAgIGluZm8uZGV2aWNlLmV4dGVybmFsSVAgPSBpcFxyXG4gICAgICAgICAgICAgICAgaWYgKGlwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmRJUCA9IGlwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWxpZEdhdGV3YXkgPSBpbmZvXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5lZCA9PSBpbmZvcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmb3VuZElQKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaW5mb3MgJiYgaW5mb3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGluZm9zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZm8gPSBpbmZvc1tpXVxyXG4gICAgICAgICAgICAgICAgICAgIGluZm8uZGV2aWNlLnJ1blNlcnZpY2UoaW5mby5zZXJ2aWNlLCdHZXRFeHRlcm5hbElQQWRkcmVzcycsW10sb25lUmVzdWx0LmJpbmQodGhpcywgaW5mbykpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBHYXRld2F5RGV2aWNlKGluZm8pIHtcclxuICAgICAgICB0aGlzLmluZm8gPSBpbmZvXHJcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbl91cmwgPSBpbmZvLmhlYWRlcnMubG9jYXRpb25cclxuICAgICAgICB0aGlzLnVybCA9IG5ldyBVUkwodGhpcy5kZXNjcmlwdGlvbl91cmwpXHJcbiAgICAgICAgdGhpcy5zZXJ2aWNlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5kZXZpY2VzID0gW11cclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSBudWxsXHJcbiAgICAgICAgdGhpcy5leHRlcm5hbElQID0gbnVsbFxyXG4gICAgfVxyXG4gICAgR2F0ZXdheURldmljZS5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgcnVuU2VydmljZTogZnVuY3Rpb24oc2VydmljZSwgY29tbWFuZCwgYXJncywgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBXU0MuQ2hyb21lU29ja2V0WE1MSHR0cFJlcXVlc3RcclxuICAgICAgICAgICAgdmFyIHVybCA9IHRoaXMudXJsLm9yaWdpbiArIHNlcnZpY2UuY29udHJvbFVSTFxyXG4gICAgICAgICAgICB2YXIgYm9keSA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCI/PicgK1xyXG4gICAgICAgICAgICAgICAgJzxzOkVudmVsb3BlICcgK1xyXG4gICAgICAgICAgICAgICAgJ3htbG5zOnM9XCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy9zb2FwL2VudmVsb3BlL1wiICcgK1xyXG4gICAgICAgICAgICAgICAgJ3M6ZW5jb2RpbmdTdHlsZT1cImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3NvYXAvZW5jb2RpbmcvXCI+JyArXHJcbiAgICAgICAgICAgICAgICAnPHM6Qm9keT4nICtcclxuICAgICAgICAgICAgICAgICc8dTonICsgY29tbWFuZCArICcgeG1sbnM6dT0nICtcclxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHNlcnZpY2Uuc2VydmljZVR5cGUpICsgJz4nICtcclxuICAgICAgICAgICAgICAgIGFyZ3MubWFwKGZ1bmN0aW9uKGFyZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzwnICsgYXJnc1swXSsgJz4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGFyZ3NbMV0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJnc1sxXSkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC8nICsgYXJnc1swXSArICc+JztcclxuICAgICAgICAgICAgICAgIH0pLmpvaW4oJycpICtcclxuICAgICAgICAgICAgICAgICc8L3U6JyArIGNvbW1hbmQgKyAnPicgK1xyXG4gICAgICAgICAgICAgICAgJzwvczpCb2R5PicgK1xyXG4gICAgICAgICAgICAgICAgJzwvczpFbnZlbG9wZT4nO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZXEgYm9keScsYm9keSlcclxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBuZXcgVGV4dEVuY29kZXIoJ3V0Zi04JykuZW5jb2RlKGJvZHkpLmJ1ZmZlclxyXG4gICAgICAgICAgICB2YXIgaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgICdjb250ZW50LXR5cGUnOid0ZXh0L3htbDsgY2hhcnNldD1cInV0Zi04XCInLFxyXG4gICAgICAgICAgICAgICAgJ2Nvbm5lY3Rpb24nOidjbG9zZScsXHJcbiAgICAgICAgICAgICAgICAnU09BUEFjdGlvbic6IEpTT04uc3RyaW5naWZ5KHNlcnZpY2Uuc2VydmljZVR5cGUpICsgJyMnICsgY29tbWFuZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGsgaW4gaGVhZGVycykge1xyXG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaywgaGVhZGVyc1trXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB4aHIub3BlbihcIlBPU1RcIix1cmwpXHJcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdjb25uZWN0aW9uJywnY2xvc2UnKVxyXG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ3htbCdcclxuICAgICAgICAgICAgeGhyLnNlbmQocGF5bG9hZClcclxuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IHhoci5vbmVycm9yID0geGhyLm9udGltZW91dCA9IGNhbGxiYWNrXHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXREZXNjcmlwdGlvbjogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBXU0MuQ2hyb21lU29ja2V0WE1MSHR0cFJlcXVlc3RcclxuICAgICAgICAgICAgY29uc29sZS5jbG9nKCdVUE5QJywncXVlcnknLHRoaXMuZGVzY3JpcHRpb25fdXJsKVxyXG4gICAgICAgICAgICB4aHIub3BlbihcIkdFVFwiLHRoaXMuZGVzY3JpcHRpb25fdXJsKVxyXG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignY29ubmVjdGlvbicsJ2Nsb3NlJylcclxuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICd4bWwnXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG9ubG9hZChldnQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChldnQudGFyZ2V0LmNvZGUgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvYyA9IGV2dC50YXJnZXQucmVzcG9uc2VYTUxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRldmljZXMgPSBkb2MuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2RldmljZScpXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGRldmljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXZpY2VzLnB1c2goIGZsYXRQYXJzZU5vZGUoZGV2aWNlc1tpXSkgKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlcnZpY2VzID0gZG9jLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzZXJ2aWNlJylcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2VydmljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcy5wdXNoKCBmbGF0UGFyc2VOb2RlKHNlcnZpY2VzW2ldKSApXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2dvdCBzZXJ2aWNlIGluZm8nLHRoaXMpXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IHhoci5vbmVycm9yID0geGhyLm9udGltZW91dCA9IG9ubG9hZC5iaW5kKHRoaXMpXHJcbiAgICAgICAgICAgIHhoci5zZW5kKClcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldFNlcnZpY2U6IGZ1bmN0aW9uKGRlc2lyZWQpIHtcclxuICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSB0aGlzLnNlcnZpY2VzLmZpbHRlciggZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlc2lyZWQuaW5kZXhPZihzZXJ2aWNlLnNlcnZpY2VUeXBlKSAhPSAtMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgZnVuY3Rpb24gU1NEUChvcHRzKSB7XHJcbiAgICAgICAgdGhpcy5wb3J0ID0gb3B0cy5wb3J0XHJcbiAgICAgICAgdGhpcy53YW50VURQID0gb3B0cy51ZHAgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBvcHRzLnVkcFxyXG5cdFx0dGhpcy5zZWFyY2h0aW1lID0gb3B0cy5zZWFyY2h0aW1lXHJcbiAgICAgICAgdGhpcy5tdWx0aWNhc3QgPSAnMjM5LjI1NS4yNTUuMjUwJ1xyXG4gICAgICAgIHRoaXMuc3NkcFBvcnQgPSAxOTAwXHJcbiAgICAgICAgdGhpcy5ib3VuZFBvcnQgPSBudWxsXHJcbiAgICAgICAgdGhpcy5zZWFyY2hkZXZpY2UgPSAndXJuOnNjaGVtYXMtdXBucC1vcmc6ZGV2aWNlOkludGVybmV0R2F0ZXdheURldmljZToxJ1xyXG4gICAgICAgIHRoaXMuX29uUmVjZWl2ZSA9IHRoaXMub25SZWNlaXZlLmJpbmQodGhpcylcclxuICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAub25SZWNlaXZlLmFkZExpc3RlbmVyKCB0aGlzLl9vblJlY2VpdmUgKVxyXG4gICAgICAgIGNocm9tZS5zb2NrZXRzLnVkcC5vblJlY2VpdmVFcnJvci5hZGRMaXN0ZW5lciggdGhpcy5fb25SZWNlaXZlIClcclxuICAgICAgICB0aGlzLnNvY2tNYXAgPSB7fVxyXG4gICAgICAgIHRoaXMubGFzdEVycm9yID0gbnVsbFxyXG4gICAgICAgIHRoaXMuc2VhcmNoaW5nID0gZmFsc2VcclxuICAgICAgICB0aGlzLl9ldmVudF9saXN0ZW5lcnMgPSB7fVxyXG4gICAgfVxyXG5cclxuICAgIFNTRFAucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICghIHRoaXMuX2V2ZW50X2xpc3RlbmVyc1tuYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRfbGlzdGVuZXJzW25hbWVdID0gW11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9ldmVudF9saXN0ZW5lcnNbbmFtZV0ucHVzaChjYWxsYmFjaylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGNicyA9IHRoaXMuX2V2ZW50X2xpc3RlbmVyc1tuYW1lXVxyXG4gICAgICAgICAgICBpZiAoY2JzKSB7XHJcbiAgICAgICAgICAgICAgICBjYnMuZm9yRWFjaCggZnVuY3Rpb24oY2IpIHsgY2IoZGF0YSkgfSApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uUmVjZWl2ZTogZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc29ja01hcFtyZXN1bHQuc29ja2V0SWRdXHJcbiAgICAgICAgICAgIHZhciByZXNwID0gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcpLmRlY29kZShyZXN1bHQuZGF0YSlcclxuICAgICAgICAgICAgaWYgKCEgKHJlc3Auc3RhcnRzV2l0aChcIkhUVFBcIikgfHwgcmVzcC5zdGFydHNXaXRoKFwiTk9USUZZXCIpKSkgeyByZXR1cm4gfVxyXG4gICAgICAgICAgICB2YXIgbGluZXMgPSByZXNwLnNwbGl0KCdcXHJcXG4nKVxyXG4gICAgICAgICAgICB2YXIgaGVhZGVycyA9IHt9XHJcbiAgICAgICAgICAgIC8vIFBhcnNlIGhlYWRlcnMgZnJvbSBsaW5lcyB0byBoYXNobWFwXHJcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xyXG4gICAgICAgICAgICAgICAgbGluZS5yZXBsYWNlKC9eKFteOl0qKVxccyo6XFxzKiguKikkLywgZnVuY3Rpb24gKF8sIGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzW2tleS50b0xvd2VyQ2FzZSgpXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGlmIChoZWFkZXJzLnN0ID09IHRoaXMuc2VhcmNoZGV2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdTU0RQIHJlc3BvbnNlJyxoZWFkZXJzLHJlc3VsdClcclxuICAgICAgICAgICAgICAgIHZhciBkZXZpY2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3RlQWRkcmVzczogcmVzdWx0LnJlbW90ZUFkZHJlc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3RlUG9ydDogcmVzdWx0LnJlbW90ZVBvcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0SWQ6IDk3NyxcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2RldmljZScsZGV2aWNlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IGRhdGFcclxuICAgICAgICAgICAgY29uc29sZS5jbG9nKCdVUE5QJywgXCJlcnJvclwiLGRhdGEpXHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgLy8gY2xlYXIgb3V0IGFsbCBzb2NrZXRzIGluIHNvY2ttYXBcclxuICAgICAgICAgICAgdGhpcy5jbGVhbnVwKClcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWxsRG9uZSkgdGhpcy5hbGxEb25lKGZhbHNlKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xlYW51cDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHNvY2tldElkIGluIHRoaXMuc29ja01hcCkge1xyXG4gICAgICAgICAgICAgICAgY2hyb21lLnNvY2tldHMudWRwLmNsb3NlKHBhcnNlSW50KHNvY2tldElkKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNvY2tNYXAgPSB7fVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAub25SZWNlaXZlLnJlbW92ZUxpc3RlbmVyKCB0aGlzLl9vblJlY2VpdmUgKVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAub25SZWNlaXZlRXJyb3IucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX29uUmVjZWl2ZSApXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdG9wc2VhcmNoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5jbG9nKCdVUE5QJywgXCJzdG9wcGluZyBzc2RwIHNlYXJjaFwiKVxyXG4gICAgICAgICAgICAvLyBzdG9wIHNlYXJjaGluZywga2lsbCBhbGwgc29ja2V0c1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaGluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW51cCgpXHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcignc3RvcCcpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZWFyY2g6IGZ1bmN0aW9uKG9wdHMpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VhcmNoaW5nKSB7IHJldHVybiB9XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIHRoaXMuc3RvcHNlYXJjaC5iaW5kKHRoaXMpLCB0aGlzLnNlYXJjaHRpbWUgKVxyXG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB7b3B0czpvcHRzfVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAuY3JlYXRlKGZ1bmN0aW9uKHNvY2tJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5zb2NrSW5mbyA9IHNvY2tJbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvY2tNYXBbc29ja0luZm8uc29ja2V0SWRdID0gc3RhdGVcclxuICAgICAgICAgICAgICAgIGNocm9tZS5zb2NrZXRzLnVkcC5zZXRNdWx0aWNhc3RUaW1lVG9MaXZlKHNvY2tJbmZvLnNvY2tldElkLCAxLCBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yKHtlcnJvcjondHRsJyxjb2RlOnJlc3VsdH0pXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hyb21lLnNvY2tldHMudWRwLmJpbmQoc3RhdGUuc29ja0luZm8uc29ja2V0SWQsICcwLjAuMC4wJywgMCwgdGhpcy5vbmJvdW5kLmJpbmQodGhpcyxzdGF0ZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbmJvdW5kOiBmdW5jdGlvbihzdGF0ZSxyZXN1bHQpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3Ioe2Vycm9yOidiaW5kIGVycm9yJyxjb2RlOnJlc3VsdH0pXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAuZ2V0SW5mbyhzdGF0ZS5zb2NrSW5mby5zb2NrZXRJZCwgdGhpcy5vbkluZm8uYmluZCh0aGlzLHN0YXRlKSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uSW5mbzogZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcclxuXHRcdFx0dmFyIGxhc3RlcnIgPSBjaHJvbWUucnVudGltZS5sYXN0RXJyb3JcclxuXHRcdFx0aWYgKGxhc3RlcnIpIHtcclxuXHRcdFx0XHQvLyBzb2NrZXQgd2FzIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lP1xyXG5cdFx0XHRcdHRoaXMuZXJyb3IobGFzdGVycilcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0fVxyXG4gICAgICAgICAgICB0aGlzLmJvdW5kUG9ydCA9IGluZm8ubG9jYWxQb3J0XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5jbG9nKCdVUE5QJywnYm91bmQnKVxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAuam9pbkdyb3VwKHN0YXRlLnNvY2tJbmZvLnNvY2tldElkLCB0aGlzLm11bHRpY2FzdCwgdGhpcy5vbmpvaW5lZC5iaW5kKHRoaXMsc3RhdGUpKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25qb2luZWQ6IGZ1bmN0aW9uKHN0YXRlLCByZXN1bHQpIHtcclxuICAgICAgICAgICAgdmFyIGxhc3RlcnIgPSBjaHJvbWUucnVudGltZS5sYXN0RXJyb3JcclxuICAgICAgICAgICAgaWYgKGxhc3RlcnIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IobGFzdGVycilcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yKHtlcnJvcjonam9pbiBtdWx0aWNhc3QnLGNvZGU6cmVzdWx0fSlcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciByZXEgPSAnTS1TRUFSQ0ggKiBIVFRQLzEuMVxcclxcbicgK1xyXG4gICAgICAgICAgICAgICAgJ0hPU1Q6ICcgKyB0aGlzLm11bHRpY2FzdCArICc6JyArIHRoaXMuc3NkcFBvcnQgKyAnXFxyXFxuJyArXHJcbiAgICAgICAgICAgICAgICAnTUFOOiBcInNzZHA6ZGlzY292ZXJcIlxcclxcbicgK1xyXG4gICAgICAgICAgICAgICAgJ01YOiAxXFxyXFxuJyArXHJcbiAgICAgICAgICAgICAgICAnU1Q6ICcgKyB0aGlzLnNlYXJjaGRldmljZSArICdcXHJcXG4nICtcclxuICAgICAgICAgICAgICAgICdcXHJcXG4nXHJcblxyXG4gICAgICAgICAgICBjaHJvbWUuc29ja2V0cy51ZHAuc2VuZChzdGF0ZS5zb2NrSW5mby5zb2NrZXRJZCwgbmV3IFRleHRFbmNvZGVyKCd1dGYtOCcpLmVuY29kZShyZXEpLmJ1ZmZlciwgdGhpcy5tdWx0aWNhc3QsIHRoaXMuc3NkcFBvcnQsIHRoaXMub25zZW5kLmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5jbG9nKCdVUE5QJywgJ3NlbmRpbmcgdG8nLHRoaXMubXVsdGljYXN0LHRoaXMuc3NkcFBvcnQpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbnNlbmQ6IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuY2xvZygnVVBOUCcsICdzZW50IHJlc3VsdCcscmVzdWx0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFdTQy5VUE5QID0gVVBOUFxyXG59KSgpO1xyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3dzYy1jaHJvbWUvd2ViLXNlcnZlci1jaHJvbWUvdXBucC50c1xuLy8gbW9kdWxlIGlkID0gMTVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==