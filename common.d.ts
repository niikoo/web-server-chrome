import { DirectoryEntryHandler } from './handlers';
import { WebApplication } from './webapp';
import { EntryCache } from "./entrycache";
export declare class WSC {
    static DEBUG: boolean;
    static VERBOSE: boolean;
    static peerSockMap: {};
    static app: {
        opts: {
            optStatic: any;
            optRenderIndex: any;
            optAllInterfaces: any;
            optModRewriteEnable: boolean;
            optModRewriteNegate: boolean;
            optModRewriteRegexp: boolean;
            optModRewriteTo: any;
            optPreventSleep: any;
            optStopIdleServer: any;
            optDoPortMapping: any;
            optBackground: any;
            optTryOtherPorts: boolean;
            optCORS: any;
            optIPV6: any;
            host: any;
            auth: any;
        };
    };
    static template_data: any;
    static entryCache: EntryCache;
    static entryFileCache: EntryCache;
    static WebApplication: typeof WebApplication;
    static DirectoryEntryHandler: typeof DirectoryEntryHandler;
    static FileSystem: any;
    static prepareHandler(handler: any, ...params: any[]): () => any;
    static outpush(arg0: any): any;
    static getchromeversion(): any;
    static maybePromise(maybePromiseObj: any, resolveFn: any, ctx: any): any;
    static strformat(s: any): any;
    static parse_header(line: any): void;
    static encode_header(name: any, d: any): any;
    static recursiveGetEntry(filesystem: any, path: any, callback: any, allowFolderCreation: any): void;
    static parseHeaders(lines: any): {};
    static ui82str(arr: any, startOffset: any): string;
    static ui82arr(arr: any, startOffset: any): any[];
    static str2ab(s: any): ArrayBuffer;
    static stringToUint8Array: (string: any) => any;
    static arrayBufferToString: (buffer: any) => any;
    static parseUri(str: any): URL;
}
