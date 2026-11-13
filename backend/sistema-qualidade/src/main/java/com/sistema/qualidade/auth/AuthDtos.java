package com.sistema.qualidade.auth;

import jakarta.validation.constraints.*;
import java.util.Set;

public final class AuthDtos {
    private AuthDtos() { }
    public record RegisterRequest(@NotBlank @Size(max=100) String name, @NotBlank @Email @Size(max=254) String email,
                                  @NotBlank @Size(min=10, max=72) String password) { }
    public record LoginRequest(@NotBlank @Email @Size(max=254) String email, @NotBlank @Size(max=72) String password) { }
    public record UserCreateRequest(@NotBlank @Size(max=100) String name, @NotBlank @Email @Size(max=254) String email,
                                    @NotBlank(message="A senha é obrigatória para novos usuários.")
                                    @Size(min=10, max=72, message="A senha deve ter entre 10 e 72 caracteres.") String password,
                                    @NotNull Role role, @NotNull Boolean active,
                                    @NotNull Set<@Pattern(regexp="[a-z]+:(view|edit|delete)") String> permissions) { }
    public record UserRequest(@NotBlank @Size(max=100) String name, @NotBlank @Email @Size(max=254) String email,
                              @Size(max=72) String password, @NotNull Role role,
                              @NotNull Boolean active, @NotNull Set<@Pattern(regexp="[a-z]+:(view|edit|delete)") String> permissions) { }
    public record UserResponse(Long id, String name, String email, Role role, boolean active, Set<String> permissions) {
        static UserResponse from(UserAccount user) {
            return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive(), Set.copyOf(user.getPermissions()));
        }
    }
    public record SessionResponse(Long id, String name, String email, Role role, Set<String> permissions) {
        static SessionResponse from(UserAccount user) {
            return new SessionResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), Set.copyOf(user.getPermissions()));
        }
    }
    public record MessageResponse(String message) { }
}
