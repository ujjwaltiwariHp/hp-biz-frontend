import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { X, UploadCloud } from 'lucide-react';
import ClickOutside from '@/components/ClickOutside';
import BankDetailsForm from './BankDetailsForm';
import { BillingSettings, UpdateBillingSettingsPayload, BankDetails } from '@/types/billing';

interface BillingSettingsModalProps {
    settings: BillingSettings;
    onClose: () => void;
    mutation: ReturnType<typeof useMutation<BillingSettings, unknown, UpdateBillingSettingsPayload>>;
    canEdit: boolean;
}

const BillingSettingsModal: React.FC<BillingSettingsModalProps> = ({ settings, onClose, mutation, canEdit }) => {
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState<UpdateBillingSettingsPayload>({
        company_name: settings.company_name,
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        tax_rate: settings.tax_rate,
        currency: 'USD', // Force USD standard
    });

    const [bankDetails, setBankDetails] = useState<Partial<BankDetails> | null>(settings.bank_details);
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'tax_rate' ? (isNaN(parseFloat(value)) ? undefined : parseFloat(value) / 100) : value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setQrCodeFile(e.target.files[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

        // Check for changes
        const currentTaxRate = formData.tax_rate ?? 0;
        const initialTaxRate = settings.tax_rate ?? 0;

        // Clean bank details for comparison
        const currentBankDetails = bankDetails
            ? Object.fromEntries(Object.entries(bankDetails).filter(([_, v]) => v?.toString().trim()))
            : {};
        const initialBankDetails = settings.bank_details
            ? Object.fromEntries(Object.entries(settings.bank_details).filter(([_, v]) => v?.toString().trim()))
            : {};

        const hasChanges =
            formData.company_name !== settings.company_name ||
            formData.address !== settings.address ||
            formData.email !== settings.email ||
            formData.phone !== settings.phone ||
            Math.abs(currentTaxRate - initialTaxRate) > 0.0001 || // Float comparison
            formData.currency !== (settings.currency || 'USD') || // Check if currency standardization is needed
            JSON.stringify(currentBankDetails) !== JSON.stringify(initialBankDetails) ||
            qrCodeFile !== null;

        if (!hasChanges) {
            toast.warning("No changes detected.");
            return;
        }

        const payload: UpdateBillingSettingsPayload = { ...formData };

        if (Object.keys(currentBankDetails).length > 0) payload.bank_details = currentBankDetails;
        else if (bankDetails) payload.bank_details = {};

        if (qrCodeFile) {
            toast.info("QR Code upload requires FormData support on backend.");
        }

        mutation.mutate(payload);
    };

    const taxRatePercent = (formData.tax_rate ?? settings.tax_rate) * 100;

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 sm:p-6 transition-all duration-300">
            <ClickOutside onOutsideClick={onClose} className="w-full max-w-4xl flex flex-col max-h-[90vh] sm:max-h-[85vh] transform transition-all">
                <div className="w-full rounded-lg bg-white dark:bg-boxdark shadow-2xl flex flex-col max-h-full overflow-hidden">
                    <div className="flex items-center justify-between border-b dark:border-strokedark px-4 sm:px-6 py-4 shrink-0 bg-white dark:bg-boxdark z-10">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                            {canEdit ? 'Edit Billing Settings' : 'Billing Settings'}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-meta-4">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        <form id="billing-form" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2.5 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2.5 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-2">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2.5 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-2">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="tax_rate"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={taxRatePercent.toFixed(2)}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2.5 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-2">Currency</label>
                                    <input
                                        type="text"
                                        name="currency"
                                        value="USD"
                                        readOnly
                                        disabled
                                        className="w-full rounded border border-stroke bg-gray-100 px-3 py-2.5 text-black dark:text-white dark:border-form-strokedark dark:bg-boxdark-2 cursor-not-allowed opacity-70 font-medium"
                                        title="Currency is standard set to USD"
                                    />
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                    <label className="block font-medium text-black dark:text-white mb-2">Address</label>
                                    <textarea
                                        name="address"
                                        rows={2}
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2.5 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none resize-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>
                            </div>

                            <div className={`mt-6 border-t dark:border-strokedark pt-6 ${!canEdit ? 'pointer-events-none opacity-70' : ''}`}>
                                <BankDetailsForm bankDetails={bankDetails} setBankDetails={setBankDetails} />
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                                    QR Code Image
                                </label>

                                {settings.qr_code_image_url && (
                                    <a
                                        href={settings.qr_code_image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline block mb-3 font-medium"
                                    >
                                        View current QR code
                                    </a>
                                )}

                                {canEdit && (
                                    <div className="relative inline-block w-full">
                                        <div className="border-2 border-dashed border-stroke dark:border-strokedark rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all hover:border-primary">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/svg+xml"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <UploadCloud size={24} className="mx-auto text-primary mb-2" />
                                            <p className="text-sm text-black dark:text-white font-medium">
                                                {qrCodeFile ? qrCodeFile.name : 'Click to upload'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 5MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 border-t dark:border-strokedark px-4 sm:px-6 py-4 shrink-0 bg-gray-50 dark:bg-boxdark-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium rounded border border-stroke dark:border-strokedark hover:bg-white dark:hover:bg-meta-4 text-black dark:text-white transition-all shadow-sm"
                        >
                            {canEdit ? 'Cancel' : 'Close'}
                        </button>
                        {canEdit && (
                            <button
                                type="submit"
                                form="billing-form"
                                disabled={mutation.isPending}
                                className="px-6 py-2.5 text-sm font-medium rounded bg-primary text-white hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                            >
                                {mutation.isPending ? (
                                    <>Saving...</>
                                ) : (
                                    <>Save Changes</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </ClickOutside>
        </div>,
        document.body
    );
};

export default BillingSettingsModal;