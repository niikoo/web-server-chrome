export declare class Buffer {
    private opts;
    max_buffer_size: number;
    _size: number;
    deque: any[];
    constructor(opts?: {});
    clear(): void;
    flatten(): any;
    add(data: any): void;
    consume_any_max(maxsz: any): ArrayBuffer;
    consume(sz: any, putback?: any): ArrayBuffer;
    size(): number;
}
