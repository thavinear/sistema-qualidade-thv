package com.sistema.qualidade.workspace;

import tools.jackson.databind.JsonNode;
import com.sistema.qualidade.auth.UserAccount;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceController {
    private final WorkspaceService service;
    public WorkspaceController(WorkspaceService service) { this.service=service; }
    @GetMapping public JsonNode get(@AuthenticationPrincipal UserAccount user) { return service.get(user); }
    @PutMapping public JsonNode save(@AuthenticationPrincipal UserAccount user,@RequestBody JsonNode payload) { return service.save(user,payload); }
}
