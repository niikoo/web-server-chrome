import { isFunction } from 'lodash';
import { IOStream } from './stream';
import { WSC } from './common';
import { TextDecoder } from "./encoding";
import { HTTPRequest } from "./request";
export class HTTPConnection {
  _DEBUG = false
  curRequest;
  closed;
  onRequestCallback;
  constructor (
    public stream: IOStream
  ) {
    this.curRequest = null
    this.onRequestCallback = null
    //this.log('new connection')
    this.closed = false
  }

  log(msg) {
    console.log(this.stream.sockId, msg)
  }
  tryRead() {
    this.stream.readUntil('\r\n\r\n', this.onHeaders.bind(this))
  }
  write(data, callback = null) {
    let buf;
    if (typeof data == 'string') {
      // this is using TextEncoder with utf-8
      buf = WSC.stringToUint8Array(data).buffer
    } else {
      buf = data
    }
    this.stream.writeBuffer.add(buf)
    this.stream.tryWrite(callback);
  }
  close() {
    console.log('http conn close')
    this.closed = true
    this.stream.close()
  }
  addRequestCallback(cb) {
    this.onRequestCallback = cb
  }
  onHeaders(data) {
    // TODO - http headers are Latin1, not ascii...
    var datastr = WSC.arrayBufferToString(data)
    var lines = datastr.split('\r\n')
    var firstline = lines[0]
    var flparts = firstline.split(' ')
    var method = flparts[0]
    var uri = flparts[1]
    var version = flparts[2]

    var headers = WSC.parseHeaders(lines.slice(1, lines.length - 2))
    this.curRequest = new HTTPRequest({
      headers: headers,
      method: method,
      uri: uri,
      version: version,
      connection: this
    })
    if (this._DEBUG) {
      this.log(this.curRequest.uri)
    }
    if (headers['content-length']) {
      var clen = parseInt(headers['content-length'])
      // TODO -- handle 100 continue..
      if (clen > 0) {
        console.log('request had content length', clen)
        this.stream.readBytes(clen, this.onRequestBody.bind(this))
        return
      } else {
        this.curRequest.body = null
      }
    }

    if (['GET', 'HEAD', 'PUT', 'OPTIONS'].includes(method)) {
      this.onRequest(this.curRequest)
    } else {
      console.error('how to handle', this.curRequest)
    }
  }
  onRequestBody(body) {
    var req = this.curRequest
    var ct = req.headers['content-type']
    var default_charset = 'utf-8'
    if (ct) {
      ct = ct.toLowerCase()
      if (ct.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
        var charset_i = ct.indexOf('charset=')
        let charset;
        if (charset_i != -1) {
          charset = ct.slice(charset_i + 'charset='.length,
            ct.length)
          console.log('using charset', charset)
        } else {
          charset = default_charset
        }

        var bodydata = new TextDecoder(charset).decode(body)
        var bodyparams = {}
        var items = bodydata.split('&')
        for (var i = 0; i < items.length; i++) {
          var kv = items[i].split('=')
          bodyparams[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1])
        }
        req.bodyparams = bodyparams
      }
    }
    this.curRequest.body = body
    this.onRequest(this.curRequest)
  }
  onRequest(request) {
    this.onRequestCallback(request)
  }
}
