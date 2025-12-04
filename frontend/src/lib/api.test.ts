import { api, SUPPORTED_CURRENCIES, FREQUENCY_OPTIONS } from './api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('setToken', () => {
    it('sets token in localStorage', () => {
      api.setToken('test-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('removes token when null', () => {
      api.setToken(null);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('getToken', () => {
    it('returns token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('stored-token');
      const token = api.getToken();
      expect(token).toBe('stored-token');
    });

    it('returns null when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      // Reset the internal token state
      api.setToken(null);
      const token = api.getToken();
      expect(token).toBeNull();
    });
  });

  describe('register', () => {
    it('calls register endpoint with correct data', async () => {
      const mockResponse = {
        token: 'new-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('calls login endpoint with correct data', async () => {
      const mockResponse = {
        token: 'auth-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error on invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      await expect(
        api.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getMe', () => {
    it('calls me endpoint with auth header', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', email: 'test@example.com' }),
      });

      await api.getMe();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('transactions', () => {
    beforeEach(() => {
      api.setToken('test-token');
    });

    it('getTransactions calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getTransactions();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/transactions',
        expect.anything()
      );
    });

    it('getTransactions with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getTransactions({ type: 'expense', category: 'Food' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=expense'),
        expect.anything()
      );
    });

    it('createTransaction sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.createTransaction({
        type: 'expense',
        amount: 100,
        category: 'Food',
        date: '2024-06-15',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/transactions',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateTransaction sends PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.updateTransaction('1', {
        type: 'expense',
        amount: 150,
        category: 'Food',
        date: '2024-06-15',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/transactions/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteTransaction sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteTransaction('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/transactions/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('budgets', () => {
    beforeEach(() => {
      api.setToken('test-token');
    });

    it('getBudgets calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getBudgets();

      expect(mockFetch).toHaveBeenCalledWith('/api/budgets', expect.anything());
    });

    it('createBudget sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.createBudget({
        category: 'Food',
        amount: 500,
        startDate: '2024-06-01',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/budgets',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('deleteBudget sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteBudget('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/budgets/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('savings goals', () => {
    beforeEach(() => {
      api.setToken('test-token');
    });

    it('getSavingsGoals calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getSavingsGoals();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/savings-goals',
        expect.anything()
      );
    });

    it('contributeSavingsGoal sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', currentAmount: '600' }),
      });

      await api.contributeSavingsGoal('1', 100);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/savings-goals/1/contribute',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('debts', () => {
    beforeEach(() => {
      api.setToken('test-token');
    });

    it('getDebts calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getDebts();

      expect(mockFetch).toHaveBeenCalledWith('/api/debts', expect.anything());
    });

    it('makeDebtPayment sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.makeDebtPayment('1', 500, '2024-06-15');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/debts/1/payment',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getPayoffPlan calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ monthsToPayoff: 36 }),
      });

      await api.getPayoffPlan('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/debts/1/payoff-plan'),
        expect.anything()
      );
    });
  });

  describe('recurring transactions', () => {
    beforeEach(() => {
      api.setToken('test-token');
    });

    it('getRecurringTransactions calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getRecurringTransactions();

      expect(mockFetch).toHaveBeenCalledWith('/api/recurring', expect.anything());
    });

    it('pauseRecurringTransaction sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', isActive: false }),
      });

      await api.pauseRecurringTransaction('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recurring/1/pause',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('resumeRecurringTransaction sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', isActive: true }),
      });

      await api.resumeRecurringTransaction('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recurring/1/resume',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getUpcomingBills calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await api.getUpcomingBills();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recurring/upcoming',
        expect.anything()
      );
    });
  });

  describe('error handling', () => {
    it('throws error with message from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Custom error message' }),
      });

      await expect(api.login({ email: '', password: '' })).rejects.toThrow(
        'Custom error message'
      );
    });

    it('throws generic error when no message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Parse error')),
      });

      await expect(api.login({ email: '', password: '' })).rejects.toThrow(
        'Request failed'
      );
    });
  });
});

describe('ApiClient - additional methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.setToken('test-token');
  });

  describe('updateSettings', () => {
    it('calls update settings endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', name: 'Updated', currency: 'EUR' }),
      });

      await api.updateSettings({ name: 'Updated', currency: 'EUR' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/settings',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('dashboard', () => {
    it('getDashboard calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ totalIncome: '1000' }),
      });

      await api.getDashboard();

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard', expect.anything());
    });

    it('getMonthlyDashboard calls correct endpoint with params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ totalIncome: '1000' }),
      });

      await api.getMonthlyDashboard(2024, 6);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/dashboard/monthly/2024/6',
        expect.anything()
      );
    });
  });

  describe('savings goals - additional', () => {
    it('createSavingsGoal sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1', name: 'Emergency Fund' }),
      });

      await api.createSavingsGoal({
        name: 'Emergency Fund',
        targetAmount: 10000,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/savings-goals',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateSavingsGoal sends PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', name: 'Updated Goal' }),
      });

      await api.updateSavingsGoal('1', {
        name: 'Updated Goal',
        targetAmount: 15000,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/savings-goals/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteSavingsGoal sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteSavingsGoal('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/savings-goals/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('debts - additional', () => {
    it('createDebt sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1', name: 'Mortgage' }),
      });

      await api.createDebt({
        name: 'Mortgage',
        type: 'mortgage',
        originalAmount: 200000,
        interestRate: 4.5,
        minimumPayment: 1200,
        dueDay: 15,
        startDate: '2024-01-01',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/debts',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateDebt sends PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', name: 'Updated Mortgage' }),
      });

      await api.updateDebt('1', {
        name: 'Updated Mortgage',
        type: 'mortgage',
        originalAmount: 200000,
        interestRate: 4.5,
        minimumPayment: 1200,
        dueDay: 15,
        startDate: '2024-01-01',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/debts/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteDebt sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteDebt('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/debts/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('getPayoffPlan with monthlyPayment param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ monthsToPayoff: 24 }),
      });

      await api.getPayoffPlan('1', 500);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('monthlyPayment=500'),
        expect.anything()
      );
    });

    it('calculateInterest sends correct params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ monthlyPayment: '500' }),
      });

      await api.calculateInterest({
        principal: 10000,
        interestRate: 5,
        termMonths: 36,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/debts/calculator'),
        expect.anything()
      );
    });
  });

  describe('recurring transactions - additional', () => {
    it('createRecurringTransaction sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.createRecurringTransaction({
        type: 'expense',
        amount: 100,
        category: 'Utilities',
        frequency: 'monthly',
        startDate: '2024-06-01',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recurring',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateRecurringTransaction sends PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.updateRecurringTransaction('1', { amount: 150 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recurring/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteRecurringTransaction sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteRecurringTransaction('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/recurring/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('chat', () => {
    it('sends chat message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'AI response' }),
      });

      await api.chat('Hello AI');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('budgets - additional', () => {
    it('updateBudget sends PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1' }),
      });

      await api.updateBudget('1', {
        category: 'Food',
        amount: 600,
        startDate: '2024-06-01',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/budgets/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
});

describe('Constants', () => {
  describe('SUPPORTED_CURRENCIES', () => {
    it('has expected currencies', () => {
      const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code);
      expect(currencyCodes).toContain('USD');
      expect(currencyCodes).toContain('EUR');
      expect(currencyCodes).toContain('GBP');
      expect(currencyCodes).toContain('VND');
      expect(currencyCodes).toContain('JPY');
    });

    it('has code, name, and symbol for each currency', () => {
      SUPPORTED_CURRENCIES.forEach((currency) => {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
        expect(currency.code.length).toBe(3);
      });
    });
  });

  describe('FREQUENCY_OPTIONS', () => {
    it('has expected frequencies', () => {
      const values = FREQUENCY_OPTIONS.map((f) => f.value);
      expect(values).toContain('daily');
      expect(values).toContain('weekly');
      expect(values).toContain('biweekly');
      expect(values).toContain('monthly');
      expect(values).toContain('yearly');
    });

    it('has value and label for each option', () => {
      FREQUENCY_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
      });
    });
  });
});

