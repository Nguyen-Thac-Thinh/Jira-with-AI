package com.agileflow.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "Project key is required")
        @Size(min = 2, max = 10, message = "Project key must be between 2 and 10 characters")
        @Pattern(regexp = "^[A-Za-z][A-Za-z0-9]*$", message = "Project key must start with a letter and contain only letters and numbers")
        String projectKey,

        @NotBlank(message = "Project name is required")
        @Size(min = 2, max = 150, message = "Project name must be between 2 and 150 characters")
        String name,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description
) {
}
