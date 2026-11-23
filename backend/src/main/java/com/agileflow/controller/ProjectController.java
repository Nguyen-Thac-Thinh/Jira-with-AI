package com.agileflow.controller;

import com.agileflow.dto.project.AddProjectMemberRequest;
import com.agileflow.dto.project.CreateProjectRequest;
import com.agileflow.dto.project.ProjectMemberResponse;
import com.agileflow.dto.project.ProjectResponse;
import com.agileflow.dto.project.UpdateMemberRoleRequest;
import com.agileflow.dto.project.UpdateProjectRequest;
import com.agileflow.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService agileFlowProjectService;

    @GetMapping
    public List<ProjectResponse> fetchJoinedWorkspaces(Authentication authCtx) {
        return agileFlowProjectService.listMyProjects(authCtx.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse provisionWorkspace(
            Authentication authCtx,
            @Valid @RequestBody CreateProjectRequest payload
    ) {
        return agileFlowProjectService.createProject(authCtx.getName(), payload);
    }

    @GetMapping("/{workspaceId}")
    public ProjectResponse inspectWorkspace(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId
    ) {
        return agileFlowProjectService.getProject(authCtx.getName(), workspaceId);
    }

    @PutMapping("/{workspaceId}")
    public ProjectResponse modifyWorkspaceMetadata(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId,
            @Valid @RequestBody UpdateProjectRequest payload
    ) {
        return agileFlowProjectService.updateProject(authCtx.getName(), workspaceId, payload);
    }

    @DeleteMapping("/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void purgeWorkspace(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId
    ) {
        agileFlowProjectService.deleteProject(authCtx.getName(), workspaceId);
    }

    @GetMapping("/{workspaceId}/members")
    public List<ProjectMemberResponse> fetchWorkspaceRoster(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId
    ) {
        return agileFlowProjectService.listMembers(authCtx.getName(), workspaceId);
    }

    @PostMapping("/{workspaceId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMemberResponse enrollWorkspaceMember(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId,
            @Valid @RequestBody AddProjectMemberRequest payload
    ) {
        return agileFlowProjectService.addMember(authCtx.getName(), workspaceId, payload);
    }

    @PatchMapping("/{workspaceId}/members/{memberUserId}")
    public ProjectMemberResponse adjustMemberPrivilege(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId,
            @PathVariable("memberUserId") Long memberUserId,
            @Valid @RequestBody UpdateMemberRoleRequest payload
    ) {
        return agileFlowProjectService.updateMemberRole(authCtx.getName(), workspaceId, memberUserId, payload);
    }

    @DeleteMapping("/{workspaceId}/members/{memberUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void evictWorkspaceMember(
            Authentication authCtx,
            @PathVariable("workspaceId") Long workspaceId,
            @PathVariable("memberUserId") Long memberUserId
    ) {
        agileFlowProjectService.removeMember(authCtx.getName(), workspaceId, memberUserId);
    }
}
