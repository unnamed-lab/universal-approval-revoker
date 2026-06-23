import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProgramsService } from "./programs.service";

@ApiTags("programs")
@Controller("programs")
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: "Return the curated known-program allowlist" })
  getAll() {
    return this.programsService.getAll();
  }
}
