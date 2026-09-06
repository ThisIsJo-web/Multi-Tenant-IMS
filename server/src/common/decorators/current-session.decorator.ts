import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentSession = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { session?: Record<string, any> }>();
    const session = request.session;

    if (!session) {
      return null;
    }

    return data ? session[data] : session;
  },
);
