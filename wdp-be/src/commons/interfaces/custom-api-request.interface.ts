import { User } from 'src/schemas/user.schema';

export interface ICustomApiRequest extends Request {
  user?: Pick<User, '_id'>;
}
