// Global type declarations for Node.js environment
declare global {
  namespace NodeJS {

    ;
      uptime(): number;
      hrtime(time: [number, number]): [number, number];
      on(event, listener: (...args) => void): Process;
    }

  }

  var process: NodeJS.Process;
  var Buffer: {
    new (size): Buffer;
    new (array): Buffer;
    new (arrayBuffer): Buffer;
    new (buffer): Buffer;
    new (string, encoding: string): Buffer;
    alloc(size, fill: string | Buffer | number, encoding: string): Buffer;
    allocUnsafe(size): Buffer;
    allocUnsafeSlow(size): Buffer;
    byteLength(string, encoding: string): number;
    compare(buf1, buf2): number;
    concat(list, totalLength: number): Buffer;
    from(arrayBuffer, byteOffset: number, length: number): Buffer;
    from(data): Buffer;
    from(data): Buffer;
    from(str, encoding: string): Buffer;
    isBuffer(obj): obj is Buffer;
    isEncoding(encoding): boolean;
  };
  var console: Console;
  var require: any;
  
  function setTimeout(callback: (...args) => void, ms, ...args): NodeJS.Timeout;
  function clearTimeout(timeoutId): void;
  function setInterval(callback: (...args) => void, ms, ...args): NodeJS.Timeout;

  ;
    equals(otherBuffer): boolean;
    compare(otherBuffer, targetStart: number, targetEnd: number, sourceStart: number, sourceEnd: number): number;
    copy(targetBuffer, targetStart: number, sourceStart: number, sourceEnd: number): number;
    slice(start: number, end: number): Buffer;
    writeUIntLE(value, offset, byteLength, noAssert: boolean): number;
    writeUIntBE(value, offset, byteLength, noAssert: boolean): number;
    writeIntLE(value, offset, byteLength, noAssert: boolean): number;
    writeIntBE(value, offset, byteLength, noAssert: boolean): number;
    readUIntLE(offset, byteLength, noAssert: boolean): number;
    readUIntBE(offset, byteLength, noAssert: boolean): number;
    readIntLE(offset, byteLength, noAssert: boolean): number;
    readIntBE(offset, byteLength, noAssert: boolean): number;
    readUInt8(offset, noAssert: boolean): number;
    readUInt16LE(offset, noAssert: boolean): number;
    readUInt16BE(offset, noAssert: boolean): number;
    readUInt32LE(offset, noAssert: boolean): number;
    readUInt32BE(offset, noAssert: boolean): number;
    readInt8(offset, noAssert: boolean): number;
    readInt16LE(offset, noAssert: boolean): number;
    readInt16BE(offset, noAssert: boolean): number;
    readInt32LE(offset, noAssert: boolean): number;
    readInt32BE(offset, noAssert: boolean): number;
    readFloatLE(offset, noAssert: boolean): number;
    readFloatBE(offset, noAssert: boolean): number;
    readDoubleLE(offset, noAssert: boolean): number;
    readDoubleBE(offset, noAssert: boolean): number;
    reverse(): this;
    swap16(): Buffer;
    swap32(): Buffer;
    swap64(): Buffer;
    writeUInt8(value, offset, noAssert: boolean): number;
    writeUInt16LE(value, offset, noAssert: boolean): number;
    writeUInt16BE(value, offset, noAssert: boolean): number;
    writeUInt32LE(value, offset, noAssert: boolean): number;
    writeUInt32BE(value, offset, noAssert: boolean): number;
    writeInt8(value, offset, noAssert: boolean): number;
    writeInt16LE(value, offset, noAssert: boolean): number;
    writeInt16BE(value, offset, noAssert: boolean): number;
    writeInt32LE(value, offset, noAssert: boolean): number;
    writeInt32BE(value, offset, noAssert: boolean): number;
    writeFloatLE(value, offset, noAssert: boolean): number;
    writeFloatBE(value, offset, noAssert: boolean): number;
    writeDoubleLE(value, offset, noAssert: boolean): number;
    writeDoubleBE(value, offset, noAssert: boolean): number;
    fill(value, offset: number, end: number): this;
    indexOf(value, byteOffset: number, encoding: string): number;
    lastIndexOf(value, byteOffset: number, encoding: string): number;
    includes(value, byteOffset: number, encoding: string): boolean;
    [index: number]: number;
  }
}

// Node.js built-in modules
declare module 'cluster' {
  const isMaster: boolean;
  const isWorker: boolean;
  const worker: any;
  function fork(): any;
  function on(event, listener: (...args) => void): any;
}

declare module 'os' {
  function cpus(): any[];
  function platform(): string;
  function arch(): string;
  function release(): string;
  function hostname(): string;
}

declare module 'stream' {
  class Readable {
    constructor(options: any);
    push(chunk): boolean;
    _read(): void;
    pipe(destination, options: any): any;
    on(event, listener: (...args) => void): this;
    once(event, listener: (...args) => void): this;
    emit(event, ...args): boolean;
  }
  
  class Writable {
    constructor(options: any);
    write(chunk, encoding: string, callback: Function): boolean;
    end(chunk: any, encoding: string, callback: Function): void;
    _write(chunk, encoding, callback): void;
  }
}

declare module 'crypto' {
  function randomBytes(size): Buffer;
  function createHash(algorithm){
    update(data): any;
    digest(encoding: string): string | Buffer;
  };
  function createHmac(algorithm, key){
    update(data): any;
    digest(encoding: string): string | Buffer;
  };
}

declare module 'perf_hooks' {
  const performance: {
    now(): number;
    mark(name): void;
    measure(name, startMark: string, endMark: string): void;
  };
}

// Express and related modules
declare module 'express' {

  declare const express: Express;
  export = express;
}

declare module 'cors' {

  declare function cors(options: CorsOptions): any;
  export = cors;
}

declare module 'compression' {

  declare const compression: CompressionFunction;
  export = compression;
}

declare module 'morgan' {

  declare const morgan: MorganFunction;
  export = morgan;
}

declare module 'helmet' {
  declare function helmet(options: any): any;
  export = helmet;
}

declare module 'hpp' {
  declare function hpp(options: any): any;
  export = hpp;
}

declare module 'swagger-ui-express' {
  function setup(swaggerDoc, options: any): any;
  function serve(...args): any;
}

declare module 'cookie-parser' {
  declare function cookieParser(secret: string, options: any): any;
  export = cookieParser;
}

declare module 'nodemailer' {

  function createTransporter(options): Transporter;
  function createTransport(options): Transporter;
}

// Authentication and security modules
declare module 'bcrypt' {
  function hash(data, saltOrRounds): Promise<string>;
  function compare(data, encrypted): Promise<boolean>;
  function genSalt(rounds: number): Promise<string>;
  function hashSync(data, saltOrRounds): string;
  function compareSync(data, encrypted): boolean;
}

declare module 'jsonwebtoken' {

  function sign(payload, secretOrPrivateKey, options: any): string;
  function verify(token, secretOrPublicKey, options: any): JwtPayload | string;
  class JsonWebTokenError extends Error {}
  class TokenExpiredError extends Error {}
  class NotBeforeError extends Error {}
}

// File upload
declare module 'multer' {

  declare const multer: Multer;
  export = multer;
}

// Mongoose types
declare module 'mongoose' {

  function connect(uri, options: any): Promise<any>;
  const connection: Connection;
  class Schema {
    constructor(definition: any, options: any);
    [key: string]: any;
  }
  function model(name, schema: Schema): any;
}

export {};