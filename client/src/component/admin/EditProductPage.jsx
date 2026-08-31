import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ApiService from "../../service/ApiService";
import BlueprintManagerModal, { getStoredBlueprints, saveStoredBlueprints } from "./BlueprintManagerModal";
import SpecBuilder from "./SpecBuilder";
import { parseSpecifications } from "../../utils/specParser";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/addProduct.css';

const BUILT_IN_BLUEPRINTS = [
    {
        name: "Phone Blueprint",
        attributes: ["Memory", "Color", "RAM"]
    },
    {
        name: "Laptop Blueprint",
        attributes: ["Processor", "Storage", "RAM", "Color"]
    },
    {
        name: "Watch Blueprint",
        attributes: ["Case Size", "Band Type", "Material", "Color"]
    }
];

const createEmptyAttribute = (key = '', value = '') => ({
    id: `attr-${Date.now()}-${Math.random()}`,
    key,
    value
});

const createEmptyVariant = (index = 1) => ({
    id: `variant-${Date.now()}-${Math.random()}`,
    title: `Configuration #${index}`,
    price: '',
    stockQuantity: '',
    stockAllocations: [],
    attributes: [createEmptyAttribute()],
    copyPhotosFromIndex: "",
    existingImageUrls: [],
    newImages: []
});

const EditProductPage = () => {
    const { productId } = useParams();
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');

    const [variants, setVariants] = useState([]);
    const [customBlueprints, setCustomBlueprints] = useState([]);
    const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();

    const navigate = useNavigate();

    const [specSections, setSpecSections] = useState([]);

    const fetchProductData = useCallback(async () => {
        if (!productId) return;
        try {
            const response = await ApiService.getProductById(productId);
            const prod = response.product;
            setName(prod.name || '');
            setDescription(prod.description || '');
            setCategoryId(prod.category?.id || '');

            const parsedSpecs = parseSpecifications(prod.description);
            if (parsedSpecs && parsedSpecs.length > 0) {
                setSpecSections(parsedSpecs);
            }

            if (prod.variants && prod.variants.length > 0) {
                const sortedVariants = [...prod.variants].sort((a, b) => (a.id || 0) - (b.id || 0));
                setVariants(sortedVariants.map((v, idx) => {
                    const attrsList = [];
                    if (v.attributes) {
                        Object.entries(v.attributes).forEach(([k, val]) => {
                            attrsList.push({
                                id: `attr-${idx}-${k}-${Math.random()}`,
                                key: k,
                                value: val
                            });
                        });
                    }
                    if (attrsList.length === 0) {
                        attrsList.push(createEmptyAttribute());
                    }
                    return {
                        id: v.id || `v-${idx}-${Date.now()}`,
                        title: v.title || `Configuration #${idx + 1}`,
                        price: v.price ?? '',
                        stockQuantity: v.stockQuantity ?? '',
                        stockAllocations: v.stockByWarehouse
                            ? v.stockByWarehouse.map((s) => ({ warehouseId: s.warehouseId, quantity: s.quantity ?? '' }))
                            : [],
                        attributes: attrsList,
                        copyPhotosFromIndex: "",
                        existingImageUrls: v.imageUrls ? [...v.imageUrls] : [],
                        newImages: []
                    };
                }));
            } else {
                setVariants([{
                    id: `default-v-${Date.now()}`,
                    title: 'Configuration #1',
                    price: prod.price || '',
                    stockQuantity: prod.stockQuantity || '',
                    stockAllocations: [],
                    attributes: [createEmptyAttribute()],
                    copyPhotosFromIndex: "",
                    existingImageUrls: prod.imageUrls ? [...prod.imageUrls] : (prod.imageUrl ? [prod.imageUrl] : []),
                    newImages: []
                }]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [productId]);

    useEffect(() => {
        ApiService.getAllCategory().then((res) => setCategories(res.categoryList || []));
        ApiService.getAllWarehouses().then((res) => setWarehouses(res.warehouseList || []));
        setCustomBlueprints(getStoredBlueprints());
        fetchProductData();
    }, [fetchProductData]);

    const scrollToNewVariant = () => {
        setTimeout(() => {
            const cards = document.querySelectorAll(".admin-variant-card");
            if (cards.length > 0) {
                const lastCard = cards[cards.length - 1];
                lastCard.scrollIntoView({ behavior: "smooth", block: "center" });
                const titleInput = lastCard.querySelector(".variant-title-input");
                if (titleInput) titleInput.focus();
            }
        }, 80);
    };

    const addVariant = () => {
        setVariants((prev) => [...prev, createEmptyVariant(prev.length + 1)]);
        scrollToNewVariant();
    };

    const addVariantFromBlueprint = (blueprint) => {
        setVariants((prev) => [
            ...prev,
            {
                id: `variant-${Date.now()}-${Math.random()}`,
                title: `Configuration #${prev.length + 1}`,
                price: '',
                stockQuantity: '',
                stockAllocations: [],
                attributes: blueprint.attributes.map((keyStr) => createEmptyAttribute(keyStr, '')),
                copyPhotosFromIndex: "",
                existingImageUrls: [],
                newImages: []
            }
        ]);
        scrollToNewVariant();
    };

    const handleSaveAsBlueprint = (vIndex) => {
        const v = variants[vIndex];
        const keys = v.attributes.map(a => a.key ? a.key.trim() : "").filter(Boolean);
        if (keys.length === 0) {
            alert("Please type at least one attribute name before saving as a blueprint.");
            return;
        }
        const nameInput = prompt("Enter a name for this Blueprint (e.g. Tablet Specs, Headphone Specs):", `${v.title || 'Custom'} Blueprint`);
        if (nameInput && nameInput.trim()) {
            const current = getStoredBlueprints();
            const updated = [...current.filter(b => b.name !== nameInput.trim()), {
                id: `bp-${Date.now()}-${Math.random()}`,
                name: nameInput.trim(),
                attributes: keys
            }];
            saveStoredBlueprints(updated);
            setCustomBlueprints(updated);
            alert(`Blueprint "${nameInput.trim()}" saved successfully!`);
        }
    };

    const updateVariantField = (vIndex, field, value) => {
        let finalValue = value;
        if (field === 'stockQuantity') {
            if (value !== '' && parseInt(value, 10) < 0) {
                finalValue = '0';
            }
        }
        setVariants((prev) => {
            const next = [...prev];
            next[vIndex] = { ...next[vIndex], [field]: finalValue };
            return next;
        });
    };

    const updateVariantStockAllocation = (vIndex, warehouseId, value) => {
        let finalValue = value;
        if (value !== '' && parseInt(value, 10) < 0) {
            finalValue = '0';
        }
        setVariants((prev) => {
            const next = [...prev];
            const allocations = [...next[vIndex].stockAllocations];
            const existing = allocations.findIndex((a) => a.warehouseId === warehouseId);
            if (existing >= 0) {
                allocations[existing] = { warehouseId, quantity: finalValue };
            } else {
                allocations.push({ warehouseId, quantity: finalValue });
            }
            next[vIndex] = { ...next[vIndex], stockAllocations: allocations };
            return next;
        });
    };

    const allocateLegacyStock = (vIndex) => {
        if (warehouses.length === 0) return;
        const qty = parseInt(variants[vIndex].stockQuantity, 10);
        if (isNaN(qty) || qty <= 0) return;
        setVariants((prev) => {
            const next = [...prev];
            next[vIndex] = {
                ...next[vIndex],
                stockQuantity: '',
                stockAllocations: [{ warehouseId: warehouses[0].id, quantity: qty }]
            };
            return next;
        });
    };

    const variantStockTotal = (v) => {
        if (warehouses.length > 0 && v.stockAllocations.length > 0) {
            return v.stockAllocations.reduce((sum, a) => {
                if (!warehouses.some((w) => w.id === a.warehouseId)) return sum;
                const qty = parseInt(a.quantity, 10);
                return sum + (isNaN(qty) ? 0 : qty);
            }, 0);
        }
        const stock = parseInt(v.stockQuantity, 10);
        return isNaN(stock) ? 0 : stock;
    };

    const removeVariant = (vIndex) => {
        if (variants.length <= 1) {
            alert("At least one product configuration is required.");
            return;
        }
        setVariants((prev) => prev.filter((_, idx) => idx !== vIndex));
    };

    const addVariantAttribute = (vIndex) => {
        setVariants((prev) => {
            const next = [...prev];
            const updatedAttrs = [...next[vIndex].attributes, createEmptyAttribute()];
            next[vIndex] = { ...next[vIndex], attributes: updatedAttrs };
            return next;
        });
    };

    const updateVariantAttribute = (vIndex, attrId, field, value) => {
        setVariants((prev) => {
            const next = [...prev];
            const updatedAttrs = next[vIndex].attributes.map((attr) => {
                if (attr.id === attrId) {
                    return { ...attr, [field]: value };
                }
                return attr;
            });
            next[vIndex] = { ...next[vIndex], attributes: updatedAttrs };
            return next;
        });
    };

    const removeVariantAttribute = (vIndex, attrId) => {
        setVariants((prev) => {
            const next = [...prev];
            const updatedAttrs = next[vIndex].attributes.filter((attr) => attr.id !== attrId);
            next[vIndex] = { ...next[vIndex], attributes: updatedAttrs };
            return next;
        });
    };

    const handleVariantFilesChange = (vIndex, e) => {
        const selectedFiles = Array.from(e.target.files);
        const newItems = [];

        for (const file of selectedFiles) {
            if (file.size > 25 * 1024 * 1024) {
                alert(`File "${file.name}" exceeds 25MB limit.`);
                continue;
            }
            newItems.push({
                file,
                url: URL.createObjectURL(file)
            });
        }

        setVariants((prev) => {
            const next = [...prev];
            next[vIndex] = {
                ...next[vIndex],
                copyPhotosFromIndex: "",
                newImages: [...next[vIndex].newImages, ...newItems]
            };
            return next;
        });
        e.target.value = null;
    };

    const [draggedPhoto, setDraggedPhoto] = useState(null);

    const handlePhotoDragStart = (vIndex, type, imgIdx) => {
        setDraggedPhoto({ vIndex, type, imgIdx });
    };

    const handlePhotoDragOver = (e) => {
        e.preventDefault();
    };

    const handlePhotoDrop = (targetVIndex, targetType, targetImgIdx) => {
        if (!draggedPhoto) return;
        const { vIndex: srcVIndex, type: srcType, imgIdx: srcImgIdx } = draggedPhoto;
        if (srcVIndex !== targetVIndex || srcType !== targetType || srcImgIdx === targetImgIdx) return;

        setVariants((prev) => {
            const next = [...prev];
            const v = { ...next[srcVIndex] };

            if (srcType === 'existing') {
                const updatedList = [...v.existingImageUrls];
                const [moved] = updatedList.splice(srcImgIdx, 1);
                updatedList.splice(targetImgIdx, 0, moved);
                v.existingImageUrls = updatedList;
            } else if (srcType === 'new') {
                const updatedList = [...v.newImages];
                const [moved] = updatedList.splice(srcImgIdx, 1);
                updatedList.splice(targetImgIdx, 0, moved);
                v.newImages = updatedList;
            }

            next[srcVIndex] = v;
            return next;
        });
        setDraggedPhoto(null);
    };

    const removeVariantExistingImage = (vIndex, urlToRemove) => {
        setVariants((prev) => {
            const next = [...prev];
            const updatedExisting = next[vIndex].existingImageUrls.filter(u => u !== urlToRemove);
            next[vIndex] = { ...next[vIndex], existingImageUrls: updatedExisting };
            return next;
        });
    };

    const removeVariantNewImage = (vIndex, imgIndex) => {
        setVariants((prev) => {
            const next = [...prev];
            const updatedNew = next[vIndex].newImages.filter((_, idx) => idx !== imgIndex);
            next[vIndex] = { ...next[vIndex], newImages: updatedNew };
            return next;
        });
    };

    const totalStockSum = variants.reduce((sum, v) => {
        return sum + variantStockTotal(v);
    }, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (readOnly) {
            blockWrite();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('productId', productId);
            if (categoryId) formData.append('categoryId', categoryId);
            if (name) formData.append('name', name);
            let finalDescription = description;
            if (specSections && specSections.length > 0) {
                finalDescription = JSON.stringify(specSections);
            }
            formData.append('description', finalDescription);
            formData.append('stockQuantity', totalStockSum);

            const formattedVariants = variants.map((v, vIndex) => {
                const attrMap = {};
                v.attributes.forEach((attr) => {
                    if (attr.key && attr.key.trim() && attr.value && attr.value.trim()) {
                        attrMap[attr.key.trim()] = attr.value.trim();
                    }
                });

                const isCopying = v.copyPhotosFromIndex !== "" && v.copyPhotosFromIndex != null;
                const srcIndex = isCopying ? parseInt(v.copyPhotosFromIndex, 10) : null;
                const srcVariant = isCopying ? variants[srcIndex] : null;

                const targetNewImages = srcVariant ? srcVariant.newImages : v.newImages;
                const targetExistingUrls = srcVariant ? srcVariant.existingImageUrls : v.existingImageUrls;

                targetNewImages.forEach((imgObj) => {
                    if (imgObj.file) {
                        formData.append(`variant_images_${vIndex}`, imgObj.file);
                    }
                });

                const stockByWarehouse = warehouses.length > 0
                    ? v.stockAllocations
                        .filter((a) => warehouses.some((w) => w.id === a.warehouseId))
                        .filter((a) => a.quantity !== '' && parseInt(a.quantity, 10) > 0)
                        .map((a) => ({ warehouseId: a.warehouseId, quantity: parseInt(a.quantity, 10) }))
                    : [];

                return {
                    title: v.title || `Configuration #${vIndex + 1}`,
                    attributes: attrMap,
                    price: v.price ? parseFloat(v.price) : 0,
                    stockQuantity: variantStockTotal(v),
                    stockByWarehouse,
                    imageUrls: targetExistingUrls || []
                };
            });

            const firstPrice = formattedVariants[0]?.price || 0;
            formData.append('price', firstPrice);

            formData.append('variantsJson', JSON.stringify(formattedVariants));

            const response = await ApiService.updateProduct(formData);
            if (response.status === 200) {
                sessionStorage.clear();
                setMessage(response.message || "Product updated successfully!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                await fetchProductData();
                setTimeout(() => {
                    setMessage('');
                }, 4000);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || 'Unable to update product');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="product-form">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0 }}>Edit Product</h2>
                <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    style={{
                        background: "transparent",
                        border: "1px solid #cbd5e1",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: "#475569"
                    }}
                >
                    ← Back to Products
                </button>
            </div>

            {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
            {message && <div className="message">{message}</div>}

            <div className="form-group">
                <label>Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option value={cat.id} key={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Product Name</label>
                <input
                    type="text"
                    placeholder="Product name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="form-group">
                <SpecBuilder sections={specSections} onChange={setSpecSections} />
            </div>

            <div className="admin-variants-section">
                <div className="admin-variants-header">
                    <div>
                        <h3 style={{ margin: 0 }}>Product Configurations ({variants.length})</h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                            Total Stock Across All Configurations: <strong>{totalStockSum} units</strong>
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button type="button" className="add-variant-btn" onClick={addVariant}>
                            + Add Configuration
                        </button>

                        {/* Blueprint Selector Dropdown */}
                        <select
                            className="add-variant-btn"
                            style={{ background: "var(--paper)", color: "var(--ink)", border: "1.5px solid var(--line)" }}
                            onChange={(e) => {
                                if (!e.target.value) return;
                                const allBp = [...BUILT_IN_BLUEPRINTS, ...customBlueprints];
                                const selectedBp = allBp.find(b => b.name === e.target.value);
                                if (selectedBp) {
                                    addVariantFromBlueprint(selectedBp);
                                }
                                e.target.value = "";
                            }}
                        >
                            <option value="">+ Add from Blueprint</option>
                            <optgroup label="Built-in Blueprints">
                                {BUILT_IN_BLUEPRINTS.map(b => (
                                    <option key={b.name} value={b.name}>{b.name} ({b.attributes.join(", ")})</option>
                                ))}
                            </optgroup>
                            {customBlueprints.length > 0 && (
                                <optgroup label="My Saved Blueprints">
                                    {customBlueprints.map(b => (
                                        <option key={b.id || b.name} value={b.name}>{b.name} ({b.attributes.join(", ")})</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>

                        <button
                            type="button"
                            className="add-attr-btn"
                            onClick={() => setIsBlueprintModalOpen(true)}
                            style={{ padding: "6px 12px" }}
                        >
                            Manage Blueprints
                        </button>
                    </div>
                </div>

                <div className="admin-variants-list">
                    {variants.map((v, vIdx) => {
                        const isCopying = v.copyPhotosFromIndex !== "" && v.copyPhotosFromIndex != null;
                        const srcIndex = isCopying ? parseInt(v.copyPhotosFromIndex, 10) : null;
                        const srcVariant = isCopying ? variants[srcIndex] : null;

                        const displayExisting = srcVariant ? srcVariant.existingImageUrls : v.existingImageUrls;
                        const displayNew = srcVariant ? srcVariant.newImages : v.newImages;

                        return (
                            <div className="admin-variant-card" key={v.id}>
                                <div className="variant-card-header">
                                    <input
                                        type="text"
                                        className="variant-title-input"
                                        placeholder={`Configuration #${vIdx + 1} Title (e.g. White / 128GB)`}
                                        value={v.title}
                                        onChange={(e) => updateVariantField(vIdx, 'title', e.target.value)}
                                    />

                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <button
                                            type="button"
                                            className="add-attr-btn"
                                            onClick={() => handleSaveAsBlueprint(vIdx)}
                                            title="Save attribute structure as a reusable Blueprint"
                                        >
                                            Save Blueprint
                                        </button>

                                        {variants.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-variant-btn"
                                                onClick={() => removeVariant(vIdx)}
                                            >
                                                ✕ Remove
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="variant-attributes-builder">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                                            Custom Attributes (e.g. Color, Storage, Case Size, Band Type)
                                        </label>
                                        <button
                                            type="button"
                                            className="add-attr-btn"
                                            onClick={() => addVariantAttribute(vIdx)}
                                        >
                                            + Add Attribute
                                        </button>
                                    </div>

                                    {v.attributes.map((attr) => (
                                        <div className="attr-row" key={attr.id}>
                                            <input
                                                type="text"
                                                placeholder="Type e.g. Color, Memory, Size"
                                                value={attr.key}
                                                onChange={(e) => updateVariantAttribute(vIdx, attr.id, 'key', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Value e.g. White, 128GB, 44mm"
                                                value={attr.value}
                                                onChange={(e) => updateVariantAttribute(vIdx, attr.id, 'value', e.target.value)}
                                            />
                                            {v.attributes.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="remove-attr-btn"
                                                    onClick={() => removeVariantAttribute(vIdx, attr.id)}
                                                    title="Remove attribute"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="variant-price-stock-row">
                                    <div>
                                        <label>Price (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Price (€)"
                                            value={v.price}
                                            onChange={(e) => updateVariantField(vIdx, 'price', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label>Stock Quantity</label>
                                        {warehouses.length > 0 && v.stockAllocations.length > 0 ? (
                                            <div className="variant-warehouse-stock-list">
                                                {warehouses.map((wh) => {
                                                    const allocation = v.stockAllocations.find((a) => a.warehouseId === wh.id);
                                                    return (
                                                        <div className="warehouse-stock-row" key={wh.id}>
                                                            <label title={wh.city || wh.name}>{wh.name}</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={allocation ? allocation.quantity : ''}
                                                                onChange={(e) => updateVariantStockAllocation(vIdx, wh.id, e.target.value)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                                <p className="variant-warehouse-hint">
                                                    Allocating stock to warehouses: <strong>{variantStockTotal(v)}</strong> units total for this configuration.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Stock"
                                                    value={v.stockQuantity}
                                                    onChange={(e) => updateVariantField(vIdx, 'stockQuantity', e.target.value)}
                                                />
                                                {warehouses.length > 0 ? (
                                                    <p className="variant-warehouse-hint">
                                                        This configuration is not allocated to any warehouse yet.{" "}
                                                        <button
                                                            type="button"
                                                            className="add-attr-btn"
                                                            style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                                                            onClick={() => allocateLegacyStock(vIdx)}
                                                            disabled={!(parseInt(v.stockQuantity, 10) > 0)}
                                                        >
                                                            Allocate to {warehouses[0].name}
                                                        </button>
                                                    </p>
                                                ) : (
                                                    <p className="variant-warehouse-hint">
                                                        No warehouses yet — <Link to="/admin/add-warehouse">create one</Link> to distribute stock across locations.
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="variant-photo-upload-section">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                        <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                                            Photos for Configuration #{vIdx + 1}
                                        </label>

                                        {variants.length > 1 && (
                                            <select
                                                value={v.copyPhotosFromIndex}
                                                onChange={(e) => updateVariantField(vIdx, 'copyPhotosFromIndex', e.target.value)}
                                                style={{ fontSize: "0.78rem", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                                            >
                                                <option value="">+ Upload Custom Photos</option>
                                                {variants.map((otherV, otherIdx) => {
                                                    if (otherIdx === vIdx) return null;
                                                    return (
                                                        <option key={otherIdx} value={otherIdx}>
                                                            Reuse Photos from #{otherIdx + 1} ({otherV.title || `Config #${otherIdx + 1}`})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}
                                    </div>

                                    {!isCopying ? (
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleVariantFilesChange(vIdx, e)}
                                        />
                                    ) : (
                                        <p style={{ fontSize: "0.8rem", color: "var(--ink)", fontWeight: 600, margin: "4px 0 0" }}>
                                            ✓ Reusing photo set from Configuration #{srcIndex + 1} ({variants[srcIndex]?.title || `Config #${srcIndex + 1}`})
                                        </p>
                                    )}

                                    {(displayExisting.length > 0 || displayNew.length > 0) && (
                                        <div className="admin-image-previews" style={{ marginTop: "8px" }}>
                                            {displayExisting.map((url, imgIdx) => {
                                                const isBeingDragged = draggedPhoto?.vIndex === vIdx && draggedPhoto?.type === 'existing' && draggedPhoto?.imgIdx === imgIdx;
                                                return (
                                                    <div
                                                        className={`admin-preview-item ${isBeingDragged ? 'dragging' : ''}`}
                                                        key={`ext-${imgIdx}`}
                                                        draggable={!isCopying}
                                                        onDragStart={() => handlePhotoDragStart(vIdx, 'existing', imgIdx)}
                                                        onDragOver={handlePhotoDragOver}
                                                        onDrop={() => handlePhotoDrop(vIdx, 'existing', imgIdx)}
                                                        style={{ cursor: isCopying ? "default" : "grab" }}
                                                        title={!isCopying ? "Drag to reorder photo" : ""}
                                                    >
                                                        <img src={url} alt={`Saved ${imgIdx + 1}`} />
                                                        {!isCopying && (
                                                            <button
                                                                type="button"
                                                                className="remove-img-btn"
                                                                onClick={() => removeVariantExistingImage(vIdx, url)}
                                                                title="Remove photo"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                        {imgIdx === 0 && <span className="main-photo-tag">Config Main</span>}
                                                    </div>
                                                );
                                            })}

                                            {displayNew.map((imgObj, imgIdx) => {
                                                const isBeingDragged = draggedPhoto?.vIndex === vIdx && draggedPhoto?.type === 'new' && draggedPhoto?.imgIdx === imgIdx;
                                                return (
                                                    <div
                                                        className={`admin-preview-item new-preview ${isBeingDragged ? 'dragging' : ''}`}
                                                        key={`new-${imgIdx}`}
                                                        draggable={!isCopying}
                                                        onDragStart={() => handlePhotoDragStart(vIdx, 'new', imgIdx)}
                                                        onDragOver={handlePhotoDragOver}
                                                        onDrop={() => handlePhotoDrop(vIdx, 'new', imgIdx)}
                                                        style={{ cursor: isCopying ? "default" : "grab" }}
                                                        title={!isCopying ? "Drag to reorder photo" : ""}
                                                    >
                                                        <img src={imgObj.url} alt={`New ${imgIdx + 1}`} />
                                                        {!isCopying && (
                                                            <button
                                                                type="button"
                                                                className="remove-img-btn"
                                                                onClick={() => removeVariantNewImage(vIdx, imgIdx)}
                                                                title="Remove photo"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                        <span className="new-photo-tag">New</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
            {message && <div className="message" style={{ marginTop: "12px" }}>{message}</div>}
            <button
                type="submit"
                disabled={isSubmitting}
                className={readOnly ? "demo-no-permission" : ""}
                aria-disabled={readOnly}
                style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
                {isSubmitting ? (
                    <>
                        <span className="button-spinner" /> Updating Product...
                    </>
                ) : (
                    "Update Product"
                )}
            </button>

            <BlueprintManagerModal
                isOpen={isBlueprintModalOpen}
                onClose={() => setIsBlueprintModalOpen(false)}
                onBlueprintsUpdated={(updated) => setCustomBlueprints(updated)}
            />
        </form>
    );
};

export default EditProductPage;