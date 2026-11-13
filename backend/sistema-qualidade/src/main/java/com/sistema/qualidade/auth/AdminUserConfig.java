package com.sistema.qualidade.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminUserConfig {

    @Bean
    CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            final String canonicalEmail = "admin@sgqsenac.com";
            final String legacyEmail = "admin@sqgsenac.com";

            boolean existsCanonical = userRepository.existsByEmailIgnoreCase(canonicalEmail);
            boolean existsLegacy = userRepository.existsByEmailIgnoreCase(legacyEmail);

            if (existsCanonical || existsLegacy) {
                String existingEmail = existsCanonical ? canonicalEmail : legacyEmail;
                System.out.println("Usuário admin já existe: " + existingEmail);
                return;
            }

            UserAccount admin = new UserAccount("Administrador", canonicalEmail, passwordEncoder.encode("admin123"), Role.ADMIN);
            admin.setActive(true);
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            System.out.println("Usuário admin criado com sucesso: " + canonicalEmail + " / admin123");
        };
    }
}
