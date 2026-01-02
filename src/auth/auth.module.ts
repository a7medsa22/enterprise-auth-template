import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';

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
  providers: [],
  exports:[JwtModule,PassportModule],
})
export class AuthModule {}
