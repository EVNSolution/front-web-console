import { useEffect, useState } from 'react';

import { getNavigationPolicy } from '../api/navigationPolicy';
import type { HttpClient, SessionPayload } from '../api/http';
import { getErrorMessage } from '../api/http';
import { getDefaultAllowedNavKeys, type NavItemKey } from '../authScopes';

type NavigationPolicyState = {
  allowedNavKeys: NavItemKey[];
  isLoading: boolean;
  errorMessage: string | null;
  source: string;
};

export function useNavigationPolicy(client: HttpClient, session: SessionPayload | null): NavigationPolicyState {
  const [state, setState] = useState<NavigationPolicyState>(() => ({
    allowedNavKeys: session ? getDefaultAllowedNavKeys(session) : [],
    isLoading: Boolean(session),
    errorMessage: null,
    source: 'fallback',
  }));

  useEffect(() => {
    let ignore = false;
    if (session === null) {
      setState({
        allowedNavKeys: [],
        isLoading: false,
        errorMessage: null,
        source: 'none',
      });
      return () => {
        ignore = true;
      };
    }

    const fallbackKeys = getDefaultAllowedNavKeys(session);
    setState({
      allowedNavKeys: fallbackKeys,
      isLoading: true,
      errorMessage: null,
      source: 'fallback',
    });

    void getNavigationPolicy(client)
      .then((policy) => {
        if (ignore) {
          return;
        }
        setState({
          allowedNavKeys: policy.allowed_nav_keys as NavItemKey[],
          isLoading: false,
          errorMessage: null,
          source: policy.source,
        });
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        setState({
          allowedNavKeys: fallbackKeys,
          isLoading: false,
          errorMessage: getErrorMessage(error, '관리자 메뉴 정책을 불러올 수 없습니다.'),
          source: 'fallback',
        });
      });

    return () => {
      ignore = true;
    };
  }, [client, session]);

  return state;
}
