import validator from 'validator';
export const userValidation = {
  fullName: {
    presence: true,
    length: {
      min: 5,
      max: 100,
    },
  },
  email: {
    presence: true,
    unique: true,
    validator: (value: string) => validator.isEmail(value),
  },
  avatar: {
    validator: (value: string) => validator.isURL(value),
  },
};
