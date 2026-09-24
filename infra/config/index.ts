import { EnvironmentConfig, EnvironmentName } from './types';
import { devConfig } from './dev';
import { stagingConfig } from './staging';
import { prodConfig } from './prod';

const configs: Record<EnvironmentName, EnvironmentConfig> = {
  dev: devConfig,
  staging: stagingConfig,
  prod: prodConfig,
};

export function getConfig(envName: string): EnvironmentConfig {
  const key = envName as EnvironmentName;
  if (!configs[key]) {
    throw new Error(
      `Unknown env "${envName}". Use one of: ${Object.keys(configs).join(', ')}`,
    );
  }
  return configs[key];
}

export * from './types';
export { devConfig, stagingConfig, prodConfig };
