
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { Get } from '@nestjs/common/decorators/http/request-mapping.decorator';
import { Public } from '@auth-template/nestjs-adapter';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller('health')
export class HealthController {
    constructor(@InjectConnection() private connection: Connection) { }

    @Public()
    @Get()
    async check() {
        const dbHealthy = await this.checkDatabase();

        return {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealthy ? 'up' : 'down',
                api: 'up',
            },
        };
    }

    private async checkDatabase(): Promise<boolean> {
        try {
            await this.connection.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }
}
