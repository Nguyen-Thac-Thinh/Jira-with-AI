package com.agileflow.dto.project;

import com.agileflow.entity.ProjectMemberRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull(message = "Role is required")
        ProjectMemberRole role
) {
}
