import { extend, bind } from 'lodash';
import { WSC } from './common';
import { Buffer } from './buffer';
import { IOStream } from './stream';

declare let TextEncoder: any;
declare let TextDecoder: any;

export class ChromeSocketXMLHttpRequest {
  chunks: any;
  responseDataParsed: { code: any; status: any; proto: any; headers: {}; };

  onload = null;
  _finished = false;
  onerror = null;
  opts = null;

  timedOut = false;
  timeout = 0;
  timeoutId = null;

  stream: IOStream;

  connecting = false;
  writing = false;
  haderror = false;
  closed = false;

  sockInfo = null;
  responseType = null;

  extraHeaders = {};

  headersReceived = false;
  responseHeaders = null;
  responseHeadersParsed = null;
  responseBody = null;
  responseLength = null;
  responseBytesRead = null;
  requestBody = null;

  secured = false;
  uri;
  ontimeout;

  constructor() {
  }

  ui8IndexOf(arr, s, startIndex) {
    // searches a ui8array for subarray s starting at startIndex
    startIndex = startIndex || 0
    let match = false
    for (let i = startIndex; i < arr.length - s.length + 1; i++) {
      if (arr[i] === s[0]) {
        match = true
        for (let j = 1; j < s.length; j++) {
          if (arr[i + j] !== s[j]) {
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

  open(method, url, async) {
    this.opts = {
      method: method,
      url: url,
      async: true
    }
    this.uri = WSC.parseUri(this.opts.url)
    console.assert(this.uri.protocol === 'http:') // https not supported for chrome.socket yet
  }
  setRequestHeader(key, val) {
    this.extraHeaders[key] = val
  }
  cancel() {
    if (!this.stream.closed) { this.stream.close() }
  }
  send(data) {
    //console.log('xhr send payload',this.opts.method, data)
    this.requestBody = data
    chrome.sockets.tcp.create({}, bind(this.onCreate, this))
    if (this.timeout !== 0) {
      this.timeoutId = setTimeout(bind(this.checkTimeout, this), this.timeout)
    }
  }
  createRequestHeaders() {
    let lines = []
    let headers = {//'Connection': 'close',
      //'Accept-Encoding': 'identity', // servers will send us chunked encoding even if we dont want it, bastards
      //                           'Accept-Encoding': 'identity;q=1.0 *;q=0', // servers will send us chunked encoding even if we dont want it, bastards
      //                       'User-Agent': 'uTorrent/330B(30235)(server)(30235)', // setRequestHeader /extra header is doing this
      'Host': this.uri.host
    }
    extend(headers, this.extraHeaders)
    if (this.opts.method === 'GET') {
      //                headers['Content-Length'] == '0'
    } else if (this.opts.method === 'POST') {
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
    console.log('making request', lines[0], headers)
    for (let key in headers) {
      lines.push(key + ': ' + headers[key])
    }
    return lines.join('\r\n') + '\r\n\r\n'
  }
  checkTimeout() {
    if (!this._finished) {
      this.error({ error: 'timeout' }) // call ontimeout instead
    }
  }
  error(data) {
    this._finished = true
    console.log('error:', data)
    this.haderror = true
    if (this.onerror) {
      console.assert(typeof data === 'object')
      data.target = { error: true }
      this.onerror(data)
    }
    if (!this.stream.closed) {
      this.stream.close()
    }
  }
  onStreamClose(evt) {
    console.log('xhr closed');
    this.stream.onDestroy();
    if (!this._finished) {
      this.error({ error: 'stream closed' })
    }
  }
  onCreate(sockInfo) {
    if (this.closed) { return }
    this.stream = new IOStream(sockInfo.socketId);
    this.stream.addCloseCallback(this.onStreamClose.bind(this))
    this.sockInfo = sockInfo
    this.connecting = true
    let host = this.getHost()
    let port = this.getPort()
    console.log('connecting to', host, port)
    chrome.sockets.tcp.setPaused(sockInfo.socketId, true, () => {
      chrome.sockets.tcp.connect(sockInfo.socketId, host, port, () => this.onConnect)
    });
  }
  onConnect(result) {
    console.log('connected to', this.getHost())
    let lasterr = chrome.runtime.lastError
    if (this.closed) { return }
    this.connecting = false
    if (this.timedOut) {
      return
    } else if (lasterr) {
      this.error({ error: lasterr.message })
    } else if (result < 0) {
      this.error({
        error: 'connection error',
        code: result
      })
    } else {
      if (this.uri.protocol === 'https:' && !this.secured) {
        this.secured = true
        //console.log('securing socket',this.sockInfo.socketId)
        chrome.sockets.tcp['secure'](this.sockInfo.socketId, this.onConnect.bind(this))
        return
      }
      let headers = this.createRequestHeaders()
      //console.log('request to',this.getHost(),headers)
      this.stream.writeBuffer.add(new TextEncoder('utf-8').encode(headers, undefined).buffer)
      if (this.requestBody) {
        this.stream.writeBuffer.add(this.requestBody)
        this.requestBody = null
      }
      this.stream.tryWrite(() => { });
      this.stream.readUntil('\r\n\r\n', this.onHeaders.bind(this))
      chrome.sockets.tcp.setPaused(this.sockInfo.socketId, false, function () { })
    }
  }
  getHost() {
    return this.uri.hostname
  }
  getPort() {
    if (this.uri.protocol === 'https:') {
      return parseInt(this.uri.port) || 443
    } else {
      return parseInt(this.uri.port) || 80
    }
  }
  onHeaders(data) {
    // not sure what encoding for headers is exactly, latin1 or something? whatever.
    let headers = WSC.ui82str(new Uint8Array(data), undefined)
    //console.log('found http tracker response headers', headers)
    this.headersReceived = true
    this.responseHeaders = headers
    let response = parseHeaders(this.responseHeaders)
    this.responseDataParsed = response
    this.responseHeadersParsed = response.headers
    //console.log(this.getHost(),'parsed http response headers',response)
    this.responseLength = parseInt(response.headers['content-length'])
    this.responseBytesRead = this.stream.readBuffer.size()

    if (response.headers['transfer-encoding'] &&
      response.headers['transfer-encoding'] === 'chunked') {
      this.chunks = new Buffer();
      //console.log('looking for an \\r\\n')
      this.stream.readUntil('\r\n', this.getNewChunk.bind(this))
      //this.error('chunked encoding')
    } else {
      if (!response.headers['content-length']) {
        this.error('no content length in response')
      } else {
        //console.log('read bytes',this.responseLength)
        this.stream.readBytes(this.responseLength, this.onBody.bind(this))
      }
    }
  }
  onChunkDone(data) {
    this.chunks.add(data)
    this.stream.readUntil('\r\n', this.getNewChunk.bind(this))
  }
  getNewChunk(data) {
    let s = WSC.ui82str(new Uint8Array(data.slice(0, data.byteLength - 2)), undefined)
    let len = parseInt(s, 16)
    if (isNaN(len)) {
      this.error('invalid chunked encoding response')
      return
    }
    //console.log('looking for new chunk of len',len)
    if (len === 0) {
      //console.log('got all chunks',this.chunks)
      let body = this.chunks.flatten()
      this.onBody(body)
    } else {
      this.stream.readBytes(len + 2, this.onChunkDone.bind(this))
    }
  }
  onBody(body) {
    this.responseBody = body
    let evt = {
      target: {
        headers: this.responseDataParsed.headers,
        code: this.responseDataParsed.code, /* code is wrong, should be status */
        status: this.responseDataParsed.code,
        responseHeaders: this.responseHeaders,
        responseHeadersParsed: this.responseHeadersParsed,
        response: body,
        responseXML: null
      }
    }
    if (this.responseType && this.responseType.toLowerCase() === 'xml') {
      evt.target.responseXML = (new DOMParser).parseFromString(new TextDecoder('utf-8').decode(body), 'text/xml')
    }
    this.onload(evt)
    this._finished = true
    if (!this.stream.closed) { this.stream.close() }
    // all done!!! (close connection...)
  }
}

function parseHeaders(s) {
  let lines = s.split('\r\n')
  let firstLine = lines[0].split(/ +/)
  let proto = firstLine[0]
  let code = firstLine[1]
  let status = firstLine.slice(2, firstLine.length).join(' ')
  let headers = {}

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i]
    if (line) {
      let j = line.indexOf(':')
      let key = line.slice(0, j).toLowerCase()
      headers[key] = line.slice(j + 1, line.length).trim()
    }
  }
  return {
    code: code,
    status: status,
    proto: proto,
    headers: headers
  }
}

/*window['testxhr'] = function () {
  console.log('creating XHR')
  let xhr = new ChromeSocketXMLHttpRequest(new WSC())
  xhr.open("GET", "https://www.google.com")
  xhr.timeout = 8000
  xhr.onload = xhr.onerror = xhr.ontimeout = function (evt) {
    console.log('xhr result:', evt)
  }
  xhr.send()
  window['txhr'] = xhr
}*/
