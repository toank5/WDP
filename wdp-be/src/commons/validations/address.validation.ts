export const addressValidation = {
  type: {
    presence: true,
    errorMsg: 'Address type is invalid',
  },
  street: {
    presence: true,
    errorMsg: 'Street is invalid',
  },
  city: {
    presence: true,
    errorMsg: 'City is invalid',
  },
  zipCode: {
    presence: true,
    errorMsg: 'Zip code is invalid',
  },
};
