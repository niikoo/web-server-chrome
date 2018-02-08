import { Destructor } from './destructor';
export declare class UPNP implements Destructor {
    port: number;
    name: string;
    searchtime: number;
    ssdp: SSDP;
    callback: any;
    desiredServices: string[];
    devices: any;
    validGateway: any;
    interfaces: any;
    mapping: any;
    searching: boolean;
    constructor(opts: any);
    flatParseNode(node: any): {};
    allDone(result: any): void;
    onDestroy(): void;
    getInternalAddress(): boolean;
    reset(callback: any): void;
    onSearchStop(info: any): void;
    onDevice(info: any): void;
    getWANServiceInfo(): any[];
    addMapping(port: any, prot: any, callback: any): void;
    removeMapping(port: any, prot: any, callback: any): void;
    changeMapping(port: any, prot: any, enabled: any, callback: any): void;
    getMappings(callback: any): void;
    getIP(callback: any): void;
}
export declare class GatewayDevice {
    info: any;
    description_url: any;
    url: any;
    services: any[];
    devices: any[];
    attributes: any;
    externalIP: any;
    constructor(info: any);
    runService(service: any, command: any, args: any, callback: any): void;
    getDescription(callback: any): void;
    getService(desired: any): any[];
}
export declare class SSDP {
    private upnp;
    port: number;
    wantUDP: boolean;
    searchtime: any;
    multicast: string;
    ssdpPort: number;
    boundPort: any;
    searchdevice: string;
    _onReceive: () => void;
    sockMap: {};
    lastError: any;
    searching: boolean;
    _event_listeners: {};
    constructor(upnp: UPNP, opts: any);
    addEventListener(name: any, callback: any): void;
    trigger(name: any, data: any): void;
    onReceive(result: any): void;
    error(data: any): void;
    cleanup(): void;
    stopsearch(): void;
    search(opts: any): void;
    onbound(state: any, result: any): void;
    onInfo(state: any, info: any): void;
    onjoined(state: any, result: any): void;
    onsend(result: any): void;
}
