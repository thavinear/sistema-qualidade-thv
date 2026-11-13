package com.sistema.qualidade.auth;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sgq_users", indexes = @Index(name = "ux_sgq_users_email", columnList = "email", unique = true))
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, length = 254, unique = true)
    private String email;
    @Column(nullable = false, length = 100)
    private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10)
    private Role role = Role.USER;
    @Column(nullable = false)
    private boolean active = true;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "sgq_user_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "permission_key", nullable = false, length = 80)
    private Set<String> permissions = new HashSet<>();

    protected UserAccount() { }
    public UserAccount(String name, String email, String passwordHash, Role role) {
        this.name = name; this.email = email; this.passwordHash = passwordHash; this.role = role;
        this.active = true;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions == null ? new HashSet<>() : new HashSet<>(permissions); }
}
