// Fake build info since Info plugin is disabled
export function useBuildInfo() {
  return {
    version: 'dev',
    commit: 'local',
    branch: 'local',
    builtOn: new Date().toISOString(),
  }
}
