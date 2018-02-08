import { HTTPRequest } from './request';
import { BaseHandler, FileSystem } from './webapp';
export declare type RequestHandler = ProxyHandler | DirectoryEntryHandler | DefaultHandler;
export declare function getEntryFile(entry: any, callback: any): void;
export declare class ProxyHandler extends BaseHandler {
    validator: any;
    request: HTTPRequest;
    constructor(validator: any, request: HTTPRequest);
    parse(validator: any, request: HTTPRequest): this;
    get(): void;
    onfetched(evt: any): void;
}
export declare class DirectoryEntryHandler extends BaseHandler {
    fs: FileSystem;
    request: HTTPRequest;
    debugInterval: any;
    entry: any;
    file: any;
    readChunkSize: number;
    fileOffset: number;
    fileEndOffset: number;
    opts: {
        optUpload: boolean;
    };
    bodyWritten: number;
    responseLength: number;
    isDirectoryListing: boolean;
    constructor(fs: FileSystem, request: HTTPRequest);
    onClose(): void;
    debug(): void;
    head(): void;
    setOpts(opts: any): void;
    put(): void;
    onPutEntry(entry: any): void;
    onPutFolder(filename: any, folder: any): void;
    get(): void;
    doReadChunk(): void;
    onWriteBufferEmpty(): void;
    onReadChunk(evt: any): void;
    onEntry(entry: any): void;
    renderFileContents(entry: any, file: any): void;
    entriesSortFunc(a: any, b: any): any;
    renderDirectoryListingJSON(results: any): void;
    renderDirectoryListingTemplate(results: any): void;
    renderDirectoryListing(results: any): void;
    onReadEntry(evt: any): void;
}
export declare class DefaultHandler extends BaseHandler {
    request: HTTPRequest;
    constructor(request: HTTPRequest);
}
