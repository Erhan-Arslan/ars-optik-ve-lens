import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator.js';

@ApiTags('health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Servisin ayakta olduğunu doğrular' })
  health() {
    return { status: 'ok', service: 'ars-optik-api', timestamp: new Date().toISOString() };
  }
}
