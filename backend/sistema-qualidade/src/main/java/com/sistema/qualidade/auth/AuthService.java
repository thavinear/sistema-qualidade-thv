package com.sistema.qualidade.auth;

import static com.sistema.qualidade.auth.AuthDtos.*;
import java.time.Duration;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final boolean secureCookie;
    private final String sameSite;
    public AuthService(UserRepository users, PasswordEncoder passwords, JwtService jwt,
                       @Value("${app.auth.cookie-secure:true}") boolean secureCookie,
                       @Value("${app.auth.cookie-same-site:Lax}") String sameSite) {
        if(!java.util.Set.of("Strict","Lax","None").contains(sameSite)) throw new IllegalStateException("AUTH_COOKIE_SAME_SITE deve ser Strict, Lax ou None.");
        if("None".equals(sameSite) && !secureCookie) throw new IllegalStateException("AUTH_COOKIE_SAME_SITE=None requer AUTH_COOKIE_SECURE=true.");
        this.users=users; this.passwords=passwords; this.jwt=jwt; this.secureCookie=secureCookie; this.sameSite=sameSite;
    }
    @Transactional
    public UserAccount register(RegisterRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        UserAccount user = new UserAccount(request.name().trim(), email, passwords.encode(request.password()), Role.USER);
        user.setPermissions(java.util.Set.of("dashboard:view","fluxo:view","fluxo:edit","gut:view","gut:edit","pareto:view","pareto:edit","ishikawa:view","ishikawa:edit","porques:view","porques:edit","w2h:view","w2h:edit","reports:view"));
        return users.save(user);
    }
    public UserAccount authenticate(LoginRequest request) {
        UserAccount user = users.findByEmailIgnoreCase(normalize(request.email())).orElse(null);
        if (user == null || !user.isActive() || !passwords.matches(request.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        return user;
    }
    public ResponseCookie sessionCookie(UserAccount user) {
        return ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, jwt.issue(user)).httpOnly(true).secure(true)
                .sameSite("Lax").path("/").maxAge(Duration.ofSeconds(jwt.getExpirationSeconds())).build();
    }
    public ResponseCookie clearSessionCookie() {
        return ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, "").httpOnly(true).secure(true)
                .sameSite("Lax").path("/").maxAge(Duration.ZERO).build();
    }
    public ResponseCookie csrfCookie(String token, Duration maxAge) {
        return ResponseCookie.from("SGQ_CSRF", token).httpOnly(false).secure(secureCookie).sameSite("Lax").path("/").maxAge(maxAge).build();
    }
    public String newCsrfToken() { return UUID.randomUUID().toString(); }
    public static String normalize(String email) { return email.trim().toLowerCase(java.util.Locale.ROOT); }
}
