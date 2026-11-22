package com.agileflow.dto.auth;

import com.agileflow.entity.User;
import com.agileflow.entity.UserRole;

import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        UserRole role,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
