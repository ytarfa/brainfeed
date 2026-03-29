import React from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  /** Initial route entries for MemoryRouter */
  routes?: string[];
}

function createWrapper(options: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();
  const { routes = ["/"] } = options;

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={routes}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

/**
 * Custom render that wraps component in QueryClientProvider + MemoryRouter.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & WrapperOptions,
): RenderResult {
  const { routes, ...renderOptions } = options ?? {};
  const wrapper = createWrapper({ routes });
  return render(ui, { wrapper, ...renderOptions });
}

/**
 * Create a standalone QueryClient + wrapper for testing hooks with renderHook.
 */
export function createHookWrapper(options: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();
  const { routes = ["/"] } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={routes}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { wrapper: Wrapper, queryClient };
}
