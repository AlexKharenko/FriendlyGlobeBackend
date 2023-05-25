export const maxDate = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 12);
  return today;
};
export const minDate = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 120);
  return today;
};
