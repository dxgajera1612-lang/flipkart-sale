// pages/admin/products/index.js
import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiEye, FiMenu, 
  FiArrowUp, FiArrowDown, FiSave, FiX, FiUpload, 
  FiLink, FiCode, FiImage, FiAlertTriangle, FiCheckCircle, FiCopy
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─── Sort config ─────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'order',          label: '☰  Custom Order'   },
  { value: 'title_asc',      label: 'Name A → Z',        field: 'title',        dir: 'asc'  },
  { value: 'title_desc',     label: 'Name Z → A',        field: 'title',        dir: 'desc' },
  { value: 'price_asc',      label: 'Price Low → High',  field: 'sellingPrice', dir: 'asc'  },
  { value: 'price_desc',     label: 'Price High → Low',  field: 'sellingPrice', dir: 'desc' },
  { value: 'stock_asc',      label: 'Stock Low → High',  field: 'stock',        dir: 'asc'  },
  { value: 'stock_desc',     label: 'Stock High → Low',  field: 'stock',        dir: 'desc' },
  { value: 'newest',         label: 'Newest First',      field: 'createdAt',    dir: 'desc' },
  { value: 'oldest',         label: 'Oldest First',      field: 'createdAt',    dir: 'asc'  },
  { value: 'active_first',   label: 'Active First',      field: 'isActive',     dir: 'desc' },
  { value: 'inactive_first', label: 'Inactive First',    field: 'isActive',     dir: 'asc'  },
];

function applySorting(list, sortValue) {
  const opt = SORT_OPTIONS.find((o) => o.value === sortValue);
  if (!opt || !opt.field) return list;
  return [...list].sort((a, b) => {
    let va = a[opt.field] ?? '';
    let vb = b[opt.field] ?? '';
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return opt.dir === 'asc' ? -1 : 1;
    if (va > vb) return opt.dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// ─── Product Modal Component ─────────────────────────────────────
function ProductModal({ isOpen, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    title2: '',
    description: '',
    features: '',
    mrp: '',
    sellingPrice: '',
    stock: '',
    category: '',
    subCategory: '',
    brand: '',
    sku: '',
    tags: '',
    isActive: true,
    isFeatured: false,
    mainImage: '',
    images: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bulkImageUrls, setBulkImageUrls] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [descTab, setDescTab] = useState('edit'); // 'edit' | 'preview'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      const mainImg = product.mainImage || product.images?.[0] || '';
      const allImgs = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (mainImg ? [mainImg] : []);

      setFormData({
        title: product.title || '',
        title2: product.title2 || '',
        description: product.description || '',
        features: product.features || '',
        mrp: product.mrp ?? '',
        sellingPrice: product.sellingPrice ?? '',
        stock: product.stock ?? '',
        category: product.category || '',
        subCategory: product.subCategory || '',
        brand: product.brand || '',
        sku: product.sku || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        mainImage: mainImg,
        images: allImgs,
      });
    } else {
      resetForm();
    }
    setNewImageUrl('');
    setBulkImageUrls('');
    setShowBulkInput(false);
    setDescTab('edit');
  }, [product, isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      title2: '',
      description: '',
      features: '',
      mrp: '',
      sellingPrice: '',
      stock: '',
      category: '',
      subCategory: '',
      brand: '',
      sku: '',
      tags: '',
      isActive: true,
      isFeatured: false,
      mainImage: '',
      images: [],
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ── Image Handling ──────────────────────────────────────────────
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) {
      toast.error('Please enter an image URL');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('/')) {
      toast.error('Image URL should start with http:// or https://');
      return;
    }

    setFormData(prev => {
      const exists = prev.images.includes(trimmed);
      const updatedImages = exists ? prev.images : [trimmed, ...prev.images];
      const mainImg = prev.mainImage ? prev.mainImage : trimmed;
      return {
        ...prev,
        mainImage: mainImg,
        images: updatedImages,
      };
    });
    setNewImageUrl('');
    toast.success('Image URL added successfully');
  };

  const handleAddBulkUrls = () => {
    if (!bulkImageUrls.trim()) return;
    const urls = bulkImageUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/')));

    if (urls.length === 0) {
      toast.error('No valid http/https URLs found');
      return;
    }

    setFormData(prev => {
      const combined = Array.from(new Set([...urls, ...prev.images]));
      return {
        ...prev,
        mainImage: prev.mainImage || combined[0] || '',
        images: combined,
      };
    });

    setBulkImageUrls('');
    setShowBulkInput(false);
    toast.success(`Added ${urls.length} image URLs!`);
  };

  const handleRemoveImage = (imgUrl) => {
    setFormData(prev => {
      const filtered = prev.images.filter(i => i !== imgUrl);
      let newMain = prev.mainImage;
      if (prev.mainImage === imgUrl) {
        newMain = filtered[0] || '';
      }
      return {
        ...prev,
        mainImage: newMain,
        images: filtered,
      };
    });
    toast.success('Image removed');
  };

  const handleSetMainImage = (imgUrl) => {
    setFormData(prev => ({
      ...prev,
      mainImage: imgUrl,
    }));
    toast.success('Main display image updated');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      const uploadData = new FormData();
      uploadData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          mainImage: data.url,
          images: Array.from(new Set([data.url, ...prev.images])),
        }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── HTML Description Toolbar Helpers ───────────────────────────
  const insertHtmlTag = (openTag, closeTag = '') => {
    const textarea = document.getElementById('product-description-editor');
    if (!textarea) {
      setFormData(prev => ({ ...prev, description: prev.description + openTag + closeTag }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = openTag + selectedText + closeTag;

    const newText = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, description: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
    }, 50);
  };

  const insertTableTemplate = () => {
    const tableHtml = `\n<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px;">
  <thead>
    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
      <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Specification</th>
      <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 12px; color: #475569;">Material</td>
      <td style="padding: 8px 12px; color: #0f172a;">Premium Quality</td>
    </tr>
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 12px; color: #475569;">Warranty</td>
      <td style="padding: 8px 12px; color: #0f172a;">1 Year Guarantee</td>
    </tr>
  </tbody>
</table>\n`;
    setFormData(prev => ({ ...prev, description: prev.description + tableHtml }));
  };

  const insertListTemplate = () => {
    const listHtml = `\n<ul style="padding-left: 20px; margin: 10px 0; line-height: 1.6;">
  <li>High durability and long-lasting build</li>
  <li>Lightweight and comfortable design</li>
  <li>100% Original Authentic Product</li>
</ul>\n`;
    setFormData(prev => ({ ...prev, description: prev.description + listHtml }));
  };

  // ── Submit Handler ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      toast.error('Valid selling price is required');
      return;
    }
    if (formData.mrp && parseFloat(formData.sellingPrice) > parseFloat(formData.mrp)) {
      toast.error('Selling price cannot be greater than MRP');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = product ? `/api/products/${product._id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const payload = {
        title: formData.title.trim(),
        title2: formData.title2.trim() || formData.title.trim(),
        description: formData.description,
        features: formData.features,
        mrp: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        stock: parseInt(formData.stock) || 0,
        category: formData.category.trim() || 'General',
        subCategory: formData.subCategory.trim(),
        brand: formData.brand.trim(),
        sku: formData.sku.trim(),
        mainImage: formData.mainImage || formData.images[0] || '',
        images: formData.images,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(product ? 'Product updated successfully!' : 'Product created successfully!');
        onSave();
        onClose();
        resetForm();
      } else {
        toast.error(data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {product ? '✏️ Edit Product' : '✨ Add New Product'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {product ? `Product ID: ${product._id}` : 'Fill in information below to publish on storefront'}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="space-y-6">

            {/* ── SECTION 1: EASY IMAGE URL MANAGER ────────────── */}
            <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
              
              {/* Header & Source Mode Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FiImage className="text-amber-600" /> Product Images
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Paste live web image URLs or upload image files below.
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-amber-100/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3.5 py-1.5 rounded-lg transition ${imageMode === 'url' ? 'bg-amber-500 text-white shadow' : 'text-amber-900 hover:bg-amber-200/60'}`}
                  >
                    <FiLink className="inline mr-1" /> Paste Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-3.5 py-1.5 rounded-lg transition ${imageMode === 'upload' ? 'bg-amber-500 text-white shadow' : 'text-amber-900 hover:bg-amber-200/60'}`}
                  >
                    <FiUpload className="inline mr-1" /> Upload File
                  </button>
                </div>
              </div>

              {/* URL INPUT MODE */}
              {imageMode === 'url' ? (
                <div className="space-y-4">
                  
                  {/* Single URL Add Row */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      🔗 Paste Live Image URL (HTTP / HTTPS)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                        placeholder="Paste URL here e.g. https://images.unsplash.com/photo-1523275335684"
                        className="input flex-1 text-sm bg-gray-50 border-gray-300 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="btn bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <FiPlus size={16} /> Add Image URL
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <span>Paste direct image link ending in .jpg, .png, .webp, or web image URL.</span>
                      <button
                        type="button"
                        onClick={() => setShowBulkInput(!showBulkInput)}
                        className="text-amber-700 font-bold hover:underline"
                      >
                        {showBulkInput ? '✕ Hide Bulk Paste' : '📋 Paste Multiple URLs at once'}
                      </button>
                    </div>
                  </div>

                  {/* Bulk Input Box (Collapsible) */}
                  {showBulkInput && (
                    <div className="bg-white p-4 rounded-xl border-2 border-amber-300 shadow-md space-y-2">
                      <label className="text-xs font-bold text-gray-800 block">
                        📋 Paste Multiple Image URLs (One URL per line):
                      </label>
                      <textarea
                        rows={3}
                        value={bulkImageUrls}
                        onChange={(e) => setBulkImageUrls(e.target.value)}
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        className="input w-full font-mono text-xs bg-gray-50 p-2.5 border-gray-300"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBulkInput(false)}
                          className="btn btn-xs btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddBulkUrls}
                          className="btn btn-xs bg-amber-500 text-white font-bold"
                        >
                          + Add All URLs
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* FILE UPLOAD MODE */
                <div className="bg-white p-4 rounded-xl border border-amber-200 text-center space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                    <FiUpload size={24} />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-6 py-2 rounded-lg"
                      disabled={loading}
                    >
                      {loading ? 'Uploading File...' : 'Choose Image File from Computer'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: JPG, PNG, WebP (Max size 5MB)
                    </p>
                  </div>
                </div>
              )}

              {/* IMAGES GALLERY GRID DISPLAY */}
              <div className="mt-4 pt-4 border-t border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-800">
                    Product Images List ({formData.images.length} added)
                  </span>
                  {formData.mainImage && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      ★ Main Display Set
                    </span>
                  )}
                </div>

                {formData.images.length === 0 ? (
                  <div className="bg-white/80 border-2 border-dashed border-amber-200 rounded-xl p-6 text-center text-gray-400 text-xs">
                    <FiImage size={32} className="mx-auto mb-2 text-amber-300" />
                    No image URLs added yet. Paste an image URL above and click <b>"+ Add Image URL"</b>.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                    {formData.images.map((imgUrl, idx) => {
                      const isMain = imgUrl === formData.mainImage;
                      return (
                        <div
                          key={idx}
                          className={`relative group bg-white border-2 rounded-xl p-2 transition shadow-sm ${
                            isMain ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/30' : 'border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="w-full h-28 bg-gray-100 rounded-lg overflow-hidden relative flex items-center justify-center">
                            <img
                              src={imgUrl}
                              alt={`Product ${idx + 1}`}
                              className="w-100 h-100 object-cover"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL'; }}
                            />

                            {/* Main Badge */}
                            {isMain && (
                              <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                                ★ MAIN
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                            {!isMain ? (
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(imgUrl)}
                                className="text-amber-700 font-bold hover:underline text-[11px]"
                              >
                                Set Main
                              </button>
                            ) : (
                              <span className="text-amber-600 font-bold">Default</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgUrl)}
                              className="text-red-500 hover:text-red-700 font-semibold p-1 hover:bg-red-50 rounded"
                              title="Delete Image"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* ── SECTION 2: PRODUCT INFORMATION ────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 border rounded-xl">
              
              {/* Main Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input w-full font-medium"
                  placeholder="e.g. Premium Designer Saree / Wireless Earbuds 5G"
                  required
                />
              </div>

              {/* Secondary Title */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Secondary Title / Subtitle
                </label>
                <input
                  type="text"
                  name="title2"
                  value={formData.title2}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="Short title for breadcrumb or list"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  SKU / Product Code
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="e.g. SK-1002"
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  MRP (₹ Original Price)
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="e.g. 1999"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Selling Price (₹ Discounted) *
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  className="input w-full text-sm font-bold text-emerald-700"
                  placeholder="e.g. 799"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="e.g. 100"
                  min="0"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="e.g. Electronics, Women Clothing"
                />
              </div>

              {/* SubCategory */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  SubCategory
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="e.g. Sarees, Mobile Accessories"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="e.g. Meesho Specials, Samsung"
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="input w-full text-sm"
                  placeholder="trending, bestseller, new arrival"
                />
              </div>

            </div>

            {/* ── SECTION 3: HTML DESCRIPTION EDITOR & PREVIEW ────── */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FiCode className="text-amber-600" /> Product Description (HTML Supported)
                </label>
                
                {/* Editor / Preview Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDescTab('edit')}
                    className={`px-3 py-1.5 rounded-md transition ${descTab === 'edit' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-600'}`}
                  >
                    ✏️ Edit HTML Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescTab('preview')}
                    className={`px-3 py-1.5 rounded-md transition ${descTab === 'preview' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-600'}`}
                  >
                    👁️ Storefront Live Preview
                  </button>
                </div>
              </div>

              {descTab === 'edit' ? (
                <div>
                  {/* HTML Toolbar Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 p-2 bg-gray-50 border rounded-lg text-xs">
                    <span className="text-[11px] font-bold text-gray-600 mr-1">Insert HTML:</span>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<b>', '</b>')}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100"
                      title="Bold text"
                    >
                      B (Bold)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<i>', '</i>')}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded italic hover:bg-gray-100"
                      title="Italic text"
                    >
                      I (Italic)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<h2>', '</h2>')}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100"
                      title="Heading 2"
                    >
                      H2 Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<p>', '</p>')}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                      title="Paragraph"
                    >
                      &lt;p&gt; Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag('<br/>')}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                      title="Line break"
                    >
                      &lt;br&gt; Break
                    </button>
                    <button
                      type="button"
                      onClick={insertListTemplate}
                      className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold hover:bg-amber-100"
                    >
                      • Bullet List
                    </button>
                    <button
                      type="button"
                      onClick={insertTableTemplate}
                      className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-300 rounded font-bold hover:bg-blue-100"
                    >
                      📊 Specs Table
                    </button>
                  </div>

                  <textarea
                    id="product-description-editor"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="input w-full font-mono text-xs leading-relaxed p-3 bg-gray-50 border-gray-300 focus:bg-white"
                    placeholder="Enter product description HTML code or plain text here..."
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 min-h-[160px] max-h-[300px] overflow-y-auto bg-gray-50/50">
                  {formData.description ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-800 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formData.description }}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-xs italic">
                      No description entered yet. Switch to "Edit HTML Code" tab to add content.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 4: STATUS TOGGLES ────────────────────────── */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="ml-2 text-sm font-bold text-gray-800">
                  Active Product (Visible on Storefront)
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="ml-2 text-sm font-bold text-gray-800">
                  Featured Product (Highlight on Home)
                </span>
              </label>
            </div>

          </div>

          <div className="modal-footer mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow"
              disabled={loading}
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Publish Product')}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 880px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
        }

        .modal-close-btn {
          padding: 0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-close-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 1.75rem;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────
function DeleteConfirmModal({ isOpen, onClose, product, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(product._id);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Product</h3>
          <p className="text-xs text-gray-500 mb-4">
            Are you sure you want to permanently delete this product? This action cannot be undone.
          </p>

          {/* Product Snippet */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border mb-6 text-left">
            <img
              src={product.mainImage || product.images?.[0] || 'https://via.placeholder.com/50'}
              alt={product.title}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-gray-900 truncate">{product.title}</h4>
              <p className="text-[11px] text-gray-500">₹{product.sellingPrice} • Stock: {product.stock ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary text-xs"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn btn-danger text-xs flex items-center gap-1"
              disabled={loading}
            >
              <FiTrash2 size={13} />
              {loading ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 1rem;
        }

        .delete-modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function ProductsList() {
  const [products, setProducts]         = useState([]);
  const [displayed, setDisplayed]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [sortBy, setSortBy]             = useState('order');
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder]   = useState(false);

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const dragIndex  = useRef(null);
  const [overIndex, setOverIndex] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/products?page=${page}&limit=50&search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
        setOrderChanged(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    setDisplayed(applySorting(products, sortBy));
  }, [products, sortBy]);

  // ── Modal handlers ─────────────────────────────────────────────
  const openAddModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleModalSave = () => {
    fetchProducts();
  };

  // ── Sort ───────────────────────────────────────────────────────
  const handleSortChange = (val) => {
    setSortBy(val);
    if (val !== 'order') setOrderChanged(false);
  };

  const toggleColumn = (ascVal, descVal) =>
    handleSortChange(sortBy === ascVal ? descVal : ascVal);

  const SortIcon = ({ asc, desc }) => {
    if (sortBy === asc)  return <FiArrowUp   size={11} style={{ color: '#ffc200', flexShrink: 0 }} />;
    if (sortBy === desc) return <FiArrowDown size={11} style={{ color: '#ffc200', flexShrink: 0 }} />;
    return <FiArrowUp size={11} style={{ opacity: 0.2, flexShrink: 0 }} />;
  };

  // ── Delete ─────────────────────────────────────────────────────
  const openDeleteModal = (product) => {
    setDeletingProduct(product);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingProduct(null);
  };

  const handleConfirmDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) { 
        toast.success('Product deleted successfully'); 
        fetchProducts(); 
      } else {
        toast.error(data.message || 'Failed to delete product');
      }
    } catch { 
      toast.error('Failed to delete product'); 
    }
  };

  // ── Toggle status ──────────────────────────────────────────────
  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await response.json();
      if (data.success) { 
        toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`); 
        fetchProducts(); 
      }
    } catch { 
      toast.error('Failed to update status'); 
    }
  };

  // ── Drag & drop ────────────────────────────────────────────────
  const handleDragStart = (index) => { dragIndex.current = index; };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== index) setOverIndex(index);
  };

  const handleDrop = (dropIndex) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return;
    const reordered = [...displayed];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(dropIndex, 0, moved);
    setDisplayed(reordered);
    setProducts(reordered);
    setOrderChanged(true);
    setSortBy('order');
    dragIndex.current = null;
    setOverIndex(null);
  };

  const handleDragEnd = () => { dragIndex.current = null; setOverIndex(null); };

  // ── Save order to server ───────────────────────────────────────
  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderedIds: displayed.map((p) => p._id) }),
      });
      const data = await res.json();
      if (data.success) { 
        toast.success('Order saved successfully'); 
        setOrderChanged(false); 
        fetchProducts();
      } else {
        toast.error(data.message || 'Failed to save order');
      }
    } catch { 
      toast.error('Failed to save order'); 
    } finally { 
      setSavingOrder(false); 
    }
  };

  const discardOrder = () => { 
    setDisplayed(applySorting(products, 'order')); 
    setOrderChanged(false); 
  };

  const isDragMode  = sortBy === 'order';
  const showingFrom = pagination ? (page - 1) * pagination.limit + 1 : 0;
  const showingTo   = pagination ? Math.min(page * pagination.limit, pagination.total) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products Catalog</h1>
            {pagination && <p className="text-sm text-gray-500 mt-1">{pagination.total} total products in database</p>}
          </div>
          <button onClick={openAddModal} className="btn bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow flex items-center gap-2">
            <FiPlus size={18} /> Add New Product
          </button>
        </div>

        {/* Unsaved order banner */}
        {orderChanged && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 12, padding: '12px 18px',
          }}>
            <span style={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>
              ⚠️ You have unsaved order changes — click Save Order to apply on storefront.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={discardOrder} disabled={savingOrder} className="btn btn-sm btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiX size={13} /> Discard
              </button>
              <button onClick={saveOrder} disabled={savingOrder} className="btn btn-sm bg-amber-500 text-white font-bold"
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none' }}>
                <FiSave size={13} /> {savingOrder ? 'Saving…' : 'Save Order'}
              </button>
            </div>
          </div>
        )}

        <div className="card">

          {/* Toolbar */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">

            {/* Search */}
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by title, category, brand, or description..."
                className="input pl-10 w-full"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Sort dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <label style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>Sort by</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{
                    appearance: 'none', WebkitAppearance: 'none',
                    padding: '8px 34px 8px 12px',
                    border: '1px solid #d1d5db', borderRadius: 8,
                    fontSize: 14, color: '#111827',
                    background: '#fff', cursor: 'pointer', minWidth: 185, outline: 'none',
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: '#9ca3af', fontSize: 12,
                }}>▾</span>
              </div>
            </div>
          </div>

          {/* Drag mode hint */}
          {isDragMode && !loading && displayed.length > 0 && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiMenu size={11} /> Drag rows to reorder products. Changes won't save until you click Save Order.
            </p>
          )}

          {/* Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36, padding: '8px 4px' }} />
                  <th>Image</th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleColumn('title_asc', 'title_desc')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Title <SortIcon asc="title_asc" desc="title_desc" />
                    </span>
                  </th>
                  <th>Category</th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleColumn('price_asc', 'price_desc')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Price <SortIcon asc="price_asc" desc="price_desc" />
                    </span>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleColumn('stock_asc', 'stock_desc')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Stock <SortIcon asc="stock_asc" desc="stock_desc" />
                    </span>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleColumn('active_first', 'inactive_first')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Status <SortIcon asc="active_first" desc="inactive_first" />
                    </span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <div className="spinner w-8 h-8 mx-auto" />
                    </td>
                  </tr>
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">No products found</td>
                  </tr>
                ) : (
                  displayed.map((product, index) => (
                    <tr
                      key={product._id}
                      draggable={isDragMode}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        opacity: dragIndex.current === index ? 0.35 : 1,
                        background: overIndex === index ? '#fdf3fc' : undefined,
                        borderTop: overIndex === index ? '2px solid #ffc200' : undefined,
                        transition: 'background 0.12s, opacity 0.12s',
                      }}
                    >
                      <td style={{
                        width: 36, textAlign: 'center', padding: '8px 4px',
                        color: isDragMode ? '#9ca3af' : '#e5e7eb',
                        cursor: isDragMode ? 'grab' : 'default',
                      }}>
                        <FiMenu size={15} />
                      </td>

                      <td>
                        <img
                          src={product.mainImage || product.images?.[0] || 'https://via.placeholder.com/60?text=No+Img'}
                          alt={product.title}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-100"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Img'; }}
                        />
                      </td>

                      <td className="font-medium max-w-xs">
                        <div className="truncate font-semibold text-gray-900">{product.title}</div>
                        {product.brand && (
                          <span className="text-[11px] text-gray-500 block">Brand: {product.brand}</span>
                        )}
                      </td>

                      <td className="text-xs text-gray-600">
                        {product.category || 'General'}
                        {product.subCategory && <span className="block text-[10px] text-gray-400">{product.subCategory}</span>}
                      </td>

                      <td>
                        <div className="font-semibold text-emerald-700">₹{product.sellingPrice}</div>
                        {product.mrp > product.sellingPrice && (
                          <div className="text-xs text-gray-400 line-through">₹{product.mrp}</div>
                        )}
                      </td>

                      <td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ (product.stock ?? 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600' }`}>
                          {product.stock ?? 0}
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={() => toggleStatus(product._id, product.isActive)}
                          className={`badge cursor-pointer ${product.isActive ? 'badge-success' : 'badge-danger'}`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td>
                        <div className="flex items-center space-x-2">
                          <Link href={`/product/${product._id}`} target="_blank"
                            className="btn btn-sm btn-secondary" title="View Storefront">
                            <FiEye />
                          </Link>
                          <button 
                            onClick={() => openEditModal(product)}
                            className="btn btn-sm btn-secondary text-blue-600" 
                            title="Edit Product"
                          >
                            <FiEdit />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(product)}
                            className="btn btn-sm btn-danger" 
                            title="Delete Product"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {showingFrom} to {showingTo} of {pagination.total} results
              </p>
              <div className="flex space-x-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1}
                  className="btn btn-sm btn-secondary disabled:opacity-50">
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  Page {page} of {pagination.totalPages}
                </span>
                <button onClick={() => setPage(page + 1)} disabled={page === pagination.totalPages}
                  className="btn btn-sm btn-secondary disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={closeModal}
        product={editingProduct}
        onSave={handleModalSave}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        product={deletingProduct}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  );
}