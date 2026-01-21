import validator from 'validator';
export const productValidation = {
  name: {
    presence: true,
    length: {
      min: 5,
      max: 100,
    },
    errorMsg: 'Name is invalid',
  },
  description: {
    presence: false,
    length: {
      min: 10,
      max: 1000,
    },
    errorMsg: 'Description is invalid',
  },
  basePrice: {
    presence: true,
    errorMsg: 'Base price is invalid',
  },
  category: {
    presence: true,
    errorMsg: 'Category is invalid',
  },
  variants: {
    presence: false,
    errorMsg: 'Variants is invalid',
    size: {
      presence: true,
      errorMsg: 'Size is invalid',
      validator: (value: string) =>
        validator.matches(value, /^[0-9]{2}-[0-9]{2}-[0-9]{2}$/),
    },
    color: {
      presence: true,
      errorMsg: 'Color is invalid',
      validator: (value: string) => validator.isHexColor(value),
    },
    price: {
      presence: true,
      errorMsg: 'Price is invalid',
      validator: (value: string) =>
        validator.isCurrency(value, {
          symbol: '₫',
          thousands_separator: '.',
          decimal_separator: ',',
          symbol_after_digits: true,
          allow_decimal: false,
        }),
    },
    weightInGrams: {
      presence: true,
      errorMsg: 'Weight in grams is invalid',
      validator: (value: string) => validator.isFloat(value, { min: 0 }),
    },
  },
};
