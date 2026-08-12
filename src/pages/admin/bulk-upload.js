// components/admin/BulkUploadProducts.jsx
import { useState, useCallback } from 'react';
import { parseCSV, validateProductCSV, downloadCSVTemplate } from '../../utils/csvHelper';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function BulkUploadProducts() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [uploadMode, setUploadMode] = useState('update');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResults(null);
    setCsvData(null);
    setValidation(null);

    try {
      console.log('Parsing CSV...');
      const data = await parseCSV(selectedFile);
      console.log(`Parsed ${data.length} rows`);
      setCsvData(data);

      console.log('Validating...');
      const validationResult = validateProductCSV(data);
      console.log('Validation:', validationResult);
      setValidation(validationResult);
      
      if (validationResult.isValid) {
        toast.success(`CSV Loaded! Found ${data.length} products ready for upload.`);
      } else {
        toast.error(`CSV Validation Errors: ${validationResult.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to parse CSV file: ' + error.message);
      setValidation({
        isValid: false,
        errors: [error.message],
        warnings: [],
      });
    }
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!csvData || !validation?.isValid) return;

    setIsProcessing(true);
    setResults(null);

    try {
      console.log(`Uploading ${csvData.length} products...`);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          csvData,
          mode: uploadMode,
          batchSize: 50,
        }),
      });

      const result = await response.json();
      console.log('Result:', result);
      setResults(result);

      if (result.success) {
        toast.success(result.message || 'Bulk upload completed successfully!');
      } else {
        toast.error(result.message || 'Bulk upload completed with errors.');
      }

      // Auto-reset on success
      if (result.success && result.data?.failed === 0) {
        setTimeout(() => {
          setFile(null);
          setCsvData(null);
          setValidation(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
      setResults({
        success: false,
        message: 'Upload failed: ' + error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset
  const handleReset = () => {
    setFile(null);
    setCsvData(null);
    setValidation(null);
    setResults(null);
  };

  return (
    <AdminLayout>
      <div className="container">
        <div className="card">
          {/* Header */}
          <div className="header">
            <div>
              <h2 className="title">Bulk Upload Products</h2>
              <p className="subtitle">Upload multiple products at once using a CSV file</p>
            </div>
            {csvData && (
              <div className="badge">{csvData.length} Products</div>
            )}
          </div>

          {/* Template */}
          <div className="template-box">
            <div>
              <h3>Need a template?</h3>
              <p>Download our CSV template to get started</p>
            </div>
            <button onClick={downloadCSVTemplate} className="btn btn-secondary">
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="upload-section">
            <label>Upload CSV File</label>
            <label className="dropzone">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div className="dropzone-content">
                {file ? (
                  <>
                    <svg width="48" height="48" fill="#10b981" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                  </>
                ) : (
                  <>
                    <svg width="64" height="64" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="upload-text">Click to upload CSV file</p>
                    <p className="upload-hint">Maximum file size: 50MB</p>
                  </>
                )}
              </div>
            </label>
            {file && (
              <button onClick={handleReset} className="btn btn-danger">Clear</button>
            )}
          </div>

          {/* Upload Mode */}
          {csvData && validation?.isValid && (
            <div className="mode-section">
              <label>Upload Mode</label>
              <div className="mode-options">
                <label className={uploadMode === 'skip' ? 'active' : ''}>
                  <input
                    type="radio"
                    value="skip"
                    checked={uploadMode === 'skip'}
                    onChange={(e) => setUploadMode(e.target.value)}
                  />
                  <div>
                    <div className="mode-title">Skip Existing</div>
                    <div className="mode-desc">Skip products that already exist</div>
                  </div>
                </label>

                <label className={uploadMode === 'update' ? 'active' : ''}>
                  <input
                    type="radio"
                    value="update"
                    checked={uploadMode === 'update'}
                    onChange={(e) => setUploadMode(e.target.value)}
                  />
                  <div>
                    <div className="mode-title">Update Existing</div>
                    <div className="mode-desc">Update existing products</div>
                  </div>
                </label>

                <label className={uploadMode === 'replace' ? 'active' : ''}>
                  <input
                    type="radio"
                    value="replace"
                    checked={uploadMode === 'replace'}
                    onChange={(e) => setUploadMode(e.target.value)}
                  />
                  <div>
                    <div className="mode-title">Replace All</div>
                    <div className="mode-desc">Replace entire product data</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Validation */}
          {validation && (
            <div className={`validation ${validation.isValid ? 'success' : 'error'}`}>
              <div className="validation-header">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  {validation.isValid ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <div>
                  <div className="validation-title">
                    {validation.isValid ? 'CSV validation passed' : 'CSV validation failed'}
                  </div>
                  <div className="validation-desc">
                    {validation.isValid 
                      ? `${validation.totalRows} products ready to upload`
                      : 'Please fix the errors below'}
                  </div>
                </div>
              </div>

              {validation.errors?.length > 0 && (
                <ul className="error-list">
                  {validation.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {validation.errors.length > 10 && (
                    <li>... and {validation.errors.length - 10} more errors</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          {validation?.isValid && (
            <div className="actions">
              <button onClick={handleReset} className="btn btn-cancel" disabled={isProcessing}>
                Cancel
              </button>
              <button onClick={handleUpload} className="btn btn-primary" disabled={isProcessing}>
                {isProcessing ? `Processing...` : `Upload ${csvData?.length || 0} Products`}
              </button>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`results ${results.success ? 'success' : 'error'}`}>
              <div className="results-header">
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
                  {results.success ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <div>
                  <h3>{results.message}</h3>
                  {results.success && <p>Form will reset in 5 seconds</p>}
                </div>
              </div>

              {results.data && (
                <div className="stats">
                  <div className="stat">
                    <div className="stat-value created">{results.data.created}</div>
                    <div className="stat-label">Created</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value updated">{results.data.updated}</div>
                    <div className="stat-label">Updated</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value skipped">{results.data.skipped}</div>
                    <div className="stat-label">Skipped</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value failed">{results.data.failed}</div>
                    <div className="stat-label">Failed</div>
                  </div>
                </div>
              )}

              {results.data?.errors?.length > 0 && (
                <details className="error-details">
                  <summary>View Errors ({results.data.errors.length})</summary>
                  <ul>
                    {results.data.errors.map((error, idx) => (
                      <li key={idx}>Row {error.row}: {error.message}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .card { background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
        .title { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; }
        .subtitle { font-size: 14px; color: #6b7280; margin: 0; }
        .badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 16px; font-weight: 600; font-size: 14px; }
        .template-box { display: flex; justify-content: space-between; align-items: center; background: #dbeafe; border: 2px solid #93c5fd; border-radius: 12px; padding: 20px; margin-bottom: 32px; }
        .template-box h3 { font-size: 16px; font-weight: 600; margin: 0 0 4px 0; }
        .template-box p { font-size: 13px; color: #1e40af; margin: 0; }
        .upload-section { margin-bottom: 32px; }
        .upload-section label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
        .dropzone { display: block; border: 2px dashed #d1d5db; border-radius: 12px; padding: 48px; text-align: center; background: #fafafa; cursor: pointer; transition: all 0.3s; }
        .dropzone:hover { border-color: #667eea; background: #f5f7ff; }
        .dropzone-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .file-name { font-size: 15px; font-weight: 600; margin: 0; }
        .file-size { font-size: 13px; color: #6b7280; margin: 0; }
        .upload-text { font-size: 15px; margin: 0; }
        .upload-hint { font-size: 13px; color: #9ca3af; margin: 0; }
        .mode-section { margin-bottom: 32px; }
        .mode-section > label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
        .mode-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .mode-options label { display: flex; align-items: center; padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .mode-options label:hover, .mode-options label.active { border-color: #667eea; background: #f5f7ff; }
        .mode-options input { margin-right: 12px; }
        .mode-title { font-weight: 600; font-size: 15px; }
        .mode-desc { font-size: 13px; color: #6b7280; }
        .validation { border-radius: 12px; padding: 20px; margin-bottom: 32px; }
        .validation.success { background: #d1fae5; border: 2px solid #6ee7b7; }
        .validation.error { background: #fee2e2; border: 2px solid #fca5a5; }
        .validation-header { display: flex; align-items: start; gap: 16px; }
        .validation.success svg { color: #10b981; }
        .validation.error svg { color: #ef4444; }
        .validation-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
        .validation.success .validation-title { color: #065f46; }
        .validation.error .validation-title { color: #991b1b; }
        .validation-desc { font-size: 14px; }
        .validation.success .validation-desc { color: #047857; }
        .validation.error .validation-desc { color: #b91c1c; }
        .error-list { list-style: none; padding: 0; margin: 16px 0 0 40px; }
        .error-list li { font-size: 13px; color: #991b1b; padding: 4px 0; }
        .actions { display: flex; justify-content: flex-end; gap: 12px; }
        .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-secondary { background: #0ea5e9; color: white; }
        .btn-secondary:hover { background: #0284c7; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-primary:hover { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel { background: white; color: #6b7280; border: 2px solid #e5e7eb; }
        .btn-cancel:hover { background: #f9fafb; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-danger:hover { background: #fecaca; }
        .results { border-radius: 12px; padding: 24px; margin-top: 32px; }
        .results.success { background: #d1fae5; border: 2px solid #6ee7b7; }
        .results.error { background: #fee2e2; border: 2px solid #fca5a5; }
        .results-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .results.success svg { color: #10b981; }
        .results.error svg { color: #ef4444; }
        .results h3 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
        .results.success h3 { color: #065f46; }
        .results.error h3 { color: #991b1b; }
        .results p { font-size: 13px; margin: 0; color: #047857; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat { background: rgba(255,255,255,0.8); border-radius: 8px; padding: 16px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
        .stat-value.created { color: #10b981; }
        .stat-value.updated { color: #3b82f6; }
        .stat-value.skipped { color: #f59e0b; }
        .stat-value.failed { color: #ef4444; }
        .stat-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
        .error-details { background: rgba(255,255,255,0.6); border-radius: 8px; padding: 16px; }
        .error-details summary { cursor: pointer; font-weight: 600; font-size: 14px; }
        .error-details ul { list-style: none; padding: 0; margin: 12px 0 0 0; }
        .error-details li { font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }

        @media (max-width: 768px) {
          .mode-options, .stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminLayout>
  );
}