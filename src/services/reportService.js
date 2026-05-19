export const downloadVendorAudit = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/reports/vendor-audit', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Server failed to generate report');
  }

  // Get the data as a Blob
  const blob = await response.blob();
  
  // Check if blob is empty
  if (blob.size === 0) {
    throw new Error("Backend sent an empty file (0.0 kB). Check PDFKit logic.");
  }

  // Create a localized URL
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Force the browser to treat it as a download, not a preview
  link.setAttribute('download', `NextCart_Audit_Final.pdf`);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
};