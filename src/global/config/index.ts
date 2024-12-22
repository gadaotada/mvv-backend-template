import yaml from 'js-yaml';
import fs from 'fs';
import dotenv from 'dotenv';
import { merge } from 'lodash';

/**
* Main Class for managing configuration
* @class ConfigManager
*/
export class ConfigManager {
    /**
    * @private instance - The singleton instance of ConfigManager
    * @private config - The configuration object
    * @private configPath - The path to the configuration file
    */
    private static instance: ConfigManager;
    private config: Record<string, any>;
    private readonly configPath: string;

    private constructor(configPath: string) {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }

    /**
    * Get the singleton instance of ConfigManager
    * @param configPath - The path to the configuration file
    * @returns {ConfigManager} The singleton instance
    */
    public static getInstance(configPath?: string): ConfigManager {
        if (!this.instance) {
            if (!configPath) {
                throw new Error('Config path must be provided for initial setup');
            }
            this.instance = new ConfigManager(configPath);
        }
        return this.instance;
    }

    /**
    * Load the configuration from the file
    * @returns {Record<string, any>} The configuration object
    */
    private loadConfig(): Record<string, any> {
        // Load environment variables
        dotenv.config();

        // Read and parse YAML
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        
        // Replace environment variables in the YAML content
        const interpolatedYaml = this.interpolateEnvVars(fileContents);
        
        return yaml.load(interpolatedYaml) as Record<string, any>;
    }

    /**
    * Interpolate environment variables in the YAML content
    * @param content - The YAML content
    * @returns {string} The interpolated YAML content
    */
    private interpolateEnvVars(content: string): string {
        return content.replace(/\${([^}]+)}/g, (match, p1) => {
            const [envVar, defaultValue] = p1.split(':-');
            return process.env[envVar] || defaultValue || '';
        });
    }

    /**
    * Get a value from the configuration by path
    * @param path - The path to the value
    * @returns {any} The value
    */
    public get<T>(path: string): T {
        return this.getNestedValue(this.config, path);
    }

    /**
    * Update a value in the configuration by path
    * @param path - The path to the value
    * @param value - The new value
    * @returns {void}
    */
    public update(path: string, value: any): void {
        const parts = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
    }

    /**
    * Get a nested value from the configuration by path
    * @param obj - The configuration object
    * @param path - The path to the value
    * @returns {any} The value
    */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, part) => current?.[part], obj);
    }

    /**
    * Get the entire configuration object
    * @returns {Record<string, any>} The configuration object
    */
    public getAll(): Record<string, any> {
        return { ...this.config };
    }

    /**
    * Update multiple values in the configuration
    * @param updates - The new values to update
    * @returns {void}
    */
    public updateMultiple(updates: Record<string, any>): void {
        this.config = merge({}, this.config, updates);
    }
} 