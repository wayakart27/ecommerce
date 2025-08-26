'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchPaginatedReferrals } from '@/actions/referralActions';

const TableRowSkeleton = () => (
  <tr>
    {[...Array(10)].map((_, i) => (
      <td key={i} className="px-4 py-3 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        {i === 1 && <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>}
      </td>
    ))}
  </tr>
);

// Payment status badge component
const PaymentStatusBadge = ({ status }) => {
  const statusConfig = {
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Paid'
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending'
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Failed'
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Rejected'
    },
    processing: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Processing'
    },
    refunded: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: 'Refunded'
    },
    default: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Unknown'
    }
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.default;

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default function AllReferralsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get all filter params from URL
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const dateRange = searchParams.get('dateRange') || 'all';
  const paymentStatus = searchParams.get('paymentStatus') || 'all';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchPaginatedReferrals({
          page,
          limit: 10,
          search,
          status,
          dateRange,
          paymentStatus
        });
        
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [page, search, status, dateRange, paymentStatus]);

  const handleFilterChange = (type, value) => {
    const params = new URLSearchParams(searchParams);
    
    if (type === 'search') {
      value ? params.set('search', value) : params.delete('search');
    } else if (type === 'status') {
      value !== 'all' ? params.set('status', value) : params.delete('status');
    } else if (type === 'dateRange') {
      value !== 'all' ? params.set('dateRange', value) : params.delete('dateRange');
    } else if (type === 'paymentStatus') {
      value !== 'all' ? params.set('paymentStatus', value) : params.delete('paymentStatus');
    } else if (type === 'page') {
      value > 1 ? params.set('page', value) : params.delete('page');
    }
    
    // Always reset to first page when filters change
    if (type !== 'page') params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/dashboard/referrals');
  };

  // Calculate total amount based on filtered data
  const calculateTotalAmount = () => {
    if (!data || !data.users) return 0;
    
    let total = 0;
    
    if (status === 'payout') {
      // Calculate total from payout history
      data.users.forEach(userData => {
        (userData.payoutHistory || []).forEach(payout => {
          total += payout.amount || 0;
        });
      });
    } else {
      // Calculate total from referrals
      data.users.forEach(userData => {
        (userData.pendingReferrals || []).forEach(ref => {
          total += ref.amount || 0;
        });
        (userData.completedReferrals || []).forEach(ref => {
          total += ref.amount || 0;
        });
      });
    }
    
    return total;
  };

  // Calculate correct totals for display
  const getDisplayTotals = () => {
    if (!data || !data.totals) return { referrals: 0, pending: 0, completed: 0, payout: 0, amount: 0 };
    
    // When showing all statuses, we need to calculate the correct totals
    if (status === 'all') {
      let referrals = 0;
      let pending = 0;
      let completed = 0;
      let payout = 0;
      let amount = 0;
      
      data.users.forEach(userData => {
        // Count referrals
        pending += userData.pendingReferrals?.length || 0;
        completed += userData.completedReferrals?.length || 0;
        referrals = pending + completed;
        
        // Count payouts
        payout += userData.payoutHistory?.length || 0;
        
        // Calculate amount
        if (userData.pendingReferrals) {
          userData.pendingReferrals.forEach(ref => {
            amount += ref.amount || 0;
          });
        }
        if (userData.completedReferrals) {
          userData.completedReferrals.forEach(ref => {
            amount += ref.amount || 0;
          });
        }
      });
      
      return { referrals, pending, completed, payout, amount };
    }
    
    // For specific status filters, use the provided totals
    return data.totals;
  };

  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!loading && !data) return <div className="text-center py-8">No referral data found</div>;

  const displayTotals = getDisplayTotals();

  // Combine all referrals from all users - show only payout history when status is 'payout'
  const allReferrals = data?.users.flatMap(userData => {
    if (status === 'payout') {
      // Show only payout history
      return (userData.payoutHistory || []).map(payout => ({
        ...payout,
        type: 'payout',
        referringUser: userData.user,
        isPayout: true
      }));
    } else {
      // Show only referrals (pending and completed)
      return [
        ...(userData.pendingReferrals || []).map(ref => ({ 
          ...ref, 
          type: 'pending',
          referringUser: userData.user
        })),
        ...(userData.completedReferrals || []).map(ref => ({
          ...ref,
          type: 'completed', 
          referringUser: userData.user
        }))
      ];
    }
  }) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">
            {status === 'payout' ? 'Payout History' : 'Referral Program Analytics'}
          </h1>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 bg-gray-50">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
            <p className="text-2xl font-semibold">
              {loading ? '--' : data?.pagination?.total || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {status === 'payout' ? 'Total Payouts' : 'Total Referrals'}
            </h3>
            <p className="text-2xl font-semibold">
              {loading ? '--' : displayTotals.referrals || 0}
            </p>
          </div>
          {status !== 'payout' && (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
                <p className="text-2xl font-semibold text-yellow-600">
                  {loading ? '--' : displayTotals.pending || 0}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Completed</h3>
                <p className="text-2xl font-semibold text-green-600">
                  {loading ? '--' : displayTotals.completed || 0}
                </p>
              </div>
            </>
          )}
          {status === 'payout' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Payouts</h3>
              <p className="text-2xl font-semibold text-yellow-600">
                {loading ? '--' : displayTotals.payout || 0}
              </p>
            </div>
          )}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
            <p className="text-2xl font-semibold text-purple-600">
              {loading ? '--' : `₦${calculateTotalAmount().toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder={status === 'payout' ? "Search payouts..." : "Search referrals..."}
                className="w-full p-2 pl-3 border rounded-md"
                value={search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="payout">Payouts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={paymentStatus}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              >
                <option value="all">All Payments</option>
                <option value="success">Paid</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                className="w-full p-2 border rounded-md"
                value={dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full p-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-6 py-3 flex justify-between items-center bg-white border-b">
          <div className="text-sm text-gray-600">
            {loading ? (
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            ) : (
              `Showing ${(page - 1) * 10 + 1}-${Math.min(page * 10, data?.pagination?.total || 0)} of ${data?.pagination?.total || 0} ${status === 'payout' ? 'payouts' : 'referrals'}`
            )}
          </div>
        </div>

        {/* Referrals/Payouts Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referring User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {status === 'payout' ? 'Payout Type' : 'Referee'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                {status !== 'payout' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {status === 'payout' ? 'Payout Status' : 'Referral Status'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
              ) : allReferrals.length > 0 ? (
                allReferrals.map((ref, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ref.referringUser?.name}</div>
                      <div className="text-sm text-gray-500">{ref.referringUser?.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {status === 'payout' ? (
                        <div className="text-sm font-medium text-gray-900">SYSTEM PAYOUT</div>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">{ref.referee?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{ref.referee?.email || 'N/A'}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${ref.type === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          ref.type === 'payout' ? 'bg-purple-100 text-purple-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {ref.type}
                      </span>
                    </td>
                    {status !== 'payout' && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {ref.order ? (
                          <div>
                            <div className="font-medium">#{ref.order.id?.slice(-6) || 'N/A'}</div>
                            <div>₦{(ref.order.total)?.toLocaleString() || '0'}</div>
                          </div>
                        ) : 'N/A'}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ref.amount ? `₦${(ref.amount).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ref.date || ref.requestedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${ref.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          ref.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {ref.status || (ref.type === 'pending' ? 'pending' : ref.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PaymentStatusBadge status={ref.paymentStatus || ref.order?.paymentStatus || 'pending'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={status === 'payout' ? 9 : 10} className="px-6 py-4 text-center text-gray-500">
                    No {status === 'payout' ? 'payouts' : 'referrals'} match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-white border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {data?.pagination?.total > 0 && (
              `Total Amount: ₦${calculateTotalAmount().toLocaleString()}`
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('page', page - 1)}
              disabled={page === 1 || loading}
              className={`px-3 py-1 rounded-md border ${page === 1 || loading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange('page', page + 1)}
              disabled={!data?.pagination?.totalPages || page >= data.pagination.totalPages || loading}
              className={`px-3 py-1 rounded-md border ${!data?.pagination?.totalPages || page >= data.pagination.totalPages || loading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}