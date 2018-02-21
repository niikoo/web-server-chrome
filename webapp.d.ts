/// <reference path="../../node_modules/@types/chrome/index.d.ts" />
/// <reference path="../../node_modules/@types/chrome/chrome-app.d.ts" />
/// <reference path="../../node_modules/@types/chrome/chrome-webview.d.ts" />
import { WSCOptions } from './options';
import { Destructor } from './destructor';
import { HTTPRequest } from './request';
import { UPNP } from './upnp';
import { IOStream } from './stream';
export declare class WebApplication implements Destructor {
    id: string;
    opts: WSCOptions;
    handlers: any[];
    sockInfo: any;
    lasterr: any;
    stopped: any;
    starting: any;
    start_callback: any;
    _stop_callback: any;
    started: any;
    fs: any;
    streams: any;
    upnp: UPNP;
    sockets: typeof chrome.sockets;
    host: string;
    port: number;
    _idle_timeout_id: any;
    on_status_change: any;
    interfaces: any[];
    interface_retry_count: number;
    urls: any[];
    extra_urls: any;
    acceptQueue: any;
    handlersMatch: [RegExp, any][];
    constructor(opts: WSCOptions);
    onDestroy(): void;
    processAcceptQueue(): void;
    updateOption(k: any, v: any): void;
    get_info(): {
        interfaces: any[];
        urls: any[];
        opts: WSCOptions;
        started: any;
        starting: any;
        stopped: any;
        lasterr: any;
    };
    updatedSleepSetting(): void;
    on_entry(entry: any): void;
    get_host(): any;
    add_handler(handler: any): void;
    init_handlers(): void;
    change(): void;
    start_success(data: any): void;
    error(data: any): void;
    stop(reason: any, callback: any): void;
    onClose(reason: any, info: any): void;
    onDisconnect(reason: any, info: any): void;
    onStreamClose(stream: IOStream): void;
    clearIdle(): void;
    registerIdle(): void;
    checkIdle(): void;
    start(callback: any): void;
    startOnInterfaces(): void;
    onListenPortReady(info: any): void;
    onPortmapResult(result: any): void;
    onReady(): void;
    init_urls(): any[];
    computePortRetry(i: any): number;
    tryListenOnPort(state: any, callback: any): void;
    doTryListenOnPort(state: any, callback: any): void;
    onServerSocket(state: any, callback: any, sockInfo: any): void;
    getInterfaces(state: any, callback: any): void;
    refreshNetworkInterfaces(callback: any): void;
    ensureFirewallOpen(): void;
    bindAcceptCallbacks(): void;
    onAcceptError(acceptInfo: chrome.sockets.tcpServer.AcceptErrorEventArgs): void;
    onAccept(acceptInfo: chrome.sockets.tcpServer.AcceptEventArgs): void;
    adopt_stream(acceptInfo: any, stream: any): void;
    onRequest(stream: any, connection: any, request: any): void;
}
export declare abstract class BaseHandler {
    VERBOSE: boolean;
    DEBUG: boolean;
    beforefinish: any;
    headersWritten: boolean;
    responseCode: any;
    responseHeaders: {};
    responseData: any[];
    responseLength: any;
    rewriteTo: string;
    isDirectoryListing: boolean;
    beforeFinish: any;
    abstract request: HTTPRequest;
    options(): void;
    setCORS(): void;
    get_argument(key: any, def: any): any;
    getHeader(k: any, defaultvalue: any): any;
    setHeader(k: any, v: any): void;
    set_status(code: any): void;
    writeHeaders(code?: any, callback?: any): void;
    writeChunk(data: any): void;
    write(data: any, code: any, opt_finish?: boolean): void;
    finish(): void;
}
export declare class FileSystem {
    entry: any;
    constructor(entry: any);
    getByPath(path: string, callback: any, allowFolderCreation?: boolean): void;
}
