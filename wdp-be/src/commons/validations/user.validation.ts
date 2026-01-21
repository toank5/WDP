import validator from 'validator';
export const userValidation = {
  fullName: {
    presence: true,
    length: {
      min: 5,
      max: 100,
    },
    errorMsg: 'Full name is invalid',
  },
  email: {
    presence: true,
    unique: true,
    validator: (value: string) => validator.isEmail(value),
    errorMsg: 'Email is invalid',
  },
  avatar: {
    validator: (value: string) => validator.isURL(value),
    errorMsg: 'Avatar is invalid',
  },
};
