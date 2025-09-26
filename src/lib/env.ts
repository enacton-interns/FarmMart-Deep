const missingEnvVarError = (key: string) =>
  new Error(`Missing required environment variable: ${key}`);

export const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw missingEnvVarError(key);
  }

  return value;
};

export const getOptionalEnvVar = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};