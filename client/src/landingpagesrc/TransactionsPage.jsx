import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import './css/TransactionsPage.css';

const filters = [
  { id: 'all', label: 'All activity' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'conversion', label: 'Conversions' },
  { id: 'market spin', label: 'Market spins' },
  { id: 'voting', label: 'Votes' }
];

const formatAmount = (change) => {
  const prefix = change.direction === 'credit' ? '+' : '-';
  return `${prefix}${Number(change.amount || 0).toLocaleString()} ${change.currency}`;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const TransactionsPage = () => {
  const { loggedInUser } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadedEmail, setLoadedEmail] = useState('');
  const [error, setError] = useState('');
  const email = loggedInUser?.email;
  const isLoading = loading || Boolean(email && loadedEmail !== email);

  const loadTransactions = useCallback(async (signal) => {
    if (!email) return;

    try {
      const response = await fetch(`[https://juancast.onrender.com](https://juancast.onrender.com)/api/users/transactions?email=${encodeURIComponent(email)}`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not load transactions.');
      if (!Array.isArray(result)) throw new Error('The transaction service returned an unexpected response.');
      setTransactions(result);
      setError('');
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') setError(fetchError.message || 'Could not load transactions.');
    } finally {
      if (!signal?.aborted) {
        setLoadedEmail(email);
        setLoading(false);
      }
    }
  }, [email]);

  useEffect(() => {
    const controller = new AbortController();
    loadTransactions(controller.signal);
    return () => controller.abort();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => (
    activeFilter === 'all'
      ? transactions
      : transactions.filter(transaction => transaction.category === activeFilter)
  ), [activeFilter, transactions]);

  const refreshTransactions = () => {
    setLoading(true);
    setError('');
    loadTransactions();
  };

  return (
    <section className="transactions-page">
      <header className="transactions-header">
        <div>
          <p className="transactions-eyebrow">ACCOUNT</p>
          <h1>Transactions</h1>
          <p className="transactions-subtitle">A record of your rewards, conversions, votes, and spins.</p>
        </div>
        <button
          className="transactions-refresh"
          type="button"
          onClick={refreshTransactions}
          disabled={!loggedInUser?.email || isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </header>

      {!loggedInUser?.email ? (
        <div className="transactions-state">
          <span className="transactions-state-icon" aria-hidden="true">↗</span>
          <h2>Sign in to view transactions</h2>
          <p>Your account activity will appear here.</p>
        </div>
      ) : (
        <>
          <nav className="transactions-filters" aria-label="Filter transactions">
            {filters.map(filter => (
              <button
                key={filter.id}
                type="button"
                className={`transactions-filter${activeFilter === filter.id ? ' active' : ''}`}
                aria-pressed={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </nav>

          {isLoading ? (
            <div className="transactions-state" role="status">Loading your activity...</div>
          ) : error ? (
            <div className="transactions-state transactions-state-error" role="alert">
              <h2>Transactions couldn’t load</h2>
              <p>{error}</p>
              <button className="transactions-retry" type="button" onClick={refreshTransactions}>Try again</button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="transactions-state">
              <span className="transactions-state-icon" aria-hidden="true">↗</span>
              <h2>{transactions.length ? 'No activity in this category' : 'No transactions yet'}</h2>
              <p>Completed account activity will show here.</p>
            </div>
          ) : (
            <div className="transactions-table-wrap">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th scope="col">Activity</th>
                    <th scope="col">Category</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction._id}>
                      <td data-label="Activity">
                        <strong>{transaction.description}</strong>
                        {transaction.details && <span>{transaction.details}</span>}
                      </td>
                      <td data-label="Category">
                        <span className={`transactions-category category-${transaction.category.replace(/\s+/g, '-')}`}>
                          {transaction.category}
                        </span>
                      </td>
                      <td className="transactions-amounts" data-label="Amount">
                        {(transaction.changes || []).map((change, index) => (
                          <span className={`transaction-amount ${change.direction}`} key={`${change.currency}-${index}`}>
                            {formatAmount(change)}
                          </span>
                        ))}
                      </td>
                      <td className="transactions-date" data-label="Date">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="transactions-note">Showing the 100 most recent recorded transactions. Activity before transaction tracking was added is not included.</p>
        </>
      )}
    </section>
  );
};

export default TransactionsPage;
