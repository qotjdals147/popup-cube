/** v1 feature flags — world/play 경로는 dev·스폰서용으로만 유지 (AD-062 · §58) */
export function isWorldEnabled(): boolean {
  return import.meta.env.VITE_WORLD_ENABLED === 'true';
}
