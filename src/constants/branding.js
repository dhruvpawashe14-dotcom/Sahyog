// Single source of truth for the default brand name. When forking this codebase for a
// different organization, this is the one line that needs to change as a build-time
// fallback — the actual displayed name can also be overridden at runtime via
// Settings > Company Name (see useCompanyName hook) without a redeploy.
export const DEFAULT_APP_NAME = 'MyAdvisor CRM';
