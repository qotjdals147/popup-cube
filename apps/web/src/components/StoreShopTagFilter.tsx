import { t } from '../i18n';
import type { StoreTagFacet } from '../lib/storeProductTags';

interface StoreShopTagFilterProps {
  facets: StoreTagFacet[];
  selectedTag: string | null;
  tagQuery: string;
  onSelectTag: (label: string | null) => void;
  onTagQueryChange: (query: string) => void;
}

export function StoreShopTagFilter({
  facets,
  selectedTag,
  tagQuery,
  onSelectTag,
  onTagQueryChange,
}: StoreShopTagFilterProps) {
  if (facets.length === 0) return null;

  const q = tagQuery.trim().toLowerCase();
  const visibleFacets = q ? facets.filter((f) => f.label.toLowerCase().includes(q)) : facets;

  return (
    <section className="store-shop-tag-filter" aria-label={t('shop.tagFilterTitle')}>
      <div className="store-shop-tag-filter__head">
        <span className="store-shop-tag-filter__title">{t('shop.tagFilterTitle')}</span>
        {facets.length > 8 && (
          <input
            type="search"
            className="store-shop-tag-filter__search"
            value={tagQuery}
            onChange={(e) => onTagQueryChange(e.target.value)}
            placeholder={t('shop.tagSearchPlaceholder')}
            aria-label={t('shop.tagSearchPlaceholder')}
          />
        )}
      </div>
      <div className="store-shop-tag-filter__chips" role="list">
        <button
          type="button"
          role="listitem"
          className={
            selectedTag === null
              ? 'store-shop-tag-filter__chip store-shop-tag-filter__chip--active'
              : 'store-shop-tag-filter__chip'
          }
          onClick={() => onSelectTag(null)}
        >
          {t('shop.tagFilterAll')}
        </button>
        {visibleFacets.map((facet) => (
          <button
            key={facet.label}
            type="button"
            role="listitem"
            className={
              selectedTag === facet.label
                ? 'store-shop-tag-filter__chip store-shop-tag-filter__chip--active'
                : 'store-shop-tag-filter__chip'
            }
            onClick={() => onSelectTag(facet.label)}
          >
            {facet.label}
            <span className="store-shop-tag-filter__count">{facet.productCount}</span>
          </button>
        ))}
      </div>
      {q && visibleFacets.length === 0 && (
        <p className="store-shop-tag-filter__no-match">{t('shop.tagSearchNoMatch')}</p>
      )}
    </section>
  );
}
