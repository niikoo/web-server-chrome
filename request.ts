import { HTTPConnection } from './connection';
export class HTTPRequest {
  method;
  uri;
  version;
  connection: HTTPConnection;
  headers;
  body;
  bodyparams;
  arguments = {
    static: null,
    json: null,
    url: null
  };
  path;
  origpath;
  constructor(opts) {
    this.method = opts.method
    this.uri = opts.uri || '';
    this.version = opts.version
    this.connection = opts.connection
    this.headers = opts.headers
    this.body = null
    this.bodyparams = null
    let idx = this.uri.indexOf('?');
    if (idx !== -1) {
      this.path = decodeURIComponent(this.uri.slice(0, idx))
      let s = this.uri.slice(idx + 1)
      let parts = s.split('&')

      for (let i = 0; i < parts.length; i++) {
        let p = parts[i]
        let idx2 = p.indexOf('=')
        this.arguments[decodeURIComponent(p.slice(0, idx2))] = decodeURIComponent(p.slice(idx2 + 1, s.length))
      }
    } else {
      this.path = decodeURIComponent(this.uri)
    }

    this.origpath = this.path

    if (this.path[this.path.length - 1] == '/') {
      this.path = this.path.slice(0, this.path.length - 1)
    }
  }
  isKeepAlive() {
    return this.headers['connection'] && this.headers['connection'].toLowerCase() != 'close'
  }
}
