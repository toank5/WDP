import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/commons/schemas/user.schema';
import { JwtPayload } from 'src/commons/types/express.types';
import { UserRole } from 'src/commons/guards/rbac.guard';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_ACCESS_TOKEN_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Convert to plain object and normalize role
    const userObj = user.toObject();

    // Normalize role to numeric value (must match frontend roleMap in auth-store.ts)
    let numericRole = UserRole.CUSTOMER;

    if (typeof userObj.role === 'number') {
      // Already numeric
      numericRole = userObj.role;
    } else if (typeof userObj.role === 'string') {
      // String role - check if it's a string-number or role name
      const parsedNum = Number.parseInt(userObj.role, 10);
      if (!Number.isNaN(parsedNum)) {
        // String-number like "1"
        numericRole = parsedNum;
      } else {
        // Role name like 'MANAGER' - convert to numeric using UserRole enum
        const roleNameToNumber: Record<string, number> = {
          ADMIN: UserRole.ADMIN,
          MANAGER: UserRole.MANAGER,
          OPERATION: UserRole.OPERATION,
          SALE: UserRole.SALE,
          CUSTOMER: UserRole.CUSTOMER,
        };
        const upperRole = userObj.role.toUpperCase();
        numericRole = roleNameToNumber[upperRole] ?? UserRole.CUSTOMER;
      }
    }

    console.log(
      'JWT Strategy - User role from DB:',
      userObj.role,
      'Type:',
      typeof userObj.role,
      'Normalized:',
      numericRole,
    );

    return {
      ...userObj,
      _id: user._id?.toString(),
      userId: user._id?.toString(),
      role: numericRole,
    };
  }
}
