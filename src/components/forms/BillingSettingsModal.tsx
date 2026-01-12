import React, { useState } from 'react';
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
    const [formData, setFormData] = useState<UpdateBillingSettingsPayload>({
        company_name: settings.company_name,
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        tax_rate: settings.tax_rate,
        currency: settings.currency,
    });

    const [bankDetails, setBankDetails] = useState<Partial<BankDetails> | null>(settings.bank_details);
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

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

        const payload: UpdateBillingSettingsPayload = { ...formData };

        const cleanedBankDetails = bankDetails
            ? Object.fromEntries(Object.entries(bankDetails).filter(([_, v]) => v?.toString().trim()))
            : {};

        if (Object.keys(cleanedBankDetails).length > 0) payload.bank_details = cleanedBankDetails;
        else if (bankDetails) payload.bank_details = {};

        if (qrCodeFile) {
            toast.info("QR Code upload requires FormData support on backend.");
        }

        mutation.mutate(payload);
    };

    const taxRatePercent = (formData.tax_rate ?? settings.tax_rate) * 100;

    return (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4">
            <ClickOutside onOutsideClick={onClose} className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="w-full rounded-lg bg-white dark:bg-boxdark shadow-2xl flex flex-col max-h-full">
                    <div className="flex items-center justify-between border-b dark:border-strokedark px-4 sm:px-6 py-3 shrink-0">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                            {canEdit ? 'Edit Billing Settings' : 'Billing Settings'}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-4 sm:p-6">
                        <form id="billing-form" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-1">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-1">Tax Rate (%)</label>
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
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-black dark:text-white mb-1">Currency</label>
                                    <input
                                        type="text"
                                        name="currency"
                                        value={formData.currency || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                    <label className="block font-medium text-black dark:text-white mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        rows={2}
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!canEdit}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black dark:text-white dark:border-form-strokedark dark:bg-form-input focus:border-primary outline-none resize-none disabled:bg-gray-100 disabled:dark:bg-boxdark-2 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className={`mt-4 border-t dark:border-strokedark pt-4 ${!canEdit ? 'pointer-events-none opacity-70' : ''}`}>
                                <BankDetailsForm bankDetails={bankDetails} setBankDetails={setBankDetails} />
                            </div>

                            <div className="mt-5">
                                <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                                    QR Code Image
                                </label>

                                {settings.qr_code_image_url && (
                                    <a
                                        href={settings.qr_code_image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline block mb-2"
                                    >
                                        View current QR code
                                    </a>
                                )}

                                {canEdit && (
                                    <div className="relative inline-block w-full">
                                        <div className="border-2 border-dashed border-stroke dark:border-strokedark rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/svg+xml"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <UploadCloud size={20} className="mx-auto text-gray-500 dark:text-gray-400 mb-1" />
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {qrCodeFile ? qrCodeFile.name : 'Click to upload QR code'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 5MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 border-t dark:border-strokedark px-4 sm:px-6 py-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-medium rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                        >
                            {canEdit ? 'Cancel' : 'Close'}
                        </button>
                        {canEdit && (
                            <button
                                type="submit"
                                form="billing-form"
                                disabled={mutation.isPending}
                                className="px-5 py-2 text-sm font-medium rounded bg-success text-white hover:bg-success/90 disabled:opacity-50 transition-colors shadow-md"
                            >
                                {mutation.isPending ? 'Saving...' : 'Save Settings'}
                            </button>
                        )}
                    </div>
                </div>
            </ClickOutside>
        </div>
    );
};

export default BillingSettingsModal;