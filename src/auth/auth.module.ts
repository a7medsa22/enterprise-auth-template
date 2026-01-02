import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './services/auth.service';
import { AuthDomainService } from './services/auth-domain.service';
import { BcryptPasswordAdapter } from './adapters/bcrypt-password.adapter';
import { UsersServiceAdapter } from './adapters/users-service.adapter';

@Module({
  imports:[
    PassportModule.register({defaultStrategy:'jwt'}),
     JwtModule.registerAsync({
      useFactory: async (config:ConfigService)=>
    ({
      secret:config.get('JWT_SECRET'),
      signOptions:{expiresIn:config.get('JWT_EXPIRES_IN')},
    }),
    inject:[ConfigService]
     }),
     forwardRef(() => UsersModule),
     JwtModule,
     ConfigModule
  ],
  controllers: [],
  providers: [AuthService,AuthDomainService,BcryptPasswordAdapter,UsersServiceAdapter],
  exports:[JwtModule,PassportModule],
})
export class AuthModule {}
