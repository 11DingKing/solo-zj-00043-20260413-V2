import React, { useState, useEffect } from "react";
import { fetchGetCategories, fetchAddCategory, fetchUpdateCategory, fetchDeleteCategory } from "../api_fetching/urlParserMainFucntionality";
import { handleResponseError } from "../utils/handleResponse";
import { defineCookiesToken } from "../utils/cookieHandling";
import { useNavigate } from "react-router-dom";
import "../index.css";

const CategorySidebar = ({ selectedCategory, onCategorySelect, refreshTrigger, onRefresh }) => {
    const [token, setToken] = defineCookiesToken();
    const navigate = useNavigate();
    
    const [categories, setCategories] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editCategoryName, setEditCategoryName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, [refreshTrigger]);

    const loadCategories = async () => {
        if (!token) {
            console.log("No token available, skipping category load");
            return;
        }
        try {
            setLoading(true);
            const response = await fetchGetCategories(token);
            if (!response.ok) {
                console.error(`Failed to fetch categories: ${response.status}`);
                const responseJSON = await response.json();
                const errorFlag = handleResponseError(response, responseJSON, navigate, setToken);
                if (errorFlag) { return; };
            } else {
                const responseJSON = await response.json();
                setCategories(responseJSON);
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            setErrorMessage("Category name cannot be empty");
            return;
        }

        try {
            const response = await fetchAddCategory(newCategoryName.trim(), token);
            const responseJSON = await response.json();
            
            if (!response.ok) {
                handleResponseError(response, responseJSON, navigate, setToken, setErrorMessage);
                return;
            }

            setNewCategoryName("");
            setErrorMessage("");
            setShowAddModal(false);
            loadCategories();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            navigate("/internal-server-error", { state: { errorMessage: "Server down. Please, try again later" } });
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!editCategoryName.trim()) {
            setErrorMessage("Category name cannot be empty");
            return;
        }

        try {
            const response = await fetchUpdateCategory(editingCategory.category_id, editCategoryName.trim(), token);
            const responseJSON = await response.json();
            
            if (!response.ok) {
                handleResponseError(response, responseJSON, navigate, setToken, setErrorMessage);
                return;
            }

            setEditCategoryName("");
            setErrorMessage("");
            setShowEditModal(false);
            setEditingCategory(null);
            loadCategories();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            navigate("/internal-server-error", { state: { errorMessage: "Server down. Please, try again later" } });
        }
    };

    const handleDeleteCategory = async (category) => {
        if (!window.confirm(`Are you sure you want to delete category "${category.category_name}"? All habits in this category will be moved to "Uncategorized".`)) {
            return;
        }

        try {
            const response = await fetchDeleteCategory(category.category_id, token);
            
            if (!response.ok) {
                const responseJSON = await response.json();
                handleResponseError(response, responseJSON, navigate, setToken, setErrorMessage);
                return;
            }

            if (selectedCategory === category.category_id) {
                onCategorySelect("all");
            }
            loadCategories();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            navigate("/internal-server-error", { state: { errorMessage: "Server down. Please, try again later" } });
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.category_name);
        setErrorMessage("");
        setShowEditModal(true);
    };

    return (
        <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Categories</h3>
                <button
                    onClick={() => { setShowAddModal(true); setNewCategoryName(""); setErrorMessage(""); }}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    title="Add Category"
                >
                    +
                </button>
            </div>

            <div className="space-y-1">
                <button
                    onClick={() => onCategorySelect("all")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedCategory === "all"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                    <span className="flex items-center">
                        <span className="mr-2">📋</span>
                        All Habits
                    </span>
                </button>

                <button
                    onClick={() => onCategorySelect(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedCategory === null
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                    <span className="flex items-center">
                        <span className="mr-2">📁</span>
                        Uncategorized
                    </span>
                </button>

                {loading ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm px-3 py-2">Loading...</p>
                ) : categories.length > 0 ? (
                    categories.map((category) => (
                        <div key={category.category_id} className="group">
                            <div
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                                    selectedCategory === category.category_id
                                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                <span
                                    onClick={() => onCategorySelect(category.category_id)}
                                    className="flex-1 flex items-center"
                                >
                                    <span className="mr-2">🏷️</span>
                                    {category.category_name}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal(category); }}
                                        className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : null}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add Category</h3>
                        {errorMessage && <p className="text-red-500 text-sm mb-3">{errorMessage}</p>}
                        <form onSubmit={handleAddCategory}>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Category name"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setErrorMessage(""); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Edit Category</h3>
                        {errorMessage && <p className="text-red-500 text-sm mb-3">{errorMessage}</p>}
                        <form onSubmit={handleEditCategory}>
                            <input
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                placeholder="Category name"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingCategory(null); setErrorMessage(""); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategorySidebar;
