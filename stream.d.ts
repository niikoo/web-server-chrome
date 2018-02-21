/// <reference path="../../node_modules/@types/chrome/index.d.ts" />
/// <reference path="../../node_modules/@types/chrome/chrome-app.d.ts" />
/// <reference path="../../node_modules/@types/chrome/chrome-webview.d.ts" />
import { Destructor } from './destructor';
import { Buffer } from './buffer';
export declare class IOStream implements Destructor {
    sockId: any;
    readonly streamID: string;
    readCallback: any;
    readUntilDelimiter: any;
    readBuffer: Buffer;
    writeBuffer: Buffer;
    writing: boolean;
    pleaseReadBytes: any;
    request: any;
    onread: any;
    remoteclosed: boolean;
    closed: boolean;
    connected: boolean;
    halfclose: any;
    onclose: any;
    ondata: any;
    source: any;
    _close_callbacks: any[];
    onWriteBufferEmpty: any;
    onTCPReceive(info: any): void;
    constructor(sockId: any);
    onDestroy(): void;
    set_close_callback(fn: any): void;
    set_nodelay(): void;
    removeHandler(): void;
    addCloseCallback(cb: any): void;
    peekstr(maxlen: any): string;
    removeCloseCallback(cb: any): void;
    runCloseCallbacks(): void;
    onUnpaused(info: any): void;
    readUntil(delimiter: any, callback: any): void;
    readBytes(numBytes: any, callback: any): void;
    tryWrite(callback: any): void;
    write(data: any): void;
    onWrite(callback: any, evt: any): void;
    onReadTCP(evt: any): void;
    log(...msg: any[]): void;
    debug(...msg: any[]): void;
    checkBuffer(): void;
    close(reason?: any): void;
    onClosed(reason: any, info: any): void;
    error(data: any): void;
    checkedCallback(callback: any): void;
    tryClose(callback: any): void;
    cleanup(): void;
}
