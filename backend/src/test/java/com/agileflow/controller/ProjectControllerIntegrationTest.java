package com.agileflow.controller;

import com.agileflow.dto.auth.RegisterRequest;
import com.agileflow.dto.project.AddProjectMemberRequest;
import com.agileflow.dto.project.CreateProjectRequest;
import com.agileflow.dto.project.UpdateMemberRoleRequest;
import com.agileflow.dto.project.UpdateProjectRequest;
import com.agileflow.entity.ProjectMemberRole;
import com.agileflow.repository.ProjectMemberRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper jsonMapper;

    @Autowired
    private ProjectMemberRepository memberRepo;

    @Autowired
    private ProjectRepository projectRepo;

    @Autowired
    private UserRepository userRepo;

    @BeforeEach
    @AfterEach
    void resetDatabase() {
        memberRepo.deleteAll();
        projectRepo.deleteAll();
        userRepo.deleteAll();
    }

    private JsonNode signUpAndExtractAuth(String name, String email) throws Exception {
        RegisterRequest req = new RegisterRequest(name, email, "AgilePass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return jsonMapper.readTree(res.getResponse().getContentAsString());
    }

    @Test
    void fullWorkspaceLifecycleAndRosterPermissions() throws Exception {
        JsonNode leadAuth = signUpAndExtractAuth("Thinh Lead", "lead@agileflow.dev");
        String leadBearer = "Bearer " + leadAuth.get("accessToken").asText();
        long leadUserId = leadAuth.get("user").get("id").asLong();

        JsonNode devAuth = signUpAndExtractAuth("Minh Dev", "dev@agileflow.dev");
        String devBearer = "Bearer " + devAuth.get("accessToken").asText();
        long devUserId = devAuth.get("user").get("id").asLong();

        CreateProjectRequest createPayload = new CreateProjectRequest(
                "aflow",
                "AgileFlow Core Platform",
                "AI Monte Carlo story point engine"
        );

        MvcResult createdRes = mockMvc.perform(post("/api/projects")
                        .header("Authorization", leadBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectKey").value("AFLOW"))
                .andExpect(jsonPath("$.currentUserRole").value("ADMIN"))
                .andExpect(jsonPath("$.memberCount").value(1))
                .andReturn();

        long workspaceId = jsonMapper.readTree(createdRes.getResponse().getContentAsString()).get("id").asLong();

        // Duplicate project key -> 409 Conflict
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", leadBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createPayload)))
                .andExpect(status().isConflict());

        // Non-member cannot inspect workspace -> 403 Forbidden
        mockMvc.perform(get("/api/projects/" + workspaceId)
                        .header("Authorization", devBearer))
                .andExpect(status().isForbidden());

        // Enroll dev as MEMBER
        AddProjectMemberRequest enrollPayload = new AddProjectMemberRequest("dev@agileflow.dev", ProjectMemberRole.MEMBER);
        mockMvc.perform(post("/api/projects/" + workspaceId + "/members")
                        .header("Authorization", leadBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(enrollPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("MEMBER"))
                .andExpect(jsonPath("$.owner").value(false));

        // Dev can now view workspace but cannot modify metadata
        mockMvc.perform(get("/api/projects/" + workspaceId)
                        .header("Authorization", devBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(2));

        UpdateProjectRequest updatePayload = new UpdateProjectRequest("Renamed by Member", "Not allowed");
        mockMvc.perform(put("/api/projects/" + workspaceId)
                        .header("Authorization", devBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isForbidden());

        // Cannot demote or remove workspace owner
        mockMvc.perform(patch("/api/projects/" + workspaceId + "/members/" + leadUserId)
                        .header("Authorization", leadBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new UpdateMemberRoleRequest(ProjectMemberRole.MEMBER))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/projects/" + workspaceId + "/members/" + leadUserId)
                        .header("Authorization", leadBearer))
                .andExpect(status().isBadRequest());

        // Promote dev to ADMIN, then remove dev
        mockMvc.perform(patch("/api/projects/" + workspaceId + "/members/" + devUserId)
                        .header("Authorization", leadBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new UpdateMemberRoleRequest(ProjectMemberRole.ADMIN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(delete("/api/projects/" + workspaceId + "/members/" + devUserId)
                        .header("Authorization", leadBearer))
                .andExpect(status().isNoContent());
    }
}
