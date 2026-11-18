package com.sistema.qualidade.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SecurityRequestTraceFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger("com.sistema.qualidade.security-diagnostic");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!"/api/auth/login".equals(request.getRequestURI())) {
            chain.doFilter(request, response);
            return;
        }
        long started = System.currentTimeMillis();
        log.info("security_diagnostic backend_received method={} path={} originPresent={}",
                request.getMethod(), request.getRequestURI(), request.getHeader("Origin") != null);
        try {
            chain.doFilter(request, response);
        } finally {
            log.info("security_diagnostic response_completed method={} path={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(), response.getStatus(), System.currentTimeMillis() - started);
        }
    }
}