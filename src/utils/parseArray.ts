export const parseArray = (array: string) => {
  if (array === undefined) return undefined;
  return JSON.parse(array);
};
