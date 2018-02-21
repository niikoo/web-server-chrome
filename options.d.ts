import { RequestHandler } from './handlers';
export declare class WSCOptions {
    auth: any;
    entry: any;
    handlers: [string | RegExp, () => RequestHandler][];
    host: string;
    optAllInterfaces: boolean;
    optAutoStart: boolean;
    optBackground: boolean;
    optCORS: boolean;
    optDebug: boolean;
    optDoPortMapping: boolean;
    optIPV6: boolean;
    optModRewriteEnable: boolean;
    optModRewriteNegate: boolean;
    optModRewriteRegexp: string | RegExp;
    optModRewriteTo: string;
    optPreventSleep: boolean;
    optRenderIndex: boolean;
    optRetryInterfaces: boolean;
    optStatic: boolean;
    optStopIdleServer: boolean;
    optTryOtherPorts: boolean;
    optUpload: boolean;
    optVerbose: boolean;
    port: number;
    retainStr: any;
}
