import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardIceSkatingClientDto } from './dto/onboard-ice-skating-client.dto';
import { Public } from '../../cms/auth/public.decorator';

@Controller('user/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Post('ice-skating-client')
  async onboardIceSkatingClient(@Body() dto: OnboardIceSkatingClientDto) {
    return this.onboardingService.onboardIceSkatingClient(dto);
  }

  @Public()
  @Post('skiing-client')
  async onboardSkiingClient(@Body() dto: OnboardIceSkatingClientDto) {
    return this.onboardingService.onboardSkiingClient(dto);
  }

  /** Reset admin password to BookNGO@123 for a customer (dev only). Use customer_id from onboarding response. */
  @Public()
  @Post('reset-admin-password')
  async resetAdminPassword(@Body() body: { customer_id: number }) {
    return this.onboardingService.resetOnboardingAdminPassword(
      body.customer_id,
    );
  }
}
