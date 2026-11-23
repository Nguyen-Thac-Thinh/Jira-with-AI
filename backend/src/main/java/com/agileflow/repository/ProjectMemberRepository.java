package com.agileflow.repository;

import com.agileflow.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    long countByProjectId(Long projectId);

    @Query("""
            SELECT pm
            FROM ProjectMember pm
            JOIN FETCH pm.user
            WHERE pm.project.id = :projectId
            ORDER BY pm.joinedAt ASC
            """)
    List<ProjectMember> findAllByProjectIdWithUser(@Param("projectId") Long projectId);
}
