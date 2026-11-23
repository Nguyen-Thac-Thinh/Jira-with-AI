package com.agileflow.service;

import com.agileflow.dto.project.AddProjectMemberRequest;
import com.agileflow.dto.project.CreateProjectRequest;
import com.agileflow.dto.project.ProjectMemberResponse;
import com.agileflow.dto.project.ProjectResponse;
import com.agileflow.dto.project.UpdateMemberRoleRequest;
import com.agileflow.dto.project.UpdateProjectRequest;
import com.agileflow.entity.Project;
import com.agileflow.entity.ProjectMember;
import com.agileflow.entity.ProjectMemberRole;
import com.agileflow.entity.User;
import com.agileflow.repository.ProjectMemberRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMyProjects(String userEmail) {
        User current = findUserOrThrow(userEmail);
        List<Project> projects = projectRepository.findAllByMemberUserId(current.getId());
        return projects.stream()
                .map(p -> {
                    ProjectMember pm = memberRepository.findByProjectIdAndUserId(p.getId(), current.getId())
                            .orElseThrow();
                    long total = memberRepository.countByProjectId(p.getId());
                    return ProjectResponse.of(p, pm.getRole(), total);
                })
                .toList();
    }

    @Transactional
    public ProjectResponse createProject(String userEmail, CreateProjectRequest req) {
        User owner = findUserOrThrow(userEmail);
        String key = req.projectKey().trim().toUpperCase(Locale.ROOT);

        if (projectRepository.existsByProjectKeyIgnoreCase(key)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project key '" + key + "' already exists");
        }

        Project project = Project.builder()
                .projectKey(key)
                .name(req.name().trim())
                .description(req.description() != null ? req.description().trim() : null)
                .owner(owner)
                .build();
        Project saved = projectRepository.save(project);

        ProjectMember ownerMember = ProjectMember.builder()
                .project(saved)
                .user(owner)
                .role(ProjectMemberRole.ADMIN)
                .build();
        memberRepository.save(ownerMember);

        return ProjectResponse.of(saved, ProjectMemberRole.ADMIN, 1L);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(String userEmail, Long projectId) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        ProjectMember membership = requireMember(projectId, current.getId());
        long total = memberRepository.countByProjectId(projectId);
        return ProjectResponse.of(project, membership.getRole(), total);
    }

    @Transactional
    public ProjectResponse updateProject(String userEmail, Long projectId, UpdateProjectRequest req) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        ProjectMember membership = requireAdmin(projectId, current.getId());

        project.setName(req.name().trim());
        project.setDescription(req.description() != null ? req.description().trim() : null);
        Project updated = projectRepository.save(project);
        long total = memberRepository.countByProjectId(projectId);
        return ProjectResponse.of(updated, membership.getRole(), total);
    }

    @Transactional
    public void deleteProject(String userEmail, Long projectId) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        requireAdmin(projectId, current.getId());
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> listMembers(String userEmail, Long projectId) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        requireMember(projectId, current.getId());

        Long ownerId = project.getOwner().getId();
        return memberRepository.findAllByProjectIdWithUser(projectId).stream()
                .map(pm -> ProjectMemberResponse.of(pm, ownerId))
                .toList();
    }

    @Transactional
    public ProjectMemberResponse addMember(String userEmail, Long projectId, AddProjectMemberRequest req) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        requireAdmin(projectId, current.getId());

        String targetEmail = req.email().trim().toLowerCase(Locale.ROOT);
        User targetUser = userRepository.findByEmailIgnoreCase(targetEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No registered user found with email: " + targetEmail));

        if (memberRepository.existsByProjectIdAndUserId(projectId, targetUser.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member of this project");
        }

        ProjectMember saved = memberRepository.save(ProjectMember.builder()
                .project(project)
                .user(targetUser)
                .role(req.role())
                .build());

        return ProjectMemberResponse.of(saved, project.getOwner().getId());
    }

    @Transactional
    public ProjectMemberResponse updateMemberRole(
            String userEmail,
            Long projectId,
            Long targetUserId,
            UpdateMemberRoleRequest req
    ) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        requireAdmin(projectId, current.getId());

        if (project.getOwner().getId().equals(targetUserId) && req.role() != ProjectMemberRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project owner must remain ADMIN");
        }

        ProjectMember targetMember = memberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found in project"));

        targetMember.setRole(req.role());
        ProjectMember saved = memberRepository.save(targetMember);
        return ProjectMemberResponse.of(saved, project.getOwner().getId());
    }

    @Transactional
    public void removeMember(String userEmail, Long projectId, Long targetUserId) {
        User current = findUserOrThrow(userEmail);
        Project project = findProjectOrThrow(projectId);
        requireAdmin(projectId, current.getId());

        if (project.getOwner().getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the project owner");
        }

        ProjectMember targetMember = memberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found in project"));
        memberRepository.delete(targetMember);
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Project findProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private ProjectMember requireMember(Long projectId, Long userId) {
        return memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project"));
    }

    private ProjectMember requireAdmin(Long projectId, Long userId) {
        ProjectMember pm = requireMember(projectId, userId);
        if (pm.getRole() != ProjectMemberRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Project ADMIN role is required for this action");
        }
        return pm;
    }
}
