import { HTTPConnection } from './connection';
import { HTTPRequest } from './request';
import { ChromeSocketXMLHttpRequest } from './chromesocketxhr';
import { BaseHandler, FileSystem } from './webapp';
import { WSC } from './common';
import { escape, isNil, extend } from 'lodash';
declare let TextEncoder: any;

export type RequestHandler = ProxyHandler | DirectoryEntryHandler | DefaultHandler;

export function getEntryFile(entry, callback) {
  // XXX if file is 0 bytes, and then write some data, it stays cached... which is bad...

  let cacheKey = entry.filesystem.name + '/' + entry.fullPath
  let inCache = WSC.entryFileCache.get(cacheKey)
  if (inCache) {
    if (WSC.VERBOSE) { console.log('file cache hit', inCache, cacheKey); }
    callback(inCache);
    return;
  }

  entry.file((file) => {
    //if (false) {
    // WSC.entryFileCache.set(cacheKey, file);
    //}
    callback(file)
  }, (evt) => {
    // todo -- actually respond with the file error?
    // or cleanup the context at least
    WSC.entryFileCache.unset(cacheKey);
    console.error('entry.file() error', evt);
    // debugger
    evt.error = true;
    // could be NotFoundError
    callback(evt);
  });
}

export class ProxyHandler extends BaseHandler {

  constructor (
    public validator,
    public request: HTTPRequest) {
    super();
  }

  parse(validator, request: HTTPRequest) {
    this.validator = validator;
    this.request = request;
    return this;
  }

  get() {
    if (!this.validator(this.request)) {
      this.responseLength = 0
      this.writeHeaders(403)
      this.finish()
      return
    }
    console.log('proxyhandler get', this.request)
    let url = this.request.arguments.url || this.request.uri;
    let xhr = new ChromeSocketXMLHttpRequest();
    let chromeheaders = {
      //                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/;q=0.8',
      //                'Accept-Encoding':'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'no-cache',
      //                'Connection':'keep-alive',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
    }
    for (let k of Object.keys(chromeheaders)) {
      xhr.setRequestHeader(k, chromeheaders[k])
    }
    xhr.open('GET', url, undefined);
    xhr.onload = this.onfetched.bind(this)
    xhr.send(undefined);
  }

  onfetched(evt) {
    for (let header of Object.keys(evt.target.headers)) {
      this.setHeader(header, evt.target.headers[header])
    }
    this.responseLength = evt.target.response.byteLength
    this.writeHeaders(evt.target.code)
    this.write(evt.target.response, undefined, undefined);
    this.finish()
  }
}

export class DirectoryEntryHandler extends BaseHandler {
  debugInterval;
  entry = null;
  file = null;
  readChunkSize = 4096 * 16;
  fileOffset = 0;
  fileEndOffset = 0;
  opts = { optUpload: true };
  bodyWritten = 0;
  responseLength = 0;
  isDirectoryListing = false;
  rewriteTo: string = undefined;
  constructor (
    public fs: FileSystem,
    public request: HTTPRequest
  ) {
    super();
    // this.debugInterval = setInterval(() => this.debug(), 1000);
    if (!isNil(request)) {
      this.request.connection.stream.onclose = () => this.onClose;
    }
  }
  onClose() {
    console.log('closed', this.request.path)
    clearInterval(this.debugInterval);
  }
  debug() {
    console.log(this.request.connection.stream.sockId, 'debug wb:', this.request.connection.stream.writeBuffer.size())
  }
  head() {
    this.get()
  }
  setOpts(opts) {
    this.opts = opts;
  }
  put() {
    if (!this.opts.optUpload) {
      this.responseLength = 0
      this.writeHeaders(400)
      this.finish()
      return;
    }

    // if upload enabled in options...
    // check if file exists...
    this.fs.getByPath(this.request.path, this.onPutEntry.bind(this), true)
  }
  onPutEntry(entry) {
    let parts = this.request.path.split('/')
    let path = parts.slice(0, parts.length - 1).join('/')
    let filename = parts[parts.length - 1]

    if (entry && entry.error === 'path not found') {
      // good, we can upload it here ...
      this.fs.getByPath(path, this.onPutFolder.bind(this, filename), true);
    } else {
      let allowReplaceFile = true
      console.log('file already exists', entry)
      if (allowReplaceFile) {
        // truncate file
        let onremove = function (evt) {
          this.fs.getByPath(path, this.onPutFolder.bind(this, filename))
        }.bind(this)
        entry.remove(onremove, onremove)
      }
    }
  }
  onPutFolder(filename, folder) {
    let onwritten = function (evt) {
      console.log('write complete', evt)
      // TODO write 400 in other cases...
      this.responseLength = 0
      this.writeHeaders(200)
      this.finish()
    }.bind(this)
    let body = this.request.body
    let onfile = (entry) => {
      if (entry && entry.isFile) {
        let onwriter = (writer) => {
          writer.onwrite = writer.onerror = onwritten
          writer.write(new Blob([body]))
        }
        entry.createWriter(onwriter, onwriter)
      }
    }
    folder.getFile(filename, { create: true }, onfile, onfile)
  }
  get() {
    //this.request.connection.stream.onWriteBufferEmpty = this.onWriteBufferEmpty.bind(this)

    this.setHeader('accept-ranges', 'bytes')
    this.setHeader('connection', 'keep-alive')
    if (!this.fs) {
      this.write('error: need to select a directory to serve', 500, undefined);
      return
    }


    // strip '/' off end of path
    if (this.request.path.substr(this.request.path.length - 1, 1) === '/') {
      this.request.path = this.request.path.substr(0, this.request.path.length - 1);
    }

    /*if (this.request.path !== '') {
      let path = decodeURI(this.request.path);

    }*/

    if (WSC.DEBUG) {
      console.log('Instance: ' + Math.round(Math.random() * 100));
    }

    if (this.rewriteTo) {
      this.fs.getByPath(this.rewriteTo, (entry) => this.onEntry(entry), true)
    } else if (this.fs.entry.isFile) {
      this.onEntry(this.fs.entry)
    } else {
      this.fs.getByPath(this.request.path, (entry) => this.onEntry(entry), true)
    }
  }
  doReadChunk() {
    //console.log(this.request.connection.stream.sockId, 'doReadChunk', this.fileOffset)
    let reader = new FileReader;

    let endByte = Math.min(this.fileOffset + this.readChunkSize,
      this.fileEndOffset)
    if (endByte >= this.file.size) {
      console.error('bad readChunk')
      console.assert(false)
    }

    //console.log('doReadChunk',this.fileOffset,endByte-this.fileOffset)
    reader.onload = this.onReadChunk.bind(this)
    reader.onerror = this.onReadChunk.bind(this)
    let blobSlice = this.file.slice(this.fileOffset, endByte + 1)
    let oldOffset = this.fileOffset
    this.fileOffset += (endByte - this.fileOffset) + 1
    //console.log('offset',oldOffset,this.fileOffset)
    reader.readAsArrayBuffer(blobSlice)
  }
  onWriteBufferEmpty() {
    if (!this.file) {
      console.error('!this.file')
      debugger;
      return
    }
    console.assert(this.bodyWritten <= this.responseLength)
    //console.log('onWriteBufferEmpty', this.bodyWritten, '/', this.responseLength)
    if (this.bodyWritten > this.responseLength) {
      console.assert(false)
    } else if (this.bodyWritten === this.responseLength) {
      this.request.connection.stream.onWriteBufferEmpty = null
      this.finish()
      return
    } else {
      if (this.request.connection.stream.remoteclosed) {
        this.request.connection.close()
        // still read?
      } else if (!this.request.connection.stream.closed) {
        this.doReadChunk()
      }
    }
  }
  onReadChunk(evt) {
    //console.log('onReadChunk')
    if (evt.target.result) {
      this.bodyWritten += evt.target.result.byteLength
      if (this.bodyWritten >= this.responseLength) {
        //this.request.connection.stream.onWriteBufferEmpty = null
      }
      //console.log(this.request.connection.stream.sockId,'write',evt.target.result.byteLength)
      this.request.connection.write(evt.target.result)
    } else {
      console.error('onreadchunk error', evt.target.error)
      this.request.connection.close()
    }
  }
  onEntry(entry) {
    this.entry = entry;

    if (this.entry && this.entry.isDirectory && !this.request.origpath.endsWith('/')) {
      debugger;
      let newloc = this.request.origpath + '/';
      this.setHeader('location', newloc); // XXX - encode latin-1 somehow?
      this.responseLength = 0;
      console.log('redirect ->', newloc);
      this.writeHeaders(301);

      this.finish();
      return
    }

    if (this.request.connection.stream.closed) {
      console.warn(this.request.connection.stream.sockId, 'request closed while processing request')
      return
    }
    if (!entry) {
      if (this.request.method === 'HEAD') {
        this.responseLength = 0
        this.writeHeaders(404)
        this.finish()
      } else {
        this.write('no entry', 404, undefined)
      }
    } else if (entry.error) {
      if (this.request.method === 'HEAD') {
        this.responseLength = 0
        this.writeHeaders(404)
        this.finish()
      } else {
        this.write('entry not found: ' + (this.rewriteTo || this.request.path), 404, undefined)
      }
    } else if (entry.isFile) {
      this.renderFileContents(entry, undefined)
    } else {
      // directory
      let reader = entry.createReader()
      let allresults = []
      this.isDirectoryListing = true

      let onReadErr = (evt) => {
        WSC.entryCache.unset(this.entry.filesystem.name + this.entry.fullPath)
        console.error('error reading dir', evt)
        this.request.connection.close()
      }

      let allDone = (results) => {
        if (WSC.app.opts.optRenderIndex) {
          for (let i = 0; i < results.length; i++) {
            if (results[i].name === 'index.xhtml' || results[i].name === 'index.xhtm') {
              this.setHeader('content-type', 'application/xhtml+xml; charset=utf-8')
              this.renderFileContents(results[i], undefined);
              return
            } else if (results[i].name === 'index.html' || results[i].name === 'index.htm') {
              this.setHeader('content-type', 'text/html; charset=utf-8')
              this.renderFileContents(results[i], undefined);
              return
            }
          }
        }
        if (this.request.arguments && this.request.arguments.json === '1' ||
          (this.request.headers['accept'] && this.request.headers['accept'].toLowerCase() === 'applicaiton/json')
        ) {
          this.renderDirectoryListingJSON(results)
        } else if (this.request.arguments && this.request.arguments.static === '1' ||
          this.request.arguments.static === 'true' ||
          WSC.app.opts.optStatic
        ) {
          this.renderDirectoryListing(results)
        } else {
          this.renderDirectoryListingTemplate(results)
        }
      }

      let onReadSuccess = (results) => {
        //console.log('onreadsuccess',results.length)
        if (results.length === 0) {
          allDone.bind(this)(allresults)
        } else {
          allresults = allresults.concat(results)
          reader.readEntries((recResults) => onReadSuccess(recResults),
            (evt) => onReadErr(evt));
        }
      }

      //console.log('readentries')
      reader.readEntries(onReadSuccess.bind(this),
        onReadErr.bind(this))
    }
  }
  renderFileContents(entry, filePointer) {
    getEntryFile(entry, (file) => {
      if (file instanceof DOMException) {
        this.write('File not found', 404, undefined)
        this.finish()
        return
      }
      this.file = file;
      if (this.request.method === 'HEAD') {
        this.responseLength = file.size;
        this.writeHeaders(200);
        this.finish();
      } else if (file.size > this.readChunkSize * 8 || this.request.headers['range']) {
        this.request.connection.stream.onWriteBufferEmpty = this.onWriteBufferEmpty.bind(this)

        if (this.request.headers['range']) {
          console.log(this.request.connection.stream.sockId, 'RANGE', this.request.headers['range'])

          let range = this.request.headers['range'].split('=')[1].trim()

          let rparts = range.split('-')
          if (!rparts[1]) {
            this.fileOffset = parseInt(rparts[0], 10)
            this.fileEndOffset = this.file.size - 1
            this.responseLength = this.file.size - this.fileOffset;
            this.setHeader('content-range', 'bytes ' + this.fileOffset + '-' + (this.file.size - 1) + '/' + this.file.size)
            if (this.fileOffset === 0) {
              this.writeHeaders(200)
            } else {
              this.writeHeaders(206)
            }

          } else {
            //debugger // TODO -- add support for partial file fetching...
            //this.writeHeaders(500)
            this.fileOffset = parseInt(rparts[0], 10);
            this.fileEndOffset = parseInt(rparts[1], 10);
            this.responseLength = this.fileEndOffset - this.fileOffset + 1
            this.setHeader('content-range', 'bytes ' + this.fileOffset + '-' + (this.fileEndOffset) + '/' + this.file.size)
            this.writeHeaders(206)
          }


        } else {
          if (WSC.DEBUG) {
            console.log('large file, streaming mode!')
          }
          this.fileOffset = 0
          this.fileEndOffset = this.file.size - 1
          this.responseLength = this.file.size
          this.writeHeaders(200)
        }

      } else {
        if (WSC.DEBUG) { console.log('Entry:', entry, 'File:', file); }
        let fr = new FileReader();
        let cb = (evt) => this.onReadEntry(evt);
        fr.onload = cb;
        fr.onerror = cb;
        fr.readAsArrayBuffer(file);
      }
    });
  }
  entriesSortFunc(a, b) {
    let anl = a.name.toLowerCase()
    let bnl = b.name.toLowerCase()
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

  }
  renderDirectoryListingJSON(results) {
    this.setHeader('content-type', 'application/json; charset=utf-8')
    this.write(JSON.stringify(results.map(function (f) {
      return {
        name: f.name,
        fullPath: f.fullPath,
        isFile: f.isFile,
        isDirectory: f.isDirectory
      }
    }), null, 2), undefined, undefined)
  }
  renderDirectoryListingTemplate(results) {
    if (!WSC.template_data) {
      return this.renderDirectoryListing(results)
    }

    this.setHeader('transfer-encoding', 'chunked')
    this.writeHeaders(200)
    this.writeChunk(WSC.template_data)
    let html = ['<script>start("current directory...")</script>',
      '<script>addRow("..","..",1,"170 B","10/ 2 / 15, 8:32:45 PM");</script>']

    for (let i = 0; i < results.length; i++) {
      let rawname = results[i].name
      let name = encodeURIComponent(results[i].name)
      let isdirectory = results[i].isDirectory
      let filesize = '';
      //let modified = '10/13/15, 10:38:40 AM'
      let modified = '';
      // raw, urlencoded, isdirectory, size,
      html.push(`<script>addRow('${rawname}','${name}','${isdirectory}','${filesize}',${modified}');</script>`)
    }
    let data: string | ArrayBuffer = html.join('\n')
    data = new TextEncoder('utf-8').encode(data).buffer
    this.writeChunk(data)
    this.request.connection.write(WSC.str2ab('0\r\n\r\n'))
    this.finish()
  }
  renderDirectoryListing(results) {
    let html = ['<html>']
    html.push('<style>li.directory {background:#aab}</style>')
    html.push('<a href=".. / ? static = 1 ">parent</a>')
    html.push('<ul>')
    results.sort(this.entriesSortFunc)

    // TODO -- add sorting (by query parameter?) show file size?

    for (let i = 0; i < results.length; i++) {
      let name = escape(results[i].name)
      if (results[i].isDirectory) {
        html.push('<li class="directory"><a href="' + name + ' / ? static = 1 ">' + name + '</a></li>')
      } else {
        html.push('<li><a href="' + name + ' ? static = 1 ">' + name + '</a></li>')
      }
    }
    html.push('</ul></html>')
    this.setHeader('content-type', 'text/html; charset=utf-8')
    this.write(html.join('\n'), undefined, undefined)
  }
  onReadEntry(evt) {
    if (evt.type === 'error') {
      console.error('error reading', evt.target.error);
      // clear this file from cache...
      WSC.entryFileCache.unset(this.entry.filesystem.name + '/' + this.entry.fullPath);
      this.request.connection.close();
    } else {
      // set mime types etc?
      this.write(evt.target.result, undefined, undefined);
    }
  }
}


export class DefaultHandler extends BaseHandler {
  constructor (
    public request: HTTPRequest
  ) {
    super();
  }
}
