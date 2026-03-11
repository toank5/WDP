import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ROLES } from 'src/commons/enums/role.enum';
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

    // Convert to plain object and normalize role to numeric enum value.
    const userObj = user.toObject();
    let role: number;
    if (typeof userObj.role === 'number') {
      role = userObj.role;
    } else if (typeof userObj.role === 'string') {
      const numericRole = Number.parseInt(userObj.role, 10);
      if (!Number.isNaN(numericRole)) {
        role = numericRole;
      } else {
        const enumValue = (ROLES as unknown as Record<string, number>)[
          userObj.role
        ];
        role = typeof enumValue === 'number' ? enumValue : Number(payload.role);
      }
    } else {
      role = Number(payload.role);
    }

    console.log(
      'JWT Strategy - User role from DB:',
      userObj.role,
      'Type:',
      typeof userObj.role,
    );
    console.log('JWT Strategy - Converted role:', role, 'Type:', typeof role);

    return {
      ...userObj,
      role,
    };
  }
}
