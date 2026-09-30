package com.sistema.qualidade.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TesteController {

    @GetMapping("/api/teste")
    public String teste() {
        return "Backend do Sistema de Qualidade funcionando!";
    }
}