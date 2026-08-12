import { useEffect, useRef, useState } from 'react';
import type { Product, ProductDetailBlock } from '@popup-cube/shared';
import {
  addImageBlock,
  addTextBlock,
  deleteDetailBlock,
  listProductDetailBlocks,
  ProductDetailBlockError,
  reorderProductDetailBlocks,
  updateTextBlock,
} from '../lib/productDetailBlocks';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerProductBlockEditorProps {
  product: Product;
  userId: string;
  onSaved: () => void;
}

/**
 * §56 (AD-060) — 상세페이지 블록 에디터. 워드/구글독스처럼 글·사진 블록을 한 캔버스에
 * 쌓아 올리고, 드래그로 순서를 자유롭게 바꿀 수 있음. `OwnerProductDetailEditor`(글 1개 +
 * 이미지 목록 분리 구조)를 대체.
 */
export function OwnerProductBlockEditor({ product, userId, onSaved }: OwnerProductBlockEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blocks, setBlocks] = useState<ProductDetailBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const data = await listProductDetailBlocks(product.id);
      setBlocks(data);
    } catch {
      setError(t('ownerProducts.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  async function handleAddText() {
    setError(null);
    try {
      const created = await addTextBlock(product.id, blocks.length);
      setBlocks((prev) => [...prev, created]);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ProductDetailBlockError && err.code === 'TOO_MANY_BLOCKS'
          ? t('ownerProducts.detailBlockTooMany')
          : t('ownerProducts.errorGeneric')
      );
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      let count = blocks.length;
      for (const file of files) {
        const created = await addImageBlock(userId, product.id, file, count);
        setBlocks((prev) => [...prev, created]);
        count += 1;
      }
      onSaved();
    } catch (err) {
      if (err instanceof ProductDetailBlockError && err.code === 'IMAGE_TOO_LARGE') {
        setError(t('ownerProducts.detailImageTooLarge'));
      } else if (err instanceof ProductDetailBlockError && err.code === 'TOO_MANY_BLOCKS') {
        setError(t('ownerProducts.detailBlockTooMany'));
      } else {
        setError(t('ownerProducts.errorGeneric'));
      }
    } finally {
      setUploading(false);
    }
  }

  function handleTextChange(blockId: string, value: string) {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, text_content: value } : b)));
  }

  async function handleTextBlur(block: ProductDetailBlock) {
    try {
      await updateTextBlock(block.id, block.text_content ?? '');
      onSaved();
    } catch {
      setError(t('ownerProducts.errorGeneric'));
    }
  }

  async function handleDelete(block: ProductDetailBlock) {
    if (!window.confirm(t('ownerProducts.detailBlockDeleteConfirm'))) return;
    try {
      await deleteDetailBlock(block.id);
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      onSaved();
    } catch {
      setError(t('ownerProducts.errorGeneric'));
    }
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  }

  async function handleDrop(targetIndex: number) {
    const sourceIndex = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    const next = [...blocks];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setBlocks(next);

    try {
      await reorderProductDetailBlocks(next.map((b) => b.id));
      onSaved();
    } catch {
      setError(t('ownerProducts.errorGeneric'));
    }
  }

  return (
    <div style={styles.wrap}>
      <p style={styles.hintText}>{t('ownerProducts.detailBlockDragHint')}</p>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p style={styles.hintText}>{t('ownerProducts.loading')}</p>
      ) : blocks.length === 0 ? (
        <p style={styles.hintText}>{t('ownerProducts.detailBlockEmpty')}</p>
      ) : (
        <div style={styles.blockList}>
          {blocks.map((block, i) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => void handleDrop(i)}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              style={{
                ...styles.blockRow,
                opacity: dragIndex === i ? 0.4 : 1,
                borderTop: dragOverIndex === i && dragIndex !== i ? `2px solid ${oc.primary}` : styles.blockRow.borderTop,
              }}
            >
              <span style={styles.dragHandle} title={t('ownerProducts.detailBlockDragHandle')}>
                ⠿
              </span>
              <div style={styles.blockContent}>
                {block.block_type === 'text' ? (
                  <textarea
                    style={styles.textarea}
                    value={block.text_content ?? ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    onBlur={() => void handleTextBlur(block)}
                    placeholder={t('ownerProducts.detailTextBlockPlaceholder')}
                    rows={3}
                    maxLength={4000}
                  />
                ) : (
                  <img src={block.image_url ?? ''} alt="" style={styles.blockImage} />
                )}
              </div>
              <button type="button" style={styles.iconButtonDanger} onClick={() => void handleDelete(block)}>
                {t('mypage.delete')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.addRow}>
        <button type="button" style={styles.addButton} onClick={() => void handleAddText()}>
          {t('ownerProducts.detailAddTextBlock')}
        </button>
        <button
          type="button"
          style={styles.addButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? t('ownerProducts.submitting') : t('ownerProducts.detailAddImageBlock')}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => void handleFileChange(e)}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 14,
    padding: 16,
    borderRadius: 10,
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  hintText: { color: oc.textMuted, fontSize: fs.xs, margin: '0 0 10px', lineHeight: 1.5 },
  error: { color: oc.danger, fontSize: fs.sm, margin: '0 0 8px' },
  blockList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  blockRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    background: oc.surface,
    border: `1px solid ${oc.border}`,
    borderTop: `1px solid ${oc.border}`,
    cursor: 'grab',
  },
  dragHandle: { color: oc.textMuted, fontSize: 16, lineHeight: 1, paddingTop: 6, flexShrink: 0, cursor: 'grab' },
  blockContent: { flex: 1, minWidth: 0 },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  blockImage: { width: '100%', maxWidth: 260, height: 'auto', display: 'block', borderRadius: 6 },
  iconButtonDanger: {
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${oc.dangerBorder}`,
    background: oc.dangerBg,
    color: oc.dangerText,
    fontSize: fs.xs,
    cursor: 'pointer',
    flexShrink: 0,
  },
  addRow: { display: 'flex', gap: 10, marginTop: 4 },
  addButton: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.primary}`,
    background: oc.surface,
    color: oc.primary,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
