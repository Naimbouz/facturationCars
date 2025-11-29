// Convertir un nombre en lettres (français)
export const numberToWords = (num) => {
  const ones = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf'
  ];
  const teens = [
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf'
  ];
  const tens = [
    '',
    '',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante-dix',
    'quatre-vingt',
    'quatre-vingt-dix'
  ];
  const scales = ['', 'mille', 'million', 'milliard', 'billion'];

  const convertHundreds = (n) => {
    let result = '';
    const hundred = Math.floor(n / 100);
    if (hundred > 0) {
      result += ones[hundred] + ' cent';
      if (hundred > 1 && n % 100 === 0) result += 's';
      result += ' ';
    }
    const remainder = n % 100;
    if (remainder >= 10 && remainder < 20) {
      result += teens[remainder - 10];
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      if (ten > 0) {
        result += tens[ten];
        if (ten === 8 && one === 0) result += 's';
        if (one > 0) result += '-';
      }
      if (one > 0) result += ones[one];
    }
    return result.trim();
  };

  if (num === 0) return 'zéro';

  const parts = [];
  let scaleIndex = 0;

  while (num > 0) {
    const part = num % 1000;
    if (part > 0) {
      let partWords = convertHundreds(part);
      if (scaleIndex > 0) {
        partWords += ' ' + scales[scaleIndex];
        if (part > 1 && scaleIndex === 1) partWords += 's';
      }
      parts.unshift(partWords);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return parts.join(' ').trim();
};
