export function createJevFetch(): (input: string, init?: RequestInit) => Promise<Response> {
  return async (input, init) => {
    const response = await globalThis.fetch(input, init);

    return new Proxy(response, {
      get(target, property): unknown {
        if (property === 'clone') {
          return (): Response => ({ body: null }) as unknown as Response;
        }

        const value: unknown = Reflect.get(target, property, target);

        if (typeof value === 'function') {
          return value.bind(target);
        }

        return value;
      },
    });
  };
}
