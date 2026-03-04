import { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common/decorators';

export const CurrentUser = createParamDecorator(
    (data, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);