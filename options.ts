import { RequestHandler } from './handlers';

export class WSCOptions {
  auth: any;
  entry: any = undefined;
  handlers: [string | RegExp, () => RequestHandler][] = [];
  host: string = '127.0.0.1';
  optAllInterfaces: boolean = false;
  optAutoStart: boolean = false;
  optBackground: boolean = false;
  optCORS: boolean = false;
  optDebug: boolean = false;
  optDoPortMapping: boolean = false;
  optIPV6: boolean = false;
  optModRewriteEnable: boolean = false;
  optModRewriteNegate: boolean = true;
  optModRewriteRegexp: string | RegExp = /.*\\.[\\d\\w]+$/;
  optModRewriteTo: string = '/index.html';
  optPreventSleep: boolean = false;
  optRenderIndex: boolean = true;
  optRetryInterfaces: boolean = true;
  optStatic: boolean = false;
  optStopIdleServer: boolean = false;
  optTryOtherPorts: boolean = false;
  optUpload: boolean = false;
  optVerbose: boolean = false;
  port: number = 8887;
  performance = {
    /**
     * @description Duplicator - multiply buffer by this
     */
    bufferIncrease: 128
  };
  retainStr: any = undefined;
}
