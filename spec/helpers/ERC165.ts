export const shouldSupportInterface = (interfaceName: string, create: () => Promise<any>, interfaceId: number[]) => {
  it(`should support ${interfaceName} interface`, async () => {
    const obj = await create();

    expect<boolean>(await obj.supportsInterface(interfaceId)).toBe(true);
  });
};
