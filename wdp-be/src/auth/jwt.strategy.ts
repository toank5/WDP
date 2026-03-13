import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ROLES } from '@eyewear/shared';
import { User } from 'src/commons/schemas/user.schema';
import { JwtPayload } from 'src/commons/types/express.types';

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

    // Role is now stored as string (e.g., 'CUSTOMER', 'ADMIN') from shared enum
    let roleString = userObj.role as string;

    // Legacy support: if role is somehow stored as a number, convert it
    if (typeof userObj.role === 'number') {
      const roleKey = Object.keys(ROLES).find(
        (key) => ROLES[key as keyof typeof ROLES] === userObj.role
      );
      roleString = roleKey || 'CUSTOMER';
    }

    console.log(
      'JWT Strategy - User role from DB:',
      userObj.role,
      'Type:',
      typeof userObj.role,
      'Normalized:',
      roleString,
    );

    return {
      ...userObj,
      _id: user._id?.toString(),
      userId: user._id?.toString(),
      role: roleString || 'CUSTOMER',
    };
  }
}
