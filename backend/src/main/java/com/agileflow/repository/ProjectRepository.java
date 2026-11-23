package com.agileflow.repository;

import com.agileflow.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByProjectKeyIgnoreCase(String projectKey);

    @Query("""
            SELECT pm.project
            FROM ProjectMember pm
            JOIN FETCH pm.project.owner
            WHERE pm.user.id = :userId
            ORDER BY pm.project.createdAt DESC
            """)
    List<Project> findAllByMemberUserId(@Param("userId") Long userId);
}
