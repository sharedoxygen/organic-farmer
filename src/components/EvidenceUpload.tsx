import React, { useRef, useState } from 'react';

interface EvidenceUploadProps {
  complianceId: string;
  onUploadSuccess?: (evidence: any) => void;
}

const EvidenceUpload: React.FC<EvidenceUploadProps> = ({ complianceId, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // For demo, simulate upload and use a fake URL
      // In production, upload to S3 or similar and get URL
      const fileUrl = URL.createObjectURL(file);
      const payload = {
        complianceId,
        fileUrl, // Replace with real uploaded URL in production
        fileType: file.type,
        description,
      };
      const res = await fetch('/api/compliance/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Upload failed');
      const evidence = await res.json();
      setSuccess('Evidence uploaded successfully!');
      if (onUploadSuccess) onUploadSuccess(evidence);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #90caf9', padding: 16, borderRadius: 8, background: '#f1f8e9', marginBottom: 16 }}>
      <h4>📎 Upload Compliance Evidence</h4>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        disabled={uploading}
        onChange={handleFileChange}
        style={{ marginBottom: 8 }}
      />
      <br />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={uploading}
        style={{ marginBottom: 8, width: '80%' }}
      />
      <br />
      {uploading && <span style={{ color: '#1976d2' }}>Uploading...</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
      {success && <span style={{ color: 'green' }}>{success}</span>}
    </div>
  );
};

export default EvidenceUpload;
