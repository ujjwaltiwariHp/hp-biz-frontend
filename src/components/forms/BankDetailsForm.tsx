import React from 'react';
import { BankDetails } from '@/types/billing'; // Assuming BankDetails type is available

interface BankDetailsFormProps {
    bankDetails: Partial<BankDetails> | null;
    setBankDetails: React.Dispatch<React.SetStateAction<Partial<BankDetails> | null>>;
}

const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ bankDetails, setBankDetails }) => {
    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBankDetails(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const currentDetails = bankDetails || {};

    return (
        <div className="space-y-3 md:col-span-2">
            <h4 className="font-semibold text-black dark:text-white mt-4 pt-3 border-t dark:border-strokedark text-lg">Bank Details (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Bank Name</label>
                    <input
                        type="text"
                        name="bank_name"
                        value={currentDetails.bank_name || ''}
                        onChange={handleBankChange}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">Account Number</label>
                    <input
                        type="text"
                        name="account_number"
                        value={currentDetails.account_number || ''}
                        onChange={handleBankChange}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-black dark:text-white text-sm font-medium">IFSC Code</label>
                    <input
                        type="text"
                        name="ifsc_code"
                        value={currentDetails.ifsc_code || ''}
                        onChange={handleBankChange}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                    />
                </div>
            </div>
        </div>
    );
};

export default BankDetailsForm;