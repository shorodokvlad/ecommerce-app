export const slugify = (value) => String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const attributePriority = ([key]) => {
    const normalizedKey = slugify(key);
    if (/(memory|storage|capacity)/.test(normalizedKey)) return 0;
    if (normalizedKey.includes('color')) return 1;
    return 2;
};

const sortedAttributes = (variant) => Object.entries(variant?.attributes || {})
    .sort((left, right) => attributePriority(left) - attributePriority(right));

export const getProductIdFromRoute = (routeValue) => {
    if (/^\d+$/.test(routeValue || '')) return Number(routeValue);
    const match = String(routeValue || '').match(/-(\d+)$/);
    return match ? Number(match[1]) : null;
};

export const getProductPath = (product, variant = null) => {
    if (!product?.id) return '/';

    const productSlug = `${slugify(product.name) || 'product'}-${product.id}`;
    const params = new URLSearchParams();
    const attributes = sortedAttributes(variant);

    attributes.forEach(([key, value]) => {
        params.set(slugify(key), slugify(value));
    });

    if (variant?.id && attributes.length === 0) {
        params.set('variant', String(variant.id));
    }

    const query = params.toString();
    return `/product/${productSlug}${query ? `?${query}` : ''}`;
};

export const findVariantFromSearch = (product, search) => {
    const variants = product?.variants || [];
    if (variants.length === 0) return null;

    const params = search instanceof URLSearchParams
        ? search
        : new URLSearchParams(search || '');
    const requestedVariantId = params.get('variant');

    if (requestedVariantId) {
        return variants.find((variant) => String(variant.id) === requestedVariantId) || null;
    }

    const requestedAttributes = [...params.entries()];
    if (requestedAttributes.length === 0) return null;

    return variants.find((variant) => requestedAttributes.every(([requestedKey, requestedValue]) =>
        Object.entries(variant.attributes || {}).some(([key, value]) =>
            slugify(key) === requestedKey && slugify(value) === requestedValue
        )
    )) || null;
};

export const getDefaultInStockVariant = (product) => {
    const variants = product?.variants || [];
    if (variants.length === 0) return null;

    const inStockVariant = variants.find((variant) => (variant.stockQuantity ?? 0) > 0);
    return inStockVariant || variants[0] || null;
};

export const configureProduct = (product, variant = null) => {
    if (!product) return null;

    const variantImages = variant?.imageUrls?.filter(Boolean) || [];
    const identity = variant?.id
        ? `${product.id}-v-${variant.id}`
        : String(product.id);

    return {
        ...product,
        cartKey: identity,
        favoriteKey: identity,
        variantId: variant?.id || null,
        variantTitle: variant?.title || null,
        variantAttributes: variant?.attributes ? { ...variant.attributes } : null,
        price: variant?.price ?? product.price,
        stockQuantity: variant?.stockQuantity ?? product.stockQuantity,
        imageUrl: variantImages[0] || product.imageUrl,
        imageUrls: variantImages.length > 0 ? variantImages : product.imageUrls,
        productUrl: getProductPath(product, variant)
    };
};
