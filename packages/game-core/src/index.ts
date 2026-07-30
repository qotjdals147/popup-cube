/**
 * @popup-cube/game-core
 *
 * Phase 2 (다음 작업): Phaser isometric scene, avatar sprite loader, map renderer.
 * 지금은 소켓 연결 뼈대만 있고, 실제 픽셀 월드 렌더링은 다음 단계에서 채웁니다.
 */
export * from './socketClient';
export * from './topDownGame';
export type { WorldVisualStyle, GeneratedInteractZone, VirtualDirections } from './topDownGame';
export { GUCCI_CENTER_TABLE } from './generatedWorldAssets';
export * from './isoVisuals';
export * from './occupancyGrid';
