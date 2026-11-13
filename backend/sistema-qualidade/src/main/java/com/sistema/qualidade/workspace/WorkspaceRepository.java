package com.sistema.qualidade.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<WorkspaceDocument,Long> {
    Optional<WorkspaceDocument> findByUserId(Long userId);
    @Modifying @Query("delete from WorkspaceDocument w where w.user.id = :userId")
    void deleteForUser(@Param("userId") Long userId);
}
