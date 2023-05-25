export const parseBool = (bool: string) => {
  if (bool === undefined) return undefined;
  return bool ? bool === 'true' : false;
};
