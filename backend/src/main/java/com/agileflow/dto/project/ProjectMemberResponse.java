package com.agileflow.dto.project;

import com.agileflow.entity.ProjectMember;
import com.agileflow.entity.ProjectMemberRole;

import java.time.OffsetDateTime;

public record ProjectMemberResponse(
        Long userId,
        String email,
        String fullName,
        String avatarUrl,
        ProjectMemberRole role,
        boolean owner,
        OffsetDateTime joinedAt
) {
    public static ProjectMemberResponse of(ProjectMember member, Long ownerId) {
        return new ProjectMemberResponse(
                member.getUser().getId(),
                member.getUser().getEmail(),
                member.getUser().getFullName(),
                member.getUser().getAvatarUrl(),
                member.getRole(),
                member.getUser().getId().equals(ownerId),
                member.getJoinedAt()
        );
    }
}
