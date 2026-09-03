import { vi } from 'vitest';
import { type OAuthAuthentication } from 'extension/oauth/oauth.model';
import { type OAuthService } from 'extension/oauth/oauth.service';

export type OAuthServiceMock = {
  authenticate: ReturnType<typeof vi.fn>;
  getAuthentication: ReturnType<typeof vi.fn>;
  isAuthenticated: ReturnType<typeof vi.fn>;
  requestAuthentication: ReturnType<typeof vi.fn>;
  revokeAuthentication: ReturnType<typeof vi.fn>;
};

/**
 * Creates a stub {@link OAuthService} that reports the given authentication (or none, when `null`) for every provider.
 */
export const createOAuthServiceMock = (authentication: OAuthAuthentication | null = null): OAuthServiceMock => ({
  authenticate: vi.fn().mockResolvedValue(authentication),
  getAuthentication: vi.fn().mockResolvedValue(authentication),
  isAuthenticated: vi.fn().mockResolvedValue(authentication != null),
  requestAuthentication: vi.fn().mockResolvedValue(authentication),
  revokeAuthentication: vi.fn().mockResolvedValue(undefined),
});

/** Casts an {@link OAuthServiceMock} for injection into a class expecting the real {@link OAuthService}. */
export const asOAuthService = (mock: OAuthServiceMock): OAuthService => mock as unknown as OAuthService;
