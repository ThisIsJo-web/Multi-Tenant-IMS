import { Controller, All, Post, Req, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  // Reuse the compiled Better-Auth node handler across all requests for optimal performance
  private readonly authHandler = toNodeHandler(auth);

  @Post(['sign-in', 'sign-in/*path'])
  async handleSignIn(@Req() req: Request, @Res() res: Response) {
    this.logger.debug(`Processing sign-in request: ${req.method} ${req.originalUrl}`);
    return this.authHandler(req, res);
  }

  @Post(['sign-up', 'sign-up/*path'])
  async handleSignUp(@Req() req: Request, @Res() res: Response) {
    this.logger.debug(`Processing sign-up request: ${req.method} ${req.originalUrl}`);
    return this.authHandler(req, res);
  }

  @All('*path')
  async handleAuthWildcard(@Req() req: Request, @Res() res: Response) {
    this.logger.debug(`Processing auth request: ${req.method} ${req.originalUrl}`);
    return this.authHandler(req, res);
  }

  @All()
  async handleAuthRoot(@Req() req: Request, @Res() res: Response) {
    this.logger.debug(`Processing auth root request: ${req.method} ${req.originalUrl}`);
    return this.authHandler(req, res);
  }
}
