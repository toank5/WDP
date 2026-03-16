import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/commons/schemas/user.schema';
import { JwtPayload } from 'src/commons/types/express.types';
import { ROLES } from '@eyewear/shared';

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

    // Normalize role to ROLES enum string value (must match frontend roleMap in auth-store.ts)
    let normalizedRole = ROLES.CUSTOMER;

    if (typeof userObj.role === 'string') {
      // Check if it's a valid ROLES enum value
      if (Object.values(ROLES).includes(userObj.role)) {
        normalizedRole = userObj.role;
      } else {
        // Try to convert string-number to ROLES enum
        const parsedNum = Number.parseInt(userObj.role, 10);
        if (!Number.isNaN(parsedNum)) {
          // String-number like "0" -> convert to ROLES
          const roleMap: Record<number, ROLES> = {
            0: ROLES.ADMIN,
            1: ROLES.MANAGER,
            2: ROLES.OPERATION,
            3: ROLES.SALE,
            4: ROLES.CUSTOMER,
          };
          normalizedRole = roleMap[parsedNum] ?? ROLES.CUSTOMER;
        }
      }
    } else if (typeof userObj.role === 'number') {
      // Numeric role - convert to ROLES enum
      const roleMap: Record<number, ROLES> = {
        0: ROLES.ADMIN,
        1: ROLES.MANAGER,
        2: ROLES.OPERATION,
        3: ROLES.SALE,
        4: ROLES.CUSTOMER,
      };
      normalizedRole = roleMap[userObj.role] ?? ROLES.CUSTOMER;
    }

    console.log(
      'JWT Strategy - User role from DB:',
      userObj.role,
      'Type:',
      typeof userObj.role,
      'Normalized:',
      normalizedRole,
    );

    return {
      ...userObj,
      _id: user._id?.toString(),
      userId: user._id?.toString(),
      role: normalizedRole,
    };
  }
}
