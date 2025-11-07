import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { X, UploadCloud } from 'lucide-react';
import ClickOutside from '@/components/ClickOutside';
import Loader from '@/components/common/Loader';
import BankDetailsForm from './BankDetailsForm'; // Imported local component
import { BillingSettings, UpdateBillingSettingsPayload, BankDetails } from '@/types/billing';
import { billingService } from '@/services/billing.service';

interface BillingSettingsModalProps {
    settings: BillingSettings;
    onClose: () => void;
    mutation: ReturnType<typeof useMutation<BillingSettings, unknown, UpdateBillingSettingsPayload>>;
}

const BillingSettingsModal: React.FC<BillingSettingsModalProps> = ({ settings, onClose, mutation }) => {
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
        if (e.target.files && e.target.files.length > 0) {
            setQrCodeFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: UpdateBillingSettingsPayload = {
            ...formData,
        };

        const cleanedBankDetails = bankDetails ? Object.entries(bankDetails).reduce((acc: Partial<BankDetails>, [key, value]) => {
            if (value && String(value).trim() !== '') {
                acc[key as keyof BankDetails] = value as string;
            }
            return acc;
        }, {}) : {};

        if (Object.keys(cleanedBankDetails).length > 0) {
            payload.bank_details = cleanedBankDetails;
        } else if (bankDetails) {
            payload.bank_details = {};
        }

        if (qrCodeFile) {
            toast.info("QR Code file upload requires an API structure that supports file uploads (e.g., FormData). Only text fields will be saved.");
        }

        mutation.mutate(payload);
    };

    const taxRatePercent = (formData.tax_rate !== undefined ? formData.tax_rate! * 100 : settings.tax_rate * 100).toFixed(2);

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4">
            <ClickOutside onOutsideClick={onClose}>
                {/* Responsive modal container: max-w-lg on mobile/default, larger on md+ */}
                <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-xl bg-white p-6 dark:bg-boxdark max-h-[95vh] overflow-y-auto transform transition-all duration-300 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                        {/* Ensure title is responsive and doesn't hide/overflow */}
                        <h3 className="text-xl font-bold text-black dark:text-white truncate mr-4">Edit Billing Settings</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1 flex-shrink-0">
                            <X size={24} />
                        </button>
                    </div>
                    {mutation.isPending ? (
                        <div className="flex justify-center py-12"><Loader /></div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Grid layout for responsiveness */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="mb-1">
                                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Company Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name || ''}
                                        onChange={handleChange}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                        required
                                    />
                                </div>
                                <div className="mb-1">
                                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                        required
                                    />
                                </div>
                                <div className="mb-1">
                                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                        required
                                    />
                                </div>
                                <div className="mb-1">
                                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="tax_rate"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={taxRatePercent}
                                        onChange={handleChange}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                        required
                                    />
                                </div>
                                <div className="mb-1 md:col-span-2">
                                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Currency</label>
                                    <input
                                        type="text"
                                        name="currency"
                                        value={formData.currency || ''}
                                        onChange={handleChange}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                        required
                                    />
                                </div>
                                <div className="mb-3 md:col-span-2">
                                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Address</label>
                                    <textarea
                                        name="address"
                                        rows={3}
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <BankDetailsForm bankDetails={bankDetails} setBankDetails={setBankDetails} />

                            {/* Enhanced QR Code File Input Styling */}
                            <div className="mt-6 md:col-span-2">
                                <label htmlFor="qr-code-file" className="mb-1.5 block text-black dark:text-white text-sm font-medium">QR Code Image</label>
                                {settings.qr_code_image_url && (
                                    <a href={settings.qr_code_image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block mb-2">View Current QR Code</a>
                                )}
                                <div className="relative border-2 border-dashed border-stroke dark:border-strokedark rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-meta-4/30 transition-colors">
                                    <input
                                        type="file"
                                        id="qr-code-file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <UploadCloud size={24} className="mx-auto text-gray-500 dark:text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {qrCodeFile ? qrCodeFile.name : 'Click to upload or drag & drop (Max 5MB)'}
                                    </p>
                                </div>
                                <p className='text-xs text-gray-500 mt-1 text-center'>Only PNG, JPG, or SVG files are accepted.</p>
                            </div>

                            <div className="flex gap-4 mt-6 justify-end border-t pt-4 dark:border-strokedark md:col-span-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg bg-gray-300 dark:bg-gray-600 py-2.5 px-6 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700 text-base transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="rounded-lg bg-success py-2.5 px-6 text-white hover:bg-success/90 disabled:opacity-50 text-base transition-colors font-medium shadow-md"
                                >
                                    {mutation.isPending ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </ClickOutside>
        </div>
    );
};

export default BillingSettingsModal;