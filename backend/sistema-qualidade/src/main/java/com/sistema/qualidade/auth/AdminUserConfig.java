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
                UserAccount existingAdmin = userRepository.findByEmailIgnoreCase(existingEmail).orElseThrow();
                if (passwordEncoder.matches("admin123", existingAdmin.getPasswordHash())) {
                    existingAdmin.setPasswordHash(passwordEncoder.encode("senhasupersegura2026"));
                    userRepository.save(existingAdmin);
                    System.out.println("Default administrator password migrated.");
                }
                System.out.println("Usuário admin já existe: " + existingEmail);
                return;
            }

            UserAccount admin = new UserAccount("Administrador", canonicalEmail, passwordEncoder.encode("senhasupersegura2026"), Role.ADMIN);
            admin.setActive(true);
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            System.out.println("Admin user created successfully: " + canonicalEmail);
        };
    }
}
