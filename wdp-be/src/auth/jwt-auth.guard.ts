import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      path?: string;
      url?: string;
    }>();

    const method = (request.method ?? '').toUpperCase();
    const rawPath = request.path ?? request.url ?? '';
    const requestPath = rawPath.split('?')[0].replace(/\/+$/, '');

    // Defensive fallback: ensure guest product browsing works even if metadata is not resolved.
    if (method === 'GET') {
      const isProductsList = /(^|\/)products$/.test(requestPath);
      const isProductsCatalog = /(^|\/)products\/catalog($|\/)/.test(
        requestPath,
      );
      const isProductsManager = /(^|\/)products\/manager($|\/)/.test(
        requestPath,
      );
      const isProductDetail = /(^|\/)products\/[^/]+$/.test(requestPath);

      if (
        (isProductsList || isProductDetail) &&
        !isProductsCatalog &&
        !isProductsManager
      ) {
        return true;
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
