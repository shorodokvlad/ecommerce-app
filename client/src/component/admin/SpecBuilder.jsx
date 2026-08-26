import React, { useState, useEffect } from "react";
import { ENGLISH_CATEGORY_BLUEPRINTS } from "../../utils/specParser";
import SpecBlueprintManagerModal, { getStoredSpecBlueprints, saveStoredSpecBlueprints } from "./SpecBlueprintManagerModal";
import "../../style/specBuilder.css";

const SpecBuilder = ({ sections, onChange }) => {
    const safeSections = Array.isArray(sections) ? sections : [];
    const [customBlueprints, setCustomBlueprints] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setCustomBlueprints(getStoredSpecBlueprints());
    }, []);

    const reloadBlueprints = () => {
        setCustomBlueprints(getStoredSpecBlueprints());
    };

    const handleLoadBlueprint = (val) => {
        if (!val) return;
        if (ENGLISH_CATEGORY_BLUEPRINTS[val]) {
            const cloned = JSON.parse(JSON.stringify(ENGLISH_CATEGORY_BLUEPRINTS[val]));
            onChange(cloned);
        } else {
            const custom = customBlueprints.find(b => b.id === val || b.name === val);
            if (custom && custom.sections) {
                const cloned = JSON.parse(JSON.stringify(custom.sections));
                onChange(cloned);
            }
        }
    };

    const handleSaveAsBlueprint = () => {
        if (safeSections.length === 0) {
            alert("Please add at least one section before saving as a blueprint.");
            return;
        }
        const nameInput = prompt("Enter a name for this Specification Blueprint (e.g. Smart Watch Spec Preset, Custom Tablet Specs):");
        if (nameInput && nameInput.trim()) {
            const fresh = getStoredSpecBlueprints();
            const updated = [
                ...fresh.filter(b => b.name !== nameInput.trim()),
                {
                    id: `spec-bp-${Date.now()}-${Math.random()}`,
                    name: nameInput.trim(),
                    sections: safeSections
                }
            ];
            saveStoredSpecBlueprints(updated);
            reloadBlueprints();
            alert(`Specification blueprint "${nameInput.trim()}" saved successfully!`);
        }
    };

    const handleSectionTitleChange = (sIdx, newTitle) => {
        const next = JSON.parse(JSON.stringify(safeSections));
        next[sIdx].title = newTitle;
        onChange(next);
    };

    const handleItemChange = (sIdx, iIdx, field, val) => {
        const next = JSON.parse(JSON.stringify(safeSections));
        next[sIdx].items[iIdx][field] = val;
        onChange(next);
    };

    const handleAddRow = (sIdx) => {
        const next = JSON.parse(JSON.stringify(safeSections));
        next[sIdx].items.push({ label: "", value: "" });
        onChange(next);
    };

    const handleRemoveRow = (sIdx, iIdx) => {
        const next = JSON.parse(JSON.stringify(safeSections));
        next[sIdx].items.splice(iIdx, 1);
        onChange(next);
    };

    const handleAddSection = () => {
        const next = JSON.parse(JSON.stringify(safeSections));
        next.push({
            title: "NEW SPECIFICATION SECTION",
            items: [{ label: "", value: "" }]
        });
        onChange(next);
    };

    const handleRemoveSection = (sIdx) => {
        const next = JSON.parse(JSON.stringify(safeSections));
        next.splice(sIdx, 1);
        onChange(next);
    };

    return (
        <div className="spec-builder-container">
            <SpecBlueprintManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onBlueprintsUpdated={setCustomBlueprints}
            />

            <div className="spec-builder-toolbar">
                <div>
                    <h4 style={{ margin: 0, color: "var(--ink)" }}>Product Specifications & Characteristics</h4>
                    <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
                        Add section headers and key-value specification rows below.
                    </p>
                </div>

                <div className="spec-template-picker" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                handleLoadBlueprint(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Load Specification Template...</option>
                        <optgroup label="Default Category Templates">
                            <option value="phone">Phone Specification Template</option>
                            <option value="laptop">Laptop Specification Template</option>
                            <option value="tablet">Tablet Specification Template</option>
                            <option value="wearable">Wearable Specification Template</option>
                            <option value="audio">Audio Specification Template</option>
                        </optgroup>
                        {customBlueprints.length > 0 && (
                            <optgroup label="My Custom Saved Templates">
                                {customBlueprints.map((bp) => (
                                    <option key={bp.id} value={bp.id}>{bp.name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>

                    <button
                        type="button"
                        onClick={handleSaveAsBlueprint}
                        title="Save current layout as reusable template"
                        style={{ fontSize: "0.78rem", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "var(--ink)", fontWeight: 600, cursor: "pointer" }}
                    >
                        Save Blueprint
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        style={{ fontSize: "0.78rem", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "var(--ink)", fontWeight: 600, cursor: "pointer" }}
                    >
                        Manage Blueprints ({customBlueprints.length})
                    </button>
                </div>
            </div>

            {safeSections.length === 0 ? (
                <div className="spec-builder-empty">
                    <p>No specifications added yet. Load a category template or add a section manually.</p>
                    <button type="button" className="btn-add-sec" onClick={handleAddSection}>
                        + Add First Specification Section
                    </button>
                </div>
            ) : (
                <div className="spec-sections-list">
                    {safeSections.map((sec, sIdx) => (
                        <div className="spec-section-card" key={sIdx}>
                            <div className="spec-section-card-header">
                                <input
                                    type="text"
                                    className="sec-title-input"
                                    placeholder="SECTION TITLE (e.g. GENERAL CHARACTERISTICS)"
                                    value={sec.title}
                                    onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn-del-sec"
                                    onClick={() => handleRemoveSection(sIdx)}
                                    title="Delete entire section"
                                >
                                    ✕ Remove Section
                                </button>
                            </div>

                            <div className="spec-items-table">
                                <div className="spec-table-header">
                                    <span>Characteristic Name (Key)</span>
                                    <span>Value</span>
                                    <span></span>
                                </div>

                                {sec.items.map((item, iIdx) => (
                                    <div className="spec-table-row" key={iIdx}>
                                        <input
                                            type="text"
                                            className="spec-input-label"
                                            value={item.label}
                                            onChange={(e) => handleItemChange(sIdx, iIdx, 'label', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="spec-input-val"
                                            value={item.value}
                                            onChange={(e) => handleItemChange(sIdx, iIdx, 'value', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="btn-del-row"
                                            onClick={() => handleRemoveRow(sIdx, iIdx)}
                                            title="Delete row"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button type="button" className="btn-add-row" onClick={() => handleAddRow(sIdx)}>
                                + Add Characteristic Row
                            </button>
                        </div>
                    ))}

                    <button type="button" className="btn-add-sec" onClick={handleAddSection}>
                        + Add Specification Section
                    </button>
                </div>
            )}
        </div>
    );
};

export default SpecBuilder;
