/// <reference types="filesystem" />
import { WSCOptions } from './options';
import { DirectoryEntryHandler } from './handlers';
import { WebApplication, FileSystem } from './webapp';
import { EntryCache } from './entrycache';
export { FileSystem };
export declare class WSC {
    static DEBUG: boolean;
    static VERBOSE: boolean;
    static peerSockMap: {};
    static app: {
        opts: WSCOptions;
    };
    static template_data: any;
    static entryCache: EntryCache;
    static entryFileCache: EntryCache;
    static WebApplication: typeof WebApplication;
    static DirectoryEntryHandler: typeof DirectoryEntryHandler;
    static FileSystem: typeof FileSystem;
    static prepareHandler(handler: any, ...params: any[]): () => any;
    static prepareTypedHandler<T>(handler: any, ...params: any[]): () => T;
    static outpush(arg0: any): any;
    static getchromeversion(): any;
    static maybePromise(maybePromiseObj: any, resolveFn: any, ctx: any): any;
    static strformat(s: any): any;
    static parse_header(line: any): void;
    static encode_header(name: any, d: any): any;
    static recursiveGetEntry(filesystem: DirectoryEntry, path: any, callback: any, allowFolderCreation: any): void;
    static onRecusionError(error: any): void;
    static recurse(entry: DirectoryEntry | FileEntry, data: {
        path;
        callback;
        useCache;
        allowFolderCreation;
        state;
        cacheKey;
    }): void;
    static parseHeaders(lines: any): {};
    static ui82str(arr: any, startOffset: any): string;
    static ui82arr(arr: any, startOffset: any): any[];
    static str2ab(s: any): ArrayBuffer;
    static stringToUint8Array: (string: any) => any;
    static arrayBufferToString: (buffer: any) => any;
    static parseUri(str: any): URL;
}
export interface RecursionData {
    path: string[];
    state: {
        entry: DirectoryEntry | FileEntry;
        path: string;
    };
    useCache: boolean;
    cacheKey: string;
    callback: (entry: DirectoryEntry | FileEntry) => void;
    allowFolderCreation: boolean;
}
