// Global type declarations for Node.js environment
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: string;
      MONGODB_URI: string;
      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;
      [key: string]: string | undefined;
    }

    interface Process {
      env: ProcessEnv;
      exit(code?: number): never;
      cwd(): string;
      pid: number;
      memoryUsage(): { rss: number; heapUsed: number; heapTotal: number; external: number };
      uptime(): number;
      hrtime(time?: [number, number]): [number, number];
      on(event: string, listener: (...args: any[]) => void): Process;
    }

    interface Timeout {}
  }

  var process: NodeJS.Process;
  var Buffer: {
    new (size: number): Buffer;
    new (array: Uint8Array): Buffer;
    new (arrayBuffer: ArrayBuffer): Buffer;
    new (buffer: Buffer): Buffer;
    new (string: string, encoding?: string): Buffer;
    alloc(size: number, fill?: string | Buffer | number, encoding?: string): Buffer;
    allocUnsafe(size: number): Buffer;
    allocUnsafeSlow(size: number): Buffer;
    byteLength(string: string, encoding?: string): number;
    compare(buf1: Buffer, buf2: Buffer): number;
    concat(list: Buffer[], totalLength?: number): Buffer;
    from(arrayBuffer: ArrayBuffer, byteOffset?: number, length?: number): Buffer;
    from(data: number[]): Buffer;
    from(data: Uint8Array): Buffer;
    from(str: string, encoding?: string): Buffer;
    isBuffer(obj: any): obj is Buffer;
    isEncoding(encoding: string): boolean;
  };
  var console: Console;
  var require: any;
  
  function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
  function clearTimeout(timeoutId: NodeJS.Timeout): void;
  function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;

  interface ErrorConstructor {
    captureStackTrace(thisArg: any, func: any): void;
  }

  interface Buffer {
    length: number;
    toString(encoding?: string, start?: number, end?: number): string;
    toJSON(): { type: 'Buffer'; data: number[] };
    equals(otherBuffer: Buffer): boolean;
    compare(otherBuffer: Buffer, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number;
    copy(targetBuffer: Buffer, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
    slice(start?: number, end?: number): Buffer;
    writeUIntLE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
    writeUIntBE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
    writeIntLE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
    writeIntBE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
    readUIntLE(offset: number, byteLength: number, noAssert?: boolean): number;
    readUIntBE(offset: number, byteLength: number, noAssert?: boolean): number;
    readIntLE(offset: number, byteLength: number, noAssert?: boolean): number;
    readIntBE(offset: number, byteLength: number, noAssert?: boolean): number;
    readUInt8(offset: number, noAssert?: boolean): number;
    readUInt16LE(offset: number, noAssert?: boolean): number;
    readUInt16BE(offset: number, noAssert?: boolean): number;
    readUInt32LE(offset: number, noAssert?: boolean): number;
    readUInt32BE(offset: number, noAssert?: boolean): number;
    readInt8(offset: number, noAssert?: boolean): number;
    readInt16LE(offset: number, noAssert?: boolean): number;
    readInt16BE(offset: number, noAssert?: boolean): number;
    readInt32LE(offset: number, noAssert?: boolean): number;
    readInt32BE(offset: number, noAssert?: boolean): number;
    readFloatLE(offset: number, noAssert?: boolean): number;
    readFloatBE(offset: number, noAssert?: boolean): number;
    readDoubleLE(offset: number, noAssert?: boolean): number;
    readDoubleBE(offset: number, noAssert?: boolean): number;
    reverse(): this;
    swap16(): Buffer;
    swap32(): Buffer;
    swap64(): Buffer;
    writeUInt8(value: number, offset: number, noAssert?: boolean): number;
    writeUInt16LE(value: number, offset: number, noAssert?: boolean): number;
    writeUInt16BE(value: number, offset: number, noAssert?: boolean): number;
    writeUInt32LE(value: number, offset: number, noAssert?: boolean): number;
    writeUInt32BE(value: number, offset: number, noAssert?: boolean): number;
    writeInt8(value: number, offset: number, noAssert?: boolean): number;
    writeInt16LE(value: number, offset: number, noAssert?: boolean): number;
    writeInt16BE(value: number, offset: number, noAssert?: boolean): number;
    writeInt32LE(value: number, offset: number, noAssert?: boolean): number;
    writeInt32BE(value: number, offset: number, noAssert?: boolean): number;
    writeFloatLE(value: number, offset: number, noAssert?: boolean): number;
    writeFloatBE(value: number, offset: number, noAssert?: boolean): number;
    writeDoubleLE(value: number, offset: number, noAssert?: boolean): number;
    writeDoubleBE(value: number, offset: number, noAssert?: boolean): number;
    fill(value: any, offset?: number, end?: number): this;
    indexOf(value: string | number | Buffer, byteOffset?: number, encoding?: string): number;
    lastIndexOf(value: string | number | Buffer, byteOffset?: number, encoding?: string): number;
    includes(value: string | number | Buffer, byteOffset?: number, encoding?: string): boolean;
    [index: number]: number;
  }
}

// Node.js built-in modules
declare module 'cluster' {
  export const isMaster: boolean;
  export const isWorker: boolean;
  export const worker: any;
  export function fork(): any;
  export function on(event: string, listener: (...args: any[]) => void): any;
}

declare module 'os' {
  export function cpus(): any[];
  export function platform(): string;
  export function arch(): string;
  export function release(): string;
  export function hostname(): string;
}

declare module 'stream' {
  export class Readable {
    constructor(options?: any);
    push(chunk: any): boolean;
    _read(): void;
    pipe(destination: any, options?: any): any;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }
  
  export class Writable {
    constructor(options?: any);
    write(chunk: any, encoding?: string, callback?: Function): boolean;
    end(chunk?: any, encoding?: string, callback?: Function): void;
    _write(chunk: any, encoding: string, callback: Function): void;
  }
}

declare module 'crypto' {
  export function randomBytes(size: number): Buffer;
  export function createHash(algorithm: string): {
    update(data: string | Buffer): any;
    digest(encoding?: string): string | Buffer;
  };
  export function createHmac(algorithm: string, key: string | Buffer): {
    update(data: string | Buffer): any;
    digest(encoding?: string): string | Buffer;
  };
}

declare module 'perf_hooks' {
  export const performance: {
    now(): number;
    mark(name: string): void;
    measure(name: string, startMark?: string, endMark?: string): void;
  };
}

// Express and related modules
declare module 'express' {
  export interface Request {
    user?: any;
    correlationId?: string;
    body?: any;
    params?: any;
    query?: any;
    headers?: any;
    method?: string;
    url?: string;
    path?: string;
    [key: string]: any;
  }
  
  export interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(body?: any): Response;
    cookie(name: string, value: any, options?: any): Response;
    clearCookie(name: string, options?: any): Response;
    redirect(url: string): Response;
    render(view: string, locals?: any, callback?: Function): Response;
    [key: string]: any;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Application {
    use(...args: any[]): Application;
    get(...args: any[]): Application;
    post(...args: any[]): Application;
    put(...args: any[]): Application;
    delete(...args: any[]): Application;
    patch(...args: any[]): Application;
    listen(...args: any[]): any;
    set(setting: string, val: any): Application;
    [key: string]: any;
  }
  
  export interface Router {
    use(...args: any[]): Router;
    get(...args: any[]): Router;
    post(...args: any[]): Router;
    put(...args: any[]): Router;
    delete(...args: any[]): Router;
    patch(...args: any[]): Router;
    [key: string]: any;
  }
  
  export interface Express {
    (): Application;
    json(options?: any): any;
    urlencoded(options?: any): any;
    static(root: string, options?: any): any;
    Router(): Router;
  }
  
  declare const express: Express;
  export = express;
}

declare module 'cors' {
  export interface CorsOptions {
    origin?: any;
    credentials?: boolean;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    [key: string]: any;
  }
  
  declare function cors(options?: CorsOptions): any;
  export = cors;
}

declare module 'compression' {
  export interface CompressionFunction {
    (options?: any): any;
    filter(req: any, res: any): boolean;
  }
  
  declare const compression: CompressionFunction;
  export = compression;
}

declare module 'morgan' {
  export interface MorganFunction {
    (format: string, options?: any): any;
    token(name: string, fn: (req: any, res?: any) => string): void;
  }
  
  declare const morgan: MorganFunction;
  export = morgan;
}

declare module 'helmet' {
  declare function helmet(options?: any): any;
  export = helmet;
}

declare module 'hpp' {
  declare function hpp(options?: any): any;
  export = hpp;
}

declare module 'swagger-ui-express' {
  export function setup(swaggerDoc: any, options?: any): any;
  export function serve(...args: any[]): any;
}

declare module 'cookie-parser' {
  declare function cookieParser(secret?: string, options?: any): any;
  export = cookieParser;
}

declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>;
  }
  
  export function createTransporter(options: any): Transporter;
  export function createTransport(options: any): Transporter;
}

// Authentication and security modules
declare module 'bcrypt' {
  export function hash(data: string, saltOrRounds: number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
  export function hashSync(data: string, saltOrRounds: number): string;
  export function compareSync(data: string, encrypted: string): boolean;
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }
  
  export function sign(payload: object, secretOrPrivateKey: string, options?: any): string;
  export function verify(token: string, secretOrPublicKey: string, options?: any): JwtPayload | string;
  export class JsonWebTokenError extends Error {}
  export class TokenExpiredError extends Error {}
  export class NotBeforeError extends Error {}
}

// File upload
declare module 'multer' {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }
  
  export interface Options {
    storage?: any;
    dest?: string;
    limits?: any;
    fileFilter?: (req: any, file: File, cb: (error: Error | null, acceptFile: boolean) => void) => void;
    [key: string]: any;
  }
  
  export interface Multer {
    (options?: Options): any;
    memoryStorage(): any;
    diskStorage(options?: any): any;
  }
  
  declare const multer: Multer;
  export = multer;
}

// Mongoose types
declare module 'mongoose' {
  export interface ConnectOptions {
    [key: string]: any;
  }
  
  export interface Connection {
    on(event: string, listener: (...args: any[]) => void): Connection;
    once(event: string, listener: (...args: any[]) => void): Connection;
    readyState: number;
    [key: string]: any;
  }
  
  export function connect(uri: string, options?: any): Promise<any>;
  export const connection: Connection;
  export class Schema {
    constructor(definition?: any, options?: any);
    [key: string]: any;
  }
  export function model(name: string, schema?: Schema): any;
}

export {};