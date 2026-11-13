package com.sistema.qualidade.auth;

import static com.sistema.qualidade.auth.AuthDtos.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AdminUserService service;
    public AdminUserController(AdminUserService service) { this.service=service; }
    @GetMapping public List<UserResponse> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public UserResponse create(@Valid @RequestBody UserCreateRequest request) { return service.create(request); }
    @PutMapping("/{id}") public UserResponse update(@PathVariable long id, @Valid @RequestBody UserRequest request, @AuthenticationPrincipal UserAccount actor) { return service.update(id,request,actor); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable long id, @AuthenticationPrincipal UserAccount actor) { service.delete(id,actor); }
}
