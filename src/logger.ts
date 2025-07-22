import pino, { Logger } from 'pino';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export interface LoggerConfig {
  level?: string;
  environment?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  logDir?: string;
  serviceName?: string;
  version?: string;
}

export class ProductionLogger {
  private logger: Logger;
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || process.env.LOG_LEVEL || 'info',
      environment: config.environment || process.env.NODE_ENV || 'development',
      enableConsole: config.enableConsole ?? true,
      enableFile: config.enableFile ?? (process.env.NODE_ENV === 'production'),
      logDir: config.logDir || process.env.LOG_DIR || './logs',
      serviceName: config.serviceName || 'opendota-mcp-server',
      version: config.version || process.env.npm_package_version || '1.0.0',
    };

    this.logger = this.createLogger();
    this.setupErrorHandlers();
  }

  private createLogger(): Logger {
    const baseConfig = {
      level: this.config.level,
      name: this.config.serviceName,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: any) => ({
          ...object,
          service: this.config.serviceName,
          version: this.config.version,
          environment: this.config.environment,
        }),
      },
      serializers: {
        error: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    };

    // Development: pretty console logging
    if (this.config.environment === 'development' && this.config.enableConsole) {
      return pino({
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname,service,version,environment',
          },
        },
      });
    }

    // Production: structured JSON logging with file output
    if (this.config.enableFile && this.config.environment === 'production') {
      this.ensureLogDirectory();
      
      const logStream = createWriteStream(
        join(this.config.logDir, `${this.config.serviceName}.log`),
        { flags: 'a' }
      );

      return pino(baseConfig, logStream);
    }

    // Default: console JSON logging
    return pino(baseConfig);
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private setupErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.fatal({ error }, 'Uncaught Exception');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.fatal(
        { 
          reason: reason instanceof Error ? reason : new Error(String(reason)),
          promise 
        },
        'Unhandled Promise Rejection'
      );
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });
  }

  // Convenience methods for different log levels
  public trace(obj: any, msg?: string): void {
    this.logger.trace(obj, msg);
  }

  public debug(obj: any, msg?: string): void {
    this.logger.debug(obj, msg);
  }

  public info(obj: any, msg?: string): void {
    this.logger.info(obj, msg);
  }

  public warn(obj: any, msg?: string): void {
    this.logger.warn(obj, msg);
  }

  public error(obj: any, msg?: string): void {
    this.logger.error(obj, msg);
  }

  public fatal(obj: any, msg?: string): void {
    this.logger.fatal(obj, msg);
  }

  // Structured logging methods for common scenarios
  public logApiCall(data: {
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
    error?: Error;
  }): void {
    const { method, url, statusCode, duration, error } = data;
    
    if (error) {
      this.logger.error({
        type: 'api_call',
        method,
        url,
        statusCode,
        duration,
        error,
      }, 'API call failed');
    } else {
      this.logger.info({
        type: 'api_call',
        method,
        url,
        statusCode,
        duration,
      }, 'API call completed');
    }
  }

  public logToolExecution(data: {
    toolName: string;
    arguments: any;
    duration?: number;
    success: boolean;
    error?: Error;
  }): void {
    const { toolName, arguments: args, duration, success, error } = data;
    
    if (success) {
      this.logger.info({
        type: 'tool_execution',
        toolName,
        arguments: args,
        duration,
        success,
      }, `Tool '${toolName}' executed successfully`);
    } else {
      this.logger.error({
        type: 'tool_execution',
        toolName,
        arguments: args,
        duration,
        success,
        error,
      }, `Tool '${toolName}' execution failed`);
    }
  }

  public logMcpRequest(data: {
    method: string;
    params: any;
    requestId?: string;
    duration?: number;
    error?: Error;
  }): void {
    const { method, params, requestId, duration, error } = data;
    
    if (error) {
      this.logger.error({
        type: 'mcp_request',
        method,
        params,
        requestId,
        duration,
        error,
      }, 'MCP request failed');
    } else {
      this.logger.info({
        type: 'mcp_request',
        method,
        params,
        requestId,
        duration,
      }, 'MCP request completed');
    }
  }

  public logServerStart(data: {
    port?: number;
    transport?: string;
    version?: string;
  }): void {
    this.logger.info({
      type: 'server_start',
      ...data,
    }, 'MCP Server started');
  }

  public logServerStop(reason?: string): void {
    this.logger.info({
      type: 'server_stop',
      reason,
    }, 'MCP Server stopped');
  }

  // Get the underlying pino logger for advanced usage
  public getLogger(): Logger {
    return this.logger;
  }
}

// Export a default instance
export const logger = new ProductionLogger();

// Export error classes for better error handling
export class MCPError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(message: string, code: string = 'MCP_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MCPError.prototype);
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class APIError extends MCPError {
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class TimeoutError extends MCPError {
  constructor(message: string = 'Operation timed out', details?: any) {
    super(message, 'TIMEOUT_ERROR', 408, details);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}