package com.sistema.qualidade.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    public static final String COOKIE_NAME = "SGQ_SESSION";
    private final JwtService jwtService;
    private final UserRepository users;
    public JwtAuthenticationFilter(JwtService jwtService, UserRepository users) { this.jwtService = jwtService; this.users = users; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) for (Cookie cookie : cookies) if (COOKIE_NAME.equals(cookie.getName())) token = cookie.getValue();
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserAccount user = users.findByEmailIgnoreCase(jwtService.subject(token)).filter(UserAccount::isActive).orElse(null);
                if (user != null) {
                    var authorities = new java.util.ArrayList<SimpleGrantedAuthority>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                    user.getPermissions().forEach(value -> authorities.add(new SimpleGrantedAuthority("PERM_" + value)));
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, authorities));
                }
            } catch (RuntimeException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
