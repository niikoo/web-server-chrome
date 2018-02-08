/// <reference path="./../../node_modules/@types/chrome/index.d.ts" />
/// <reference path="./../../node_modules/@types/chrome/chrome-app.d.ts" />
/// <reference path="./../../node_modules/@types/chrome/chrome-webview.d.ts" />
import { Destructor } from './destructor';
import { WSC } from './common';
import { Buffer } from "./buffer";

export class IOStream implements Destructor {
  readonly streamID = ' <S#' + Math.floor(Math.random() * 100) + '>';
  readCallback = null;
  readUntilDelimiter = null;
  readBuffer = new Buffer();
  writeBuffer = new Buffer();
  writing = false;
  pleaseReadBytes = null;

  request;
  onread;

  remoteclosed = false;
  closed = false;
  connected = true;

  halfclose = null;
  onclose = null;
  ondata = null;
  source = null;
  _close_callbacks = [];
  onWriteBufferEmpty = null;

  onTCPReceive(info) {
    var sockId = info.socketId
    if (WSC.peerSockMap[sockId]) {
      WSC.peerSockMap[sockId].onReadTCP(info)
    }
  }
  constructor (
    public sockId
  ) {
    if (WSC.VERBOSE) console.info('New IOStream created with sockID:', sockId, );;
    chrome.sockets.tcp.onReceive.addListener(this.onTCPReceive);
    chrome.sockets.tcp.onReceiveError.addListener(this.onTCPReceive);
    WSC.peerSockMap[this.sockId] = this;
    chrome.sockets.tcp.setPaused(this.sockId, false, this.onUnpaused.bind(this))
  }

  onDestroy() {
    chrome.sockets.tcp.onReceive.removeListener(() => { });
    chrome.sockets.tcp.onReceiveError.removeListener(() => { });
    WSC.peerSockMap[this.sockId] = null;
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
      this.close('set unpause fail');
    }
    this.log('sock unpaused', info);
  }
  readUntil(delimiter, callback) {
    this.debug('Read Until registered with', delimiter, callback);
    this.readUntilDelimiter = delimiter;
    this.readCallback = callback;
    this.checkBuffer();
  }

  readBytes(numBytes, callback) {
    this.debug('Read bytes registered with', numBytes, callback);
    this.pleaseReadBytes = numBytes;
    this.readCallback = callback;
    this.checkBuffer();
  }

  tryWrite(callback) {
    if (this.writing) {
      // console.warn('already writing..');
      return
    }
    if (this.closed) {
      console.warn(this.sockId, 'cant write, closed');
      return
    }
    this.log('tryWrite');
    this.writing = true
    let data = this.writeBuffer.consume_any_max(4096);
    if (WSC.VERBOSE) {
      this.debug(this.sockId, 'tcp.send', data.byteLength);
      this.debug(this.sockId, 'tcp.send', WSC.ui82str(new Uint8Array(data), 0));
    }
    chrome.sockets.tcp.send(this.sockId, <ArrayBuffer>data, (sendInfo) => this.onWrite(callback, sendInfo))
  }
  write(data) {
    this.writeBuffer.add(data)
    this.tryWrite(undefined)
  }
  onWrite(callback, evt) {
    var err = chrome.runtime.lastError
    if (err) {
      this.log('socket.send lastError', err);
      // this.tryClose()
      this.close('writeerr' + err)
      return
    }

    // look at evt!
    if (evt.bytesWritten <= 0) {
      this.log('onwrite fail, closing', evt);
      this.close('writerr<0')
      return
    }
    this.writing = false
    if (this.writeBuffer.size() > 0) {
      this.log('write more...');
      if (this.closed) {
        this.debug('closed');
      } else {
        this.debug('write to try write with callback', callback);
        this.tryWrite(callback)
      }
    } else {
      this.debug('write, onWriteBufferEmpty! ', this.onWriteBufferEmpty);
      if (this.onWriteBufferEmpty) {
        this.onWriteBufferEmpty();
      } else {
        /*this.tryClose(() => {
          this.log('Socket closed :)');
        });
        delete WSC.peerSockMap[this.sockId];*/
      }
    }
  }
  onReadTCP(evt) {
    var lasterr = chrome.runtime.lastError
    if (lasterr) {
      this.close('read tcp lasterr' + lasterr + ' ')
      return
    }
    this.log('onRead', WSC.ui82str(new Uint8Array(evt.data), null));
    if (evt.resultCode == 0) {
      //this.error({message:'remote closed connection'})
      this.log('remote closed connection (halfduplex)');
      this.remoteclosed = true
      if (this.halfclose) { this.halfclose() }
      if (this.request) {
        this.log(this.request, evt);
        // do we even have a request yet? or like what to do ...
      }
    } else if (evt.resultCode < 0) {
      this.log('remote killed connection', evt.resultCode);
      this.error({ message: 'error code', errno: evt.resultCode })
    } else {
      this.readBuffer.add(evt.data)
      if (this.onread) { this.onread() }
      this.checkBuffer()
    }
  }
  log(...msg) {
    if (WSC.DEBUG) {
      console.log('[LOG]', this.sockId, ...msg, this.streamID);
    }
  }
  debug(...msg) {
    if (WSC.VERBOSE) {
      console.log('[DEBUG]', this.sockId, ...msg, this.streamID);
    }
  }
  checkBuffer() {
    this.log('checkBuffer');
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
        var data = this.readBuffer.consume(this.pleaseReadBytes);
        var callback = this.readCallback;
        this.readCallback = null;
        this.pleaseReadBytes = null;
        callback(data);
      }
    }
  }
  close(reason = undefined) {
    if (this.closed) { return; }
    this.connected = false;
    this.closed = true;
    this.runCloseCallbacks();
    this.log('tcp sock close', this.sockId);
    delete WSC.peerSockMap[this.sockId];
    chrome.sockets.tcp.close(this.sockId, this.onClosed.bind(this, reason));
    //this.sockId = null
    this.cleanup()
  }
  onClosed(reason, info) {
    var lasterr = chrome.runtime.lastError;
    if (lasterr) {
      this.log('onClosed', reason, lasterr, info);
    } else {
      this.log('onClosed', reason, info);
    }
  }
  error(data) {
    if (WSC.VERBOSE) {
      console.warn(this.sockId, 'closed');
      console.error(this, data);
    }
    chrome.sockets.tcp.getInfo(this.sockId, (socketInfo) => {
      this.log('SOCKET INFO AFTER ERROR', socketInfo, 'Chrome last error:', chrome.runtime.lastError);
    });
    // if (WSC.DEBUG) { debugger; }
    // try close by writing 0 bytes
    if (!this.closed) {
      this.close()
    }
  }
  checkedCallback(callback) {
    var err = chrome.runtime.lastError;
    if (err) {
      console.warn('socket callback lastError', err, callback, );
    }
  }
  tryClose(callback) {
    if (!callback) { callback = this.checkedCallback }
    if (!this.closed) {
      console.warn('cant close, already closed', );
      this.cleanup()
      return
    }
    this.log(this.sockId, 'tryClose');
    chrome.sockets.tcp.send(this.sockId, new ArrayBuffer(256), callback)
  }
  cleanup() {
    this.writeBuffer = new Buffer()
  }
}
