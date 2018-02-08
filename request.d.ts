import { HTTPConnection } from './connection';
export declare class HTTPRequest {
    method: any;
    uri: any;
    version: any;
    connection: HTTPConnection;
    headers: any;
    body: any;
    bodyparams: any;
    arguments: {
        static: any;
        json: any;
        url: any;
    };
    path: any;
    origpath: any;
    constructor(opts: any);
    isKeepAlive(): boolean;
}
