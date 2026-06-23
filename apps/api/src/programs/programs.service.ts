import { Injectable } from "@nestjs/common";
import { KNOWN_PROGRAMS } from "@uar/shared";
import type { KnownProgramsResponse } from "@uar/shared";

@Injectable()
export class ProgramsService {
  getAll(): KnownProgramsResponse {
    return {
      programs: KNOWN_PROGRAMS,
      updatedAt: new Date().toISOString(),
    };
  }
}
