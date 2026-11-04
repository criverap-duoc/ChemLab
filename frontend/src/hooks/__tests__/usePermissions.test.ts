import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { authService } from '../../services/authService';
import { User } from '../../types';

jest.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getPermissions: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const adminUser: User = {
  id: '3f0b0f0e-0000-4000-8000-000000000001',
  email: 'admin@chemlab.com',
  firstName: 'Admin',
  lastName: 'ChemLab',
  role: 'ADMIN',
  permissions: [],
  createdAt: '2026-01-01T00:00:00Z',
  isActive: true,
};

describe('usePermissions', () => {
  it('isAdmin_returnsTrueForAdminRole', () => {
    mockedAuthService.getCurrentUser.mockReturnValue(adminUser);
    mockedAuthService.getPermissions.mockReturnValue([]);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.hasRole('ADMIN')).toBe(true);
  });
});
