-- Sprint 4-1: GUCCI 데모 매장에 display_fixtures 1건 시드 (진열 DB 연동 검증)
-- 시각/충돌은 기존 generated PNG 월드 유지. 슬롯은 trigger가 자동 생성.

INSERT INTO display_fixtures (store_id, template_id, origin_x, origin_y, rotation, label, sort_order)
SELECT 'popup_gucci_01', 'table_round_3', 9, 10, 0, '중앙 디스플레이 테이블', 0
WHERE NOT EXISTS (
  SELECT 1 FROM display_fixtures WHERE store_id = 'popup_gucci_01'
);
