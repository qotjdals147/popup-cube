import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DisplayFixtureWithTemplate,
  DisplaySlotWithProduct,
  FixtureTemplate,
  Product,
} from '@popup-cube/shared';
import { canPlaceFixture, effectiveFixtureSize } from '@popup-cube/game-core';
import { listMyProducts } from '../lib/products';
import {
  buildStoreOccupancyGrid,
  createDisplayFixture,
  deleteDisplayFixture,
  DisplayFixtureError,
  listFixtureTemplates,
  loadStoreDisplayLayout,
  setDisplaySlotProduct,
} from '../lib/displayFixtures';
import { t } from '../i18n';

const CELL_PX = 22;

interface OwnerDisplayPanelProps {
  storeId: string;
  embedded?: boolean;
}

export function OwnerDisplayPanel({ storeId, embedded = false }: OwnerDisplayPanelProps) {
  const [templates, setTemplates] = useState<FixtureTemplate[]>([]);
  const [fixtures, setFixtures] = useState<DisplayFixtureWithTemplate[]>([]);
  const [slots, setSlots] = useState<DisplaySlotWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mapSize, setMapSize] = useState({ width: 20, height: 20 });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [tpl, layout, prods] = await Promise.all([
        listFixtureTemplates(),
        loadStoreDisplayLayout(storeId),
        listMyProducts(storeId),
      ]);
      setTemplates(tpl);
      setFixtures(layout.fixtures);
      setSlots(layout.slots);
      setProducts(prods.filter((p) => p.is_active));
      setMapSize(layout.mapSize);
    } catch {
      setLoadError(t('ownerDisplay.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const occupancy = useMemo(
    () => buildStoreOccupancyGrid(mapSize.width, mapSize.height, fixtures),
    [fixtures, mapSize.height, mapSize.width]
  );

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId) ?? null;
  const selectedSlots = selectedFixture
    ? slots.filter((s) => s.fixture_id === selectedFixture.id).sort((a, b) => a.slot_index - b.slot_index)
    : [];

  const paletteTemplate = templates.find((tpl) => tpl.id === paletteId) ?? null;

  async function handleCellClick(x: number, y: number) {
    if (!paletteTemplate || busy) return;

    setActionError(null);
    const tempId = `preview-${Date.now()}`;
    const preview = {
      id: tempId,
      templateId: paletteTemplate.id,
      origin: { x, y },
      size: { w: paletteTemplate.size_w, d: paletteTemplate.size_d },
      rotation: 0 as const,
    };

    if (!canPlaceFixture(occupancy.grid, preview)) {
      setActionError(t('ownerDisplay.errorOverlap'));
      return;
    }

    setBusy(true);
    try {
      await createDisplayFixture({
        storeId,
        templateId: paletteTemplate.id,
        originX: x,
        originY: y,
      });
      await reload();
    } catch (err) {
      setActionError(
        err instanceof DisplayFixtureError ? t('ownerDisplay.errorSave') : t('ownerDisplay.errorGeneric')
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedFixtureId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteDisplayFixture(selectedFixtureId);
      setSelectedFixtureId(null);
      await reload();
    } catch {
      setActionError(t('ownerDisplay.errorDelete'));
    } finally {
      setBusy(false);
    }
  }

  async function handleSlotProductChange(slotId: string, productId: string | null) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await setDisplaySlotProduct(slotId, productId);
      await reload();
    } catch {
      setActionError(t('ownerDisplay.errorSave'));
    } finally {
      setBusy(false);
    }
  }

  function renderGridCell(x: number, y: number) {
    const cell = occupancy.grid[x]?.[y];
    const fixtureId = cell?.fixtureId;
    const fixture = fixtureId ? fixtures.find((f) => f.id === fixtureId) : null;
    const isOrigin = fixture && fixture.origin_x === x && fixture.origin_y === y;
    const isSelected = fixtureId === selectedFixtureId;

    let bg = '#1e2a45';
    if (cell?.occupied && fixture) {
      bg = isSelected ? '#3d5a80' : '#2a4060';
    }

    return (
      <button
        key={`${x}-${y}`}
        type="button"
        title={fixture && isOrigin ? fixture.template.display_name : undefined}
        style={{
          width: CELL_PX,
          height: CELL_PX,
          padding: 0,
          border: isSelected ? '2px solid #ffd580' : '1px solid #2c4270',
          background: bg,
          cursor: paletteTemplate ? 'crosshair' : fixtureId ? 'pointer' : 'default',
          fontSize: 8,
          color: '#d8e4ff',
          lineHeight: 1.1,
          overflow: 'hidden',
        }}
        onClick={() => {
          if (paletteTemplate) {
            handleCellClick(x, y);
            return;
          }
          if (fixtureId) setSelectedFixtureId(fixtureId);
        }}
      >
        {isOrigin ? fixture!.template.display_name.slice(0, 4) : ''}
      </button>
    );
  }

  const shellStyle: React.CSSProperties = embedded
    ? { display: 'flex', flexDirection: 'column', gap: 16 }
    : {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      };

  return (
    <div style={shellStyle}>
      <div
        style={{
          ...panelStyle,
          maxHeight: embedded ? undefined : '92vh',
        }}
      >
        <header style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{t('ownerDisplay.title')}</h2>
            <p style={hintStyle}>{t('ownerDisplay.hint')}</p>
          </div>
          {paletteTemplate && (
            <span style={badgeStyle}>
              {t('ownerDisplay.placing')}: {paletteTemplate.display_name}
            </span>
          )}
        </header>

        {loading && <p style={hintStyle}>{t('ownerDisplay.loading')}</p>}
        {loadError && <p style={errorStyle}>{loadError}</p>}
        {actionError && <p style={errorStyle}>{actionError}</p>}

        {!loading && !loadError && (
          <div style={bodyStyle}>
            <aside style={paletteStyle}>
              <p style={sectionLabel}>{t('ownerDisplay.paletteTitle')}</p>
              {templates.map((tpl) => {
                const size = effectiveFixtureSize({ w: tpl.size_w, d: tpl.size_d }, 0);
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    style={{
                      ...paletteBtn,
                      ...(paletteId === tpl.id ? paletteBtnActive : {}),
                    }}
                    onClick={() => {
                      setPaletteId((cur) => (cur === tpl.id ? null : tpl.id));
                      setSelectedFixtureId(null);
                    }}
                  >
                    <strong>{tpl.display_name}</strong>
                    <span style={paletteMeta}>
                      {size.w}×{size.d} · {tpl.slot_count}슬롯
                    </span>
                  </button>
                );
              })}
              <p style={paletteHelp}>{t('ownerDisplay.paletteHelp')}</p>
            </aside>

            <div style={gridWrapStyle}>
              <p style={sectionLabel}>
                {t('ownerDisplay.gridTitle')} ({mapSize.width}×{mapSize.height})
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${mapSize.width}, ${CELL_PX}px)`,
                  gap: 0,
                  width: 'fit-content',
                  border: '1px solid #2c4270',
                }}
              >
                {Array.from({ length: mapSize.width * mapSize.height }, (_, i) => {
                  const x = i % mapSize.width;
                  const y = Math.floor(i / mapSize.width);
                  return renderGridCell(x, y);
                })}
              </div>
            </div>

            <aside style={detailStyle}>
              <p style={sectionLabel}>{t('ownerDisplay.detailTitle')}</p>
              {!selectedFixture && <p style={hintStyle}>{t('ownerDisplay.selectFixture')}</p>}
              {selectedFixture && (
                <>
                  <p style={detailName}>{selectedFixture.template.display_name}</p>
                  <p style={hintStyle}>
                    ({selectedFixture.origin_x}, {selectedFixture.origin_y})
                  </p>
                  <button type="button" style={dangerBtn} disabled={busy} onClick={handleDeleteSelected}>
                    {t('ownerDisplay.deleteFixture')}
                  </button>
                  <p style={{ ...sectionLabel, marginTop: 16 }}>{t('ownerDisplay.slotsTitle')}</p>
                  {selectedSlots.map((slot) => (
                    <label key={slot.id} style={slotRow}>
                      <span style={slotLabel}>
                        {t('ownerDisplay.slotLabel', { index: slot.slot_index + 1 })}
                      </span>
                      <select
                        style={selectStyle}
                        value={slot.product_id ?? ''}
                        disabled={busy}
                        onChange={(e) =>
                          handleSlotProductChange(slot.id, e.target.value || null)
                        }
                      >
                        <option value="">{t('ownerDisplay.slotEmpty')}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#16213e',
  borderRadius: 12,
  border: '1px solid #2c4270',
  padding: 20,
  width: '100%',
  maxWidth: 1100,
  overflow: 'auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 12,
};

const hintStyle: React.CSSProperties = { color: '#a0a0c0', fontSize: 13, lineHeight: 1.5, margin: 0 };
const errorStyle: React.CSSProperties = { color: '#ff6b6b', fontSize: 13, margin: '8px 0' };
const sectionLabel: React.CSSProperties = {
  color: '#a0a0c0',
  fontSize: 12,
  margin: '0 0 8px',
  fontWeight: 600,
};

const bodyStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 200px) 1fr minmax(180px, 220px)',
  gap: 16,
  alignItems: 'start',
};

const paletteStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const paletteBtn: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #2c4270',
  background: '#0f3460',
  color: '#d8e4ff',
  cursor: 'pointer',
  fontSize: 12,
};
const paletteBtnActive: React.CSSProperties = {
  borderColor: '#ffd580',
  background: '#173a55',
};
const paletteMeta: React.CSSProperties = { display: 'block', color: '#a0a0c0', fontSize: 11, marginTop: 2 };
const paletteHelp: React.CSSProperties = { ...hintStyle, marginTop: 8, fontSize: 11 };

const gridWrapStyle: React.CSSProperties = { overflow: 'auto', maxWidth: '100%' };
const detailStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const detailName: React.CSSProperties = { margin: 0, fontSize: 15, fontWeight: 600 };
const dangerBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #7f1d1d',
  background: '#450a0a',
  color: '#fca5a5',
  cursor: 'pointer',
  fontSize: 13,
};
const slotRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 };
const slotLabel: React.CSSProperties = { fontSize: 12, color: '#a0a0c0' };
const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #2c4270',
  background: '#0f3460',
  color: '#fff',
  fontSize: 13,
};
const badgeStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 999,
  background: '#173a2c',
  color: '#8ce0b0',
  border: '1px solid #2c6b4a',
};
