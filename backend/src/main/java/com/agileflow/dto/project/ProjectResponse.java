package com.agileflow.dto.project;

import com.agileflow.entity.Project;
import com.agileflow.entity.ProjectMemberRole;

import java.time.OffsetDateTime;

public record ProjectResponse(
        Long id,
        String projectKey,
        String name,
        String description,
        Long ownerId,
        String ownerName,
        ProjectMemberRole currentUserRole,
        long memberCount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProjectResponse of(Project project, ProjectMemberRole currentUserRole, long memberCount) {
        return new ProjectResponse(
                project.getId(),
                project.getProjectKey(),
                project.getName(),
                project.getDescription(),
                project.getOwner().getId(),
                project.getOwner().getFullName(),
                currentUserRole,
                memberCount,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
