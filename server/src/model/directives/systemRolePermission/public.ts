const name = "public";

const checkAuthorization = async () => {
  return true;
};

export const publicDirective = { name, checkAuthorization } as const;
