export const ageFilter = (
  minAge: number | undefined,
  maxAge: number | undefined,
) => {
  const currentDate = new Date();
  const minBirthdate = minAge
    ? new Date(
        currentDate.getFullYear() - minAge,
        currentDate.getMonth(),
        currentDate.getDate(),
      )
    : null;
  const maxBirthdate = maxAge
    ? new Date(
        currentDate.getFullYear() - maxAge - 1,
        currentDate.getMonth(),
        currentDate.getDate(),
      )
    : null;

  const filter: any = {};

  if (minBirthdate) {
    filter.birthdayDate = {
      lte: minBirthdate.toISOString(),
    };
  }

  if (maxBirthdate) {
    filter.birthdayDate = {
      ...filter.birthdayDate,
      gte: maxBirthdate.toISOString(),
    };
  }

  return filter;
};
