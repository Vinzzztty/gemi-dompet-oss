'use client';

import React from 'react';

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** danger = merah (hapus), primary = biru (aksi positif) */
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    isOpen,
    title = 'Konfirmasi Hapus',
    message = 'Apakah Anda yakin ingin menghapus item ini?',
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    variant = 'danger',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="delete-modal-overlay" onClick={onCancel}>
                <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="delete-modal-actions">
                        <button type="button" className="cancel-delete-btn" onClick={onCancel}>
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            className={variant === 'primary' ? 'confirm-primary-btn' : 'confirm-delete-btn'}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 101;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .delete-modal {
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          max-width: 400px;
          width: 90%;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .delete-modal h3 {
          margin: 0 0 var(--space-3) 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .delete-modal p {
          margin: 0 0 var(--space-5) 0;
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .delete-modal-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
        }

        .cancel-delete-btn,
        .confirm-delete-btn,
        .confirm-primary-btn {
          padding: var(--space-2-5) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-delete-btn {
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          color: var(--text-primary);
        }

        .cancel-delete-btn:hover {
          background: var(--gray-200);
        }

        .confirm-delete-btn {
          background: var(--red-500);
          border: none;
          color: white;
        }

        .confirm-delete-btn:hover {
          background: var(--red-600);
        }

        .confirm-primary-btn {
          background: #3b82f6;
          border: none;
          color: white;
        }

        .confirm-primary-btn:hover {
          background: #2563eb;
        }
      `}</style>
        </>
    );
};
