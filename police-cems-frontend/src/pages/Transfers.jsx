import { useState } from 'react';
import PendingTransfers from '../components/Transfers/PendingTransfers';
import TransferHistory from '../components/Transfers/TransferHistory';

export default function Transfers() {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Evidence Transfers</h1>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Transfers
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transfer History
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {activeTab === 'pending' && <PendingTransfers />}
          {activeTab === 'history' && <TransferHistory />}
        </div>
      </div>
    </div>
  );
}
