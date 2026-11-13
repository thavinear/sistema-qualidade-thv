package com.sistema.qualidade.auth;

import static com.sistema.qualidade.auth.AuthDtos.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth=auth; }
    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserAccount user = auth.register(request);
        String csrf = auth.newCsrfToken();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, auth.sessionCookie(user).toString(), auth.csrfCookie(csrf, Duration.ofHours(1)).toString())
                .header("X-CSRF-TOKEN", csrf).body(SessionResponse.from(user));
    }
    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(@Valid @RequestBody LoginRequest request) {
        UserAccount user = auth.authenticate(request);
        String csrf = auth.newCsrfToken();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, auth.sessionCookie(user).toString(), auth.csrfCookie(csrf, Duration.ofHours(1)).toString())
                .header("X-CSRF-TOKEN", csrf).body(SessionResponse.from(user));
    }
    @GetMapping("/me")
    public SessionResponse me(@AuthenticationPrincipal UserAccount user) { return SessionResponse.from(user); }
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout() {
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, auth.clearSessionCookie().toString(), auth.csrfCookie("", Duration.ZERO).toString())
                .body(new MessageResponse("Sessão encerrada."));
    }
}
