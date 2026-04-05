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
    }

    interface Timeout {}
  }

  var process: NodeJS.Process;
  var Buffer: BufferConstructor;
  var console: Console;
  var require: any;
  
  function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
  function clearTimeout(timeoutId: NodeJS.Timeout): void;
  function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;

  interface ErrorConstructor {
    captureStackTrace(thisArg: any, func: any): void;
  }
}

// Node.js built-in modules
declare module 'cluster' {
  export const isMaster: boolean;
  export const isWorker: boolean;
  export function fork(): any;
  export function on(event: string, listener: (...args: any[]) => void): any;
}

declare module 'os' {
  export function cpus(): any[];
}

declare module 'stream' {
  export class Readable {
    constructor(options?: any);
    push(chunk: any): boolean;
    _read(): void;
  }
}

declare module 'crypto' {
  export function randomBytes(size: number): Buffer;
  export function createHash(algorithm: string): any;
}

declare module 'perf_hooks' {
  export const performance: {
    now(): number;
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
    [key: string]: any;
  }
  
  export interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(body?: any): Response;
    cookie(name: string, value: any, options?: any): Response;
    clearCookie(name: string, options?: any): Response;
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
    listen(...args: any[]): any;
    [key: string]: any;
  }
  
  export interface Router {
    use(...args: any[]): Router;
    get(...args: any[]): Router;
    post(...args: any[]): Router;
    put(...args: any[]): Router;
    delete(...args: any[]): Router;
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
    [key: string]: any;
  }
  
  export default function cors(options?: CorsOptions): any;
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
  export default function helmet(options?: any): any;
}

declare module 'hpp' {
  export default function hpp(options?: any): any;
}

declare module 'swagger-ui-express' {
  export function setup(swaggerDoc: any, options?: any): any;
  export function serve(...args: any[]): any;
}

declare module 'cookie-parser' {
  export default function cookieParser(secret?: string, options?: any): any;
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
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }
  
  export function sign(payload: object, secretOrPrivateKey: string, options?: any): string;
  export function verify(token: string, secretOrPublicKey: string, options?: any): JwtPayload | string;
  export class JsonWebTokenError extends Error {}
  export class TokenExpiredError extends Error {}
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
    [key: string]: any;
  }
  
  export function connect(uri: string, options?: ConnectOptions): Promise<any>;
  export const connection: Connection;
  export class Schema {
    constructor(definition?: any, options?: any);
    [key: string]: any;
  }
  export function model(name: string, schema?: Schema): any;
}

export {};