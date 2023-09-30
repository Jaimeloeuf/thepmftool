import { Injectable } from '@nestjs/common';

import type { ITeamRepo } from '../../../abstraction/index.js';
import { PrismaService } from '../prisma.service.js';

import type {
  OrgID,
  UserID,
  CreateOneTeamMemberInvitationDTO,
  User,
} from 'domain-model';

// Mappers
import {
  mapUserModelsToEntity,
  mapToTeamInvitations,
  mapToTeamInvitation,
} from './mapper.js';

// Utils
import { runMapperIfNotNull } from '../utils/runMapperIfNotNull.js';

@Injectable()
export class TeamRepo implements ITeamRepo {
  constructor(private readonly db: PrismaService) {}

  async getAllMembers(org_id: OrgID) {
    return this.db.user
      .findMany({
        where: { org_id },
        // Sort by newest member first
        orderBy: { created_at: 'desc' },
      })
      .then(mapUserModelsToEntity);
  }

  async createInvite(
    invitationID: string,
    inviterUserID: UserID,
    org_id: OrgID,
    createOneTeamMemberInvitationDTO: CreateOneTeamMemberInvitationDTO,
  ) {
    // Using an upsert to ensure that duplicates wont be created
    await this.db.team_member_invitation.upsert({
      create: {
        id: invitationID,
        invitee_email: createOneTeamMemberInvitationDTO.inviteeEmail,
        inviter_id: inviterUserID,
        org_id,
      },
      where: { invitee_email: createOneTeamMemberInvitationDTO.inviteeEmail },
      // Only update inviterUserID to prevent a OrgID attack where someone from
      // another org can just invite the user to prevent them from joining the
      // original Org they were invited to.
      update: { inviter_id: inviterUserID },
    });

    return true;
  }

  async getPendingInvites(invitee_email: User['email']) {
    // Use of findMany is useless since a user can only join a single team now
    // this is only useful after allowing multiple teams in a single Org.
    return this.db.team_member_invitation
      .findMany({
        where: { invitee_email },
        include: {
          inviter: { select: { name: true, role: true } },
          org: { select: { name: true } },
        },
      })
      .then(mapToTeamInvitations);
  }

  async getInvite(invitationID: string) {
    return this.db.team_member_invitation
      .findUnique({
        where: { id: invitationID },
        include: {
          inviter: { select: { name: true, role: true } },
          org: { select: { name: true } },
        },
      })
      .then(runMapperIfNotNull(mapToTeamInvitation));
  }

  async deleteInvite(invitationID: string) {
    await this.db.team_member_invitation.delete({
      where: { id: invitationID },
    });
  }
}
