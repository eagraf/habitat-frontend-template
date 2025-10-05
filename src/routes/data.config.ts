// This file is intended to be overwritten by code generation CLI tools
// Contains route configuration and lexicon definitions for the data debugger

export const DATA_ROUTE_LEXICONS = ['dev.eagraf.note'] as const;

// Additional route configuration can be added here as needed
export const DATA_ROUTE_CONFIG = {
  lexicons: DATA_ROUTE_LEXICONS,
  // Future configuration options can be added here
} as const;
