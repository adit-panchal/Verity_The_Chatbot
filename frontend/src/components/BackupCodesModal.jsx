import React, { useState } from 'react';
import { X, Key, Download, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/BackupCodesModal.css';

const BackupCodesModal = ({ isOpen, backupCodes, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([`ChatBot 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codesText}\n\nKeep these codes safe and secure!`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Backup Codes</title>');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:40px;}h1{color:#333;}ul{list-style:none;padding:0;}li{background:#f4f4f4;padding:15px;margin:10px 0;border-radius:8px;font-size:18px;font-weight:bold;letter-spacing:2px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>ChatBot 2FA Backup Codes</h1>');
    printWindow.document.write(`<p>Generated: ${new Date().toLocaleString()}</p>`);
    printWindow.document.write('<p><strong>Keep these codes safe and secure!</strong></p>');
    printWindow.document.write('<ul>');
    backupCodes.forEach(code => {
      printWindow.document.write(`<li>${code}</li>`);
    });
    printWindow.document.write('</ul>');
    printWindow.document.write('<p style="margin-top:30px;color:#666;font-size:14px;">Each code can only be used once. Store them in a secure location.</p>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen || !backupCodes || backupCodes.length === 0) return null;

  return (
    <div className="backup-codes-overlay" onClick={onClose}>
      <div className="backup-codes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="backup-codes-header">
          <div className="header-content">
            <Key size={28} className="header-icon" />
            <div>
              <h2>Save Your Backup Codes</h2>
              <p>Store these codes in a safe place</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="backup-codes-body">
          <div className="warning-box">
            <AlertTriangle size={20} />
            <div>
              <strong>Important:</strong> Each code can only be used once. Save these codes now - you won't see them again!
            </div>
          </div>

          <div className="codes-container">
            <div className="codes-grid">
              {backupCodes.map((code, index) => (
                <div key={index} className="code-item">
                  <span className="code-number">{index + 1}</span>
                  <span className="code-value">{code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="actions-container">
            <button className="action-btn copy-btn" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy All
                </>
              )}
            </button>
            <button className="action-btn download-btn" onClick={handleDownload}>
              <Download size={18} />
              Download
            </button>
            <button className="action-btn print-btn" onClick={handlePrint}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
          </div>

          <div className="info-box">
            <p><strong>When to use backup codes:</strong></p>
            <ul>
              <li>You don't have access to your email</li>
              <li>You need to login from a new device</li>
              <li>Emergency account recovery</li>
            </ul>
          </div>

          <button className="confirm-btn" onClick={onClose}>
            I've Saved My Codes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupCodesModal;
