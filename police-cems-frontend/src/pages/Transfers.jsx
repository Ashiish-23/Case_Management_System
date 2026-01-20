import { useState } from "react";
import PendingTransfers from "../components/Transfers/PendingTransfers";
import TransferHistory from "../components/Transfers/TransferHistory";

export default function Transfers() {
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Called after accept / reject
   * Forces both pending + history to refresh
   */
  const handleTransferAction = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-blue-900 text-white p-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Evidence Transfers</h1>
        <p className="text-slate-300 text-sm mt-1">
          Manage incoming transfers and view movement history
        </p>
      </div>

      {/* Pending Transfers */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">
          Pending Transfers
        </h2>

        <PendingTransfers
          refreshKey={refreshKey}
          onActionComplete={handleTransferAction}
        />
      </section>

      {/* Transfer History */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Transfer History
        </h2>

        <TransferHistory refreshKey={refreshKey} />
      </section>

    </div>
  );
}
