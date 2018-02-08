import { IOStream } from './stream';
export declare class HTTPConnection {
    stream: IOStream;
    _DEBUG: boolean;
    readonly identifier: string;
    curRequest: any;
    closed: any;
    onRequestCallback: any;
    constructor(stream: IOStream);
    log(...msg: any[]): void;
    tryRead(): void;
    write(data: any, callback?: any): void;
    close(): void;
    addRequestCallback(cb: any): void;
    onHeaders(data: any): void;
    onRequestBody(body: any): void;
    onRequest(request: any): void;
}
