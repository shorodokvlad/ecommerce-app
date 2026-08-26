import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApiService from "../../service/ApiService";
import BlueprintManagerModal, { getStoredBlueprints, saveStoredBlueprints } from "./BlueprintManagerModal";
import SpecBuilder from "./SpecBuilder";
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
    images: []
});

const AddProductPage = () => {
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [name, setName] = useState('');
    const [description] = useState('');
    const [specSections, setSpecSections] = useState([]);
    const [message, setMessage] = useState('');

    const [variants, setVariants] = useState([createEmptyVariant(1)]);
    const [customBlueprints, setCustomBlueprints] = useState([]);
    const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();

    const navigate = useNavigate();

    useEffect(() => {
        ApiService.getAllCategory().then((res) => setCategories(res.categoryList || []));
        ApiService.getAllWarehouses().then((res) => setWarehouses(res.warehouseList || []));
        setCustomBlueprints(getStoredBlueprints());
    }, []);

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
                images: []
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

    const variantStockTotal = (v) => {
        if (warehouses.length > 0) {
            return v.stockAllocations.reduce((sum, a) => {
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
                images: [...next[vIndex].images, ...newItems]
            };
            return next;
        });
        e.target.value = null;
    };

    const [draggedPhoto, setDraggedPhoto] = useState(null);

    const handlePhotoDragStart = (vIndex, imgIdx) => {
        setDraggedPhoto({ vIndex, imgIdx });
    };

    const handlePhotoDragOver = (e) => {
        e.preventDefault();
    };

    const handlePhotoDrop = (targetVIndex, targetImgIdx) => {
        if (!draggedPhoto) return;
        const { vIndex: srcVIndex, imgIdx: srcImgIdx } = draggedPhoto;
        if (srcVIndex !== targetVIndex || srcImgIdx === targetImgIdx) return;

        setVariants((prev) => {
            const next = [...prev];
            const updatedImgs = [...next[srcVIndex].images];
            const [movedItem] = updatedImgs.splice(srcImgIdx, 1);
            updatedImgs.splice(targetImgIdx, 0, movedItem);
            next[srcVIndex] = { ...next[srcVIndex], images: updatedImgs };
            return next;
        });
        setDraggedPhoto(null);
    };

    const removeVariantImage = (vIndex, imgIndex) => {
        setVariants((prev) => {
            const next = [...prev];
            const updatedImgs = next[vIndex].images.filter((_, idx) => idx !== imgIndex);
            next[vIndex] = { ...next[vIndex], images: updatedImgs };
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
            const hasPhotos = variants.some((v) => {
                if (v.images.length > 0) return true;
                if (v.copyPhotosFromIndex !== "" && v.copyPhotosFromIndex != null) {
                    const srcIndex = parseInt(v.copyPhotosFromIndex, 10);
                    return variants[srcIndex]?.images?.length > 0;
                }
                return false;
            });

            if (!hasPhotos) {
                setMessage("Please upload or select at least one photo for a product configuration.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const formData = new FormData();
            formData.append('categoryId', categoryId);
            formData.append('name', name);

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

                const targetImages = (v.copyPhotosFromIndex !== "" && v.copyPhotosFromIndex != null)
                    ? (variants[parseInt(v.copyPhotosFromIndex, 10)]?.images || [])
                    : v.images;

                targetImages.forEach((imgObj) => {
                    if (imgObj.file) {
                        formData.append(`variant_images_${vIndex}`, imgObj.file);
                    }
                });

                const stockByWarehouse = warehouses.length > 0
                    ? v.stockAllocations
                        .filter((a) => a.quantity !== '' && parseInt(a.quantity, 10) > 0)
                        .map((a) => ({ warehouseId: a.warehouseId, quantity: parseInt(a.quantity, 10) }))
                    : [];

                return {
                    title: v.title || `Configuration #${vIndex + 1}`,
                    attributes: attrMap,
                    price: v.price ? parseFloat(v.price) : 0,
                    stockQuantity: variantStockTotal(v),
                    stockByWarehouse,
                    imageUrls: []
                };
            });

            const firstPrice = formattedVariants[0]?.price || 0;
            formData.append('price', firstPrice);

            formData.append('variantsJson', JSON.stringify(formattedVariants));

            const response = await ApiService.addProduct(formData);
            if (response.status === 200) {
                sessionStorage.clear();
                setMessage(response.message);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => {
                    setMessage('');
                    navigate('/admin/products');
                }, 2000);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || 'Unable to upload product');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="product-form">
                <h2>Add Product</h2>
                {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
                {message && <div className="message">{message}</div>}

                <div className="form-group">
                    <label>Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
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
                            const displayImages = isCopying ? (variants[srcIndex]?.images || []) : v.images;

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
                                                placeholder="e.g. 899.00"
                                                value={v.price}
                                                onChange={(e) => updateVariantField(vIdx, 'price', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label>Stock Quantity</label>
                                            {warehouses.length > 0 ? (
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
                                                        placeholder="e.g. 50"
                                                        value={v.stockQuantity}
                                                        onChange={(e) => updateVariantField(vIdx, 'stockQuantity', e.target.value)}
                                                        required
                                                    />
                                                    <p className="variant-warehouse-hint">
                                                        No warehouses yet — <Link to="/admin/add-warehouse">create one</Link> to distribute stock across locations.
                                                    </p>
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

                                        {displayImages.length > 0 && (
                                            <div className="admin-image-previews" style={{ marginTop: "8px" }}>
                                                {displayImages.map((imgObj, imgIdx) => {
                                                    const isBeingDragged = draggedPhoto?.vIndex === vIdx && draggedPhoto?.imgIdx === imgIdx;
                                                    return (
                                                        <div
                                                            className={`admin-preview-item ${isBeingDragged ? 'dragging' : ''}`}
                                                            key={imgIdx}
                                                            draggable={!isCopying}
                                                            onDragStart={() => handlePhotoDragStart(vIdx, imgIdx)}
                                                            onDragOver={handlePhotoDragOver}
                                                            onDrop={() => handlePhotoDrop(vIdx, imgIdx)}
                                                            style={{ cursor: isCopying ? "default" : "grab" }}
                                                            title={!isCopying ? "Drag to reorder photo" : ""}
                                                        >
                                                            <img src={imgObj.url} alt={`Config ${vIdx + 1} ${imgIdx + 1}`} />
                                                            {!isCopying && (
                                                                <button
                                                                    type="button"
                                                                    className="remove-img-btn"
                                                                    onClick={() => removeVariantImage(vIdx, imgIdx)}
                                                                    title="Remove photo"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                            {imgIdx === 0 && <span className="main-photo-tag">Config Main</span>}
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
                            <span className="button-spinner" /> Saving Product...
                        </>
                    ) : (
                        "Save Product"
                    )}
                </button>
            </form>

            <BlueprintManagerModal
                isOpen={isBlueprintModalOpen}
                onClose={() => setIsBlueprintModalOpen(false)}
                onBlueprintsUpdated={(updated) => setCustomBlueprints(updated)}
            />
        </div>
    );
};

export default AddProductPage;