package com.sistema.qualidade;

import java.time.Instant;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> invalid(MethodArgumentNotValidException ex) {
        Map<String,String> fields=ex.getBindingResult().getFieldErrors().stream().collect(java.util.stream.Collectors.toMap(
                e->e.getField(),e->e.getDefaultMessage()==null?"Valor inválido.":e.getDefaultMessage(),(a,b)->a));
        return ResponseEntity.badRequest().body(Map.of("timestamp",Instant.now(),"status",400,"error","Dados inválidos.","fields",fields));
    }
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException ex) {
        int status=ex.getStatusCode().value();
        return ResponseEntity.status(status).body(Map.of("timestamp",Instant.now(),"status",status,"error",ex.getReason()==null?"Solicitação inválida.":ex.getReason()));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class,IllegalArgumentException.class})
    ResponseEntity<?> malformed(Exception ex) { return ResponseEntity.badRequest().body(Map.of("timestamp",Instant.now(),"status",400,"error","Corpo da requisição inválido.")); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict(Exception ex) { return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("timestamp",Instant.now(),"status",409,"error","O registro viola uma regra de unicidade.")); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> internal(Exception ex) { return ResponseEntity.internalServerError().body(Map.of("timestamp",Instant.now(),"status",500,"error","Erro interno. Tente novamente mais tarde.")); }
}
