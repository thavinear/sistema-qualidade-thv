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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CsrfProtectionFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger("com.sistema.qualidade.security-diagnostic");
    private static final Set<String> SAFE=Set.of("GET","HEAD","OPTIONS","TRACE");
    private final String frontendOrigin;
    public CsrfProtectionFilter(@Value("${app.frontend.origin}") String frontendOrigin) { this.frontendOrigin=frontendOrigin; }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String method=request.getMethod();
        String path=request.getRequestURI();
        boolean login="/api/auth/login".equals(path);
        if (login) log.info("security_diagnostic csrf_filter_enter method={} path={}", method, path);
        String origin=request.getHeader("Origin");
        boolean originPresent=origin!=null;
        boolean originMatches=!originPresent || frontendOrigin.equals(origin);
        if (login) log.info("security_diagnostic origin_check method={} path={} originPresent={} matches={}", method, path, originPresent, originMatches);
        if(!originMatches) {
            if (login) log.warn("security_diagnostic rejected method={} path={} reason=origin_mismatch", method, path);
            response.sendError(403);
            return;
        }
        if(!SAFE.contains(method)) {
            boolean publicAuth=path.equals("/api/auth/login") || path.equals("/api/auth/register");
            if(!publicAuth) {
                String cookieToken=null;
                Cookie[] cookies=request.getCookies();
                if(cookies!=null) for(Cookie cookie:cookies) if("SGQ_CSRF".equals(cookie.getName())) cookieToken=cookie.getValue();
                String headerToken=request.getHeader("X-XSRF-TOKEN");
                if(headerToken==null) headerToken=request.getHeader("X-CSRF-TOKEN");
                if(cookieToken==null || headerToken==null || !MessageDigest.isEqual(cookieToken.getBytes(StandardCharsets.UTF_8),headerToken.getBytes(StandardCharsets.UTF_8))) {
                    log.warn("security_diagnostic rejected method={} path={} reason=csrf_mismatch", method, path);
                    response.sendError(403);
                    return;
                }
            }
        }
        if (login) log.info("security_diagnostic csrf_filter_continuing method={} path={}", method, path);
        chain.doFilter(request,response);
    }
}
