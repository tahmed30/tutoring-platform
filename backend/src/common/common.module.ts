import { Global, Module } from '@nestjs/common';
import { AccessHelper } from './helpers/access.helper';
import { AuditLogHelper } from './helpers/audit-log.helper';

@Global()
@Module({
  providers: [AuditLogHelper, AccessHelper],
  exports: [AuditLogHelper, AccessHelper],
})
export class CommonModule {}
