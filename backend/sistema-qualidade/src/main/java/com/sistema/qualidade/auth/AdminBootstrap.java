package com.sistema.qualidade.auth;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    public AdminBootstrap(UserRepository users,PasswordEncoder passwords) { this.users=users; this.passwords=passwords; }
    @Override public void run(ApplicationArguments args) {
        String email=System.getenv("SGQ_ADMIN_EMAIL"), password=System.getenv("SGQ_ADMIN_PASSWORD");
        if(email==null || email.isBlank() || password==null || password.length()<10) return;
        String normalized=AuthService.normalize(email);
        if(users.existsByEmailIgnoreCase(normalized)) return;
        users.save(new UserAccount("Administrador",normalized,passwords.encode(password),Role.ADMIN));
    }
}
