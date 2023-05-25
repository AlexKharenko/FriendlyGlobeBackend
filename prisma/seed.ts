import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import countries from './data/countries';
import languages from './data/languages';
import hobbies from './data/hobbies';

async function main() {
  for (const country of countries) {
    await prisma.country.upsert({
      where: { countryName: country.Name },
      update: {},
      create: {
        countryName: country.Name,
        countryCode: country.Code,
      },
    });
  }

  for (const language of languages) {
    await prisma.language.upsert({
      where: { language: language.name },
      update: {},
      create: {
        language: language.name,
      },
    });
  }

  for (const hobby of hobbies) {
    await prisma.hobby.upsert({
      where: { hobby: hobby.hobby },
      update: {},
      create: {
        hobby: hobby.hobby,
      },
    });
  }
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
