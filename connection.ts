import { isFunction } from 'lodash';
import { IOStream } from './stream';
import { WSC } from './common';
import { HTTPRequest } from './request';

declare let TextEncoder: any;
declare let TextDecoder: any;

export class HTTPConnection {
  _DEBUG = WSC.DEBUG;
  readonly identifier = ' <C#' + Math.floor(Math.random() * 100) + '>';
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

  log(...msg) {
    if (WSC.DEBUG) {
      console.log('[LOG]', ...msg, this.identifier);
    }
  }
  tryRead() {
    this.stream.readUntil('\r\n\r\n', (data) => this.onHeaders(data));
  }
  write(data, callback = null) {
    let buf;
    if (typeof data === 'string') {
      // this is using TextEncoder with utf-8
      this.log('starting writing utf-8');
      buf = WSC.stringToUint8Array(data).buffer
    } else {
      this.log('starting writing');
      buf = data
    }
    this.stream.writeBuffer.add(buf)
    this.stream.tryWrite(callback);
  }
  close() {
    this.log('http conn close')
    this.closed = true
    this.stream.close()
  }
  addRequestCallback(cb) {
    this.log('Adding request callback: ', cb);
    this.onRequestCallback = cb
  }
  onHeaders(data) {
    this.log('[HEADERS]', data, 'onHeaders()');
    // TODO - http headers are Latin1, not ascii...
    let datastr = WSC.arrayBufferToString(data);
    let lines = datastr.split('\r\n')
    this.log('[HEADERS] datastr: ', datastr, lines);
    let firstline = lines[0]
    let flparts = firstline.split(' ')
    let method = flparts[0]
    let uri = flparts[1]
    let version = flparts[2]

    let headers = WSC.parseHeaders(lines.slice(1, lines.length - 2))
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
      let clen = parseInt(headers['content-length'])
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
    let req = this.curRequest
    let ct = req.headers['content-type']
    let default_charset = 'utf-8'
    if (ct) {
      ct = ct.toLowerCase()
      if (ct.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
        let charset_i = ct.indexOf('charset=')
        let charset;
        if (charset_i !== -1) {
          charset = ct.slice(charset_i + 'charset='.length,
            ct.length)
          console.log('using charset', charset)
        } else {
          charset = default_charset
        }

        let bodydata = new TextDecoder(charset).decode(body)
        let bodyparams = {}
        let items = bodydata.split('&')
        for (let i = 0; i < items.length; i++) {
          let kv = items[i].split('=')
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
