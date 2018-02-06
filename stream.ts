/// <reference path="./../../node_modules/@types/chrome/index.d.ts" />
/// <reference path="./../../node_modules/@types/chrome/chrome-app.d.ts" />
/// <reference path="./../../node_modules/@types/chrome/chrome-webview.d.ts" />
import { WSC } from './common';
import { Buffer } from "./buffer";

export class IOStream {
  readCallback = null
  readUntilDelimiter = null
  readBuffer = new Buffer()
  writeBuffer = new Buffer()
  writing = false
  pleaseReadBytes = null

  request;
  onread;

  remoteclosed = false
  closed = false
  connected = true

  halfclose = null
  onclose = null
  ondata = null
  source = null
  _close_callbacks = []
  onWriteBufferEmpty = null

  onTCPReceive(info) {
    var sockId = info.socketId
    if (WSC.peerSockMap[sockId]) {
      WSC.peerSockMap[sockId].onReadTCP(info)
    }
  }
  constructor (
    public sockId
  ) {
    chrome.sockets.tcp.onReceive.addListener(this.onTCPReceive);
    chrome.sockets.tcp.onReceiveError.addListener(this.onTCPReceive);
    WSC.peerSockMap[this.sockId] = this;
    chrome.sockets.tcp.setPaused(this.sockId, false, this.onUnpaused.bind(this))
  }

  set_close_callback(fn) {
    this._close_callbacks = [fn]
  }
  set_nodelay() {
    chrome.sockets.tcp.setNoDelay(this.sockId, true, function () { })
  }
  removeHandler() {
    delete WSC.peerSockMap[this.sockId]
  }
  addCloseCallback(cb) {
    this._close_callbacks.push(cb)
  }
  peekstr(maxlen) {
    return WSC.ui82str(new Uint8Array(this.readBuffer.deque[0], 0, maxlen), undefined)
  }
  removeCloseCallback(cb) {
    debugger
  }
  runCloseCallbacks() {
    for (var i = 0; i < this._close_callbacks.length; i++) {
      this._close_callbacks[i](this)
    }
    if (this.onclose) { this.onclose() }
  }
  onUnpaused(info) {
    var lasterr = chrome.runtime.lastError
    if (lasterr) {
      this.close('set unpause fail')
    }
    //console.log('sock unpaused',info)
  }
  readUntil(delimiter, callback) {
    this.readUntilDelimiter = delimiter
    this.readCallback = callback
    this.checkBuffer()
  }

  readBytes(numBytes, callback) {
    this.pleaseReadBytes = numBytes
    this.readCallback = callback
    this.checkBuffer()
  }

  tryWrite(callback) {
    if (this.writing) {
      //console.warn('already writing..');
      return
    }
    if (this.closed) {
      console.warn(this.sockId, 'cant write, closed');
      return
    }
    //console.log('tryWrite')
    this.writing = true
    let data = this.writeBuffer.consume_any_max(4096);
    if (WSC.DEBUG) {
      console.log(this.sockId, 'tcp.send', data.byteLength)
      console.log(this.sockId, 'tcp.send', WSC.ui82str(new Uint8Array(data), 0));
    }
    chrome.sockets.tcp.send(this.sockId, <ArrayBuffer>data, this.onWrite.bind(this, callback))
  }
  write(data) {
    this.writeBuffer.add(data)
    this.tryWrite(undefined)
  }
  onWrite(callback, evt) {
    var err = chrome.runtime.lastError
    if (err) {
      //console.log('socket.send lastError',err)
      //this.tryClose()
      this.close('writeerr' + err)
      return
    }

    // look at evt!
    if (evt.bytesWritten <= 0) {
      //console.log('onwrite fail, closing',evt)
      this.close('writerr<0')
      return
    }
    this.writing = false
    if (this.writeBuffer.size() > 0) {
      //console.log('write more...')
      if (this.closed) {
      } else {
        this.tryWrite(callback)
      }
    } else {
      if (this.onWriteBufferEmpty) { this.onWriteBufferEmpty(); }
    }
  }
  onReadTCP(evt) {
    var lasterr = chrome.runtime.lastError
    if (lasterr) {
      this.close('read tcp lasterr' + lasterr)
      return
    }
    //console.log('onRead',WSC.ui82str(new Uint8Array(evt.data)))
    if (evt.resultCode == 0) {
      //this.error({message:'remote closed connection'})
      console.log('remote closed connection (halfduplex)')
      this.remoteclosed = true
      if (this.halfclose) { this.halfclose() }
      if (this.request) {
        // do we even have a request yet? or like what to do ...
      }
    } else if (evt.resultCode < 0) {
      console.log('remote killed connection', evt.resultCode)
      this.error({ message: 'error code', errno: evt.resultCode })
    } else {
      this.readBuffer.add(evt.data)
      if (this.onread) { this.onread() }
      this.checkBuffer()
    }
  }
  log(msg, msg2, msg3) {
    if (WSC.VERBOSE) {
      console.log(this.sockId, msg, msg2, msg3)
    }
  }
  checkBuffer() {
    //console.log('checkBuffer')
    if (this.readUntilDelimiter) {
      var buf = this.readBuffer.flatten()
      var str = WSC.arrayBufferToString(buf)
      var idx = str.indexOf(this.readUntilDelimiter)
      if (idx != -1) {
        var callback = this.readCallback
        var toret = this.readBuffer.consume(idx + this.readUntilDelimiter.length)
        this.readUntilDelimiter = null
        this.readCallback = null
        callback(toret)
      }
    } else if (this.pleaseReadBytes !== null) {
      if (this.readBuffer.size() >= this.pleaseReadBytes) {
        var data = this.readBuffer.consume(this.pleaseReadBytes)
        var callback = this.readCallback
        this.readCallback = null
        this.pleaseReadBytes = null
        callback(data)
      }
    }
  }
  close(reason = undefined) {
    if (this.closed) { return }
    this.connected = false
    this.closed = true
    this.runCloseCallbacks()
    //console.log('tcp sock close',this.sockId)
    delete WSC.peerSockMap[this.sockId]
    chrome.sockets.tcp.close(this.sockId, this.onClosed.bind(this, reason))
    //this.sockId = null
    this.cleanup()
  }
  onClosed(reason, info) {
    var lasterr = chrome.runtime.lastError
    if (lasterr) {
      console.log('onClosed', reason, lasterr, info)
    } else {
      //console.log('onClosed',reason,info)
    }
  }
  error(data) {
    console.warn(this.sockId, 'closed')
    //console.error(this,data)
    // try close by writing 0 bytes
    if (!this.closed) {
      this.close()
    }
  }
  checkedCallback(callback) {
    var err = chrome.runtime.lastError;
    if (err) {
      console.warn('socket callback lastError', err, callback)
    }
  }
  tryClose(callback) {
    if (!callback) { callback = this.checkedCallback }
    if (!this.closed) {
      console.warn('cant close, already closed')
      this.cleanup()
      return
    }
    console.log(this.sockId, 'tryClose')
    chrome.sockets.tcp.send(this.sockId, new ArrayBuffer(256), callback)
  }
  cleanup() {
    this.writeBuffer = new Buffer()
  }
}
