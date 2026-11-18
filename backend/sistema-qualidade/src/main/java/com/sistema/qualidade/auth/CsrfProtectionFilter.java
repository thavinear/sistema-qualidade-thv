package com.sistema.qualidade.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CsrfProtectionFilter extends OncePerRequestFilter {
    private static final Set<String> SAFE=Set.of("GET","HEAD","OPTIONS","TRACE");
    private final String frontendOrigin;
    public CsrfProtectionFilter(@Value("${app.frontend.origin}") String frontendOrigin) { this.frontendOrigin=frontendOrigin; }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String origin=request.getHeader("Origin");
        if(origin!=null && !frontendOrigin.equals(origin)) { response.sendError(403); return; }
        String method=request.getMethod();
        if(!SAFE.contains(method)) {
            String path=request.getRequestURI();
            boolean publicAuth=path.equals("/api/auth/login") || path.equals("/api/auth/register");
            if(!publicAuth) {
                String cookieToken=null;
                Cookie[] cookies=request.getCookies();
                if(cookies!=null) for(Cookie cookie:cookies) if("SGQ_CSRF".equals(cookie.getName())) cookieToken=cookie.getValue();
                String headerToken=request.getHeader("X-XSRF-TOKEN");
                if(headerToken==null) headerToken=request.getHeader("X-CSRF-TOKEN");
                if(cookieToken==null || headerToken==null || !MessageDigest.isEqual(cookieToken.getBytes(StandardCharsets.UTF_8),headerToken.getBytes(StandardCharsets.UTF_8))) {
                    response.sendError(403); return;
                }
            }
        }
        chain.doFilter(request,response);
    }
}
