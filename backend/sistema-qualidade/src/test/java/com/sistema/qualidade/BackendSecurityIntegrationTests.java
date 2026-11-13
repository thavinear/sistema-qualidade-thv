package com.sistema.qualidade;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sistema.qualidade.auth.Role;
import com.sistema.qualidade.auth.UserAccount;
import com.sistema.qualidade.auth.UserRepository;
import com.sistema.qualidade.workspace.WorkspaceRepository;
import com.sistema.qualidade.workspace.WorkspaceDocument;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties={
        "spring.datasource.url=jdbc:h2:mem:sgqtest;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "app.jwt.secret=local-test-secret-that-is-longer-than-32-bytes",
        "app.frontend.origin=http://localhost:5173",
        "app.auth.cookie-secure=false"
})
@AutoConfigureMockMvc
class BackendSecurityIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired WorkspaceRepository workspaces;
    @Autowired PasswordEncoder encoder;
    private List<String> adminCookies;
    private String adminCsrf;

    @BeforeEach void setUp() throws Exception {
        workspaces.deleteAll(); users.deleteAll();
        users.save(new UserAccount("Admin de teste","admin@test.local",encoder.encode("AdminTest123!"),Role.ADMIN));
        MvcResult login=mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("""
                  {"email":"admin@test.local","password":"AdminTest123!"}
                  """)).andExpect(status().isOk()).andReturn();
        adminCookies=cookies(login); adminCsrf=login.getResponse().getHeader("X-CSRF-TOKEN");
    }

    @Test void registrationHashesPasswordAndReturnsHttpOnlySessionCookie() throws Exception {
        MvcResult result=mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("""
                  {"name":"Pessoa Usuária","email":"user@test.local","password":"SenhaForte123!"}
                  """)).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER")).andReturn();
        UserAccount stored=users.findByEmailIgnoreCase("user@test.local").orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(stored.getPasswordHash().startsWith("$2a$"));
        org.junit.jupiter.api.Assertions.assertNotEquals("SenhaForte123!",stored.getPasswordHash());
        org.junit.jupiter.api.Assertions.assertTrue(result.getResponse().getHeaders("Set-Cookie").stream().anyMatch(c->c.contains("SGQ_SESSION") && c.contains("HttpOnly")));
        org.junit.jupiter.api.Assertions.assertFalse(result.getResponse().getContentAsString().contains("password"));
    }

    @Test void rejectsInvalidLoginAndProtectsAdminEndpoints() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@test.local\",\"password\":\"wrong-password\"}")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
        MvcResult userRegister=mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Usuario\",\"email\":\"user2@test.local\",\"password\":\"SenhaForte123!\"}")).andReturn();
        mvc.perform(get("/api/admin/users").cookie(cookies(userRegister).stream().map(c->{String[] p=c.split("=",2);return new jakarta.servlet.http.Cookie(p[0],p[1]);}).toArray(jakarta.servlet.http.Cookie[]::new)))
                .andExpect(status().isForbidden());
    }

    @Test void adminCanCreateListAndDeleteUserWithPermissionSettings() throws Exception {
        String request="{\"name\":\"Operador\",\"email\":\"operator@test.local\",\"password\":\"OperatorPass123!\",\"role\":\"USER\",\"active\":true,\"permissions\":[\"gut:view\",\"gut:edit\"]}";
        mvc.perform(post("/api/admin/users").cookie(adminCookieObjects()).header("X-CSRF-TOKEN",adminCsrf)
                .contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isCreated()).andExpect(jsonPath("$.permissions",hasSize(2)));
        mvc.perform(get("/api/admin/users").cookie(adminCookieObjects())).andExpect(status().isOk()).andExpect(jsonPath("$[*].email",hasItem("operator@test.local")));
        UserAccount operator=users.findByEmailIgnoreCase("operator@test.local").orElseThrow();
        workspaces.save(new WorkspaceDocument(operator,"{}"));
        long id=operator.getId();
        mvc.perform(delete("/api/admin/users/"+id).cookie(adminCookieObjects()).header("X-CSRF-TOKEN",adminCsrf)).andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertFalse(users.existsByEmailIgnoreCase("operator@test.local"));
    }

    @Test void adminGetsClearValidationMessageWhenCreatingUserWithoutPassword() throws Exception {
        String request="""
                {"name":"Operador","email":"operator@test.local","password":"","role":"USER","active":true,"permissions":["gut:view"]}
                """;
        mvc.perform(post("/api/admin/users").cookie(adminCookieObjects()).header("X-CSRF-TOKEN",adminCsrf)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.password", containsString("senha")));
    }

    @Test void adminCanUpdateUserWithBlankPasswordAndKeepExistingPassword() throws Exception {
        UserAccount operator=users.save(new UserAccount("Operador","operator@test.local",encoder.encode("OperatorPass123!"),Role.USER));
        String previousHash=operator.getPasswordHash();
        String request="""
                {"name":"Operador atualizado","email":"operator@test.local","password":"","role":"USER","active":true,"permissions":["gut:view"]}
                """;

        mvc.perform(put("/api/admin/users/"+operator.getId()).cookie(adminCookieObjects()).header("X-CSRF-TOKEN",adminCsrf)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Operador atualizado"));

        UserAccount updated=users.findById(operator.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(previousHash,updated.getPasswordHash());
    }

    @Test void workspaceRequiresAuthenticationAndIsScopedToCurrentUser() throws Exception {
        mvc.perform(get("/api/workspace")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/workspace").cookie(adminCookieObjects())).andExpect(status().isOk()).andExpect(jsonPath("$.problems").isArray());
        String data="{\"problems\":[{\"id\":\"p1\",\"nome\":\"Quebra\"}],\"pareto\":[],\"ishikawa\":{\"problema\":\"\",\"cats\":{}},\"whys\":{\"problema\":\"\",\"chain\":[]},\"flow\":[],\"w2h\":[]}";
        mvc.perform(put("/api/workspace").cookie(adminCookieObjects()).header("X-CSRF-TOKEN",adminCsrf).contentType(MediaType.APPLICATION_JSON).content(data))
                .andExpect(status().isOk()).andExpect(jsonPath("$.problems[0].nome").value("Quebra"));
    }

    @Test void userCannotReadOrOverwriteModulesWithoutPermission() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Leitor\",\"email\":\"reader@test.local\",\"password\":\"ReaderPass123!\"}"))
                .andExpect(status().isOk());
        UserAccount reader=users.findByEmailIgnoreCase("reader@test.local").orElseThrow();
        reader.setPermissions(java.util.Set.of("dashboard:view")); users.save(reader);
        MvcResult login=mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"reader@test.local\",\"password\":\"ReaderPass123!\"}")).andExpect(status().isOk()).andReturn();
        jakarta.servlet.http.Cookie[] cookies=cookies(login).stream().map(c->{String[] p=c.split("=",2);return new jakarta.servlet.http.Cookie(p[0],p[1]);}).toArray(jakarta.servlet.http.Cookie[]::new);
        String payload="{\"problems\":[{\"id\":\"forbidden\",\"nome\":\"Privado\"}],\"pareto\":[],\"ishikawa\":{\"problema\":\"\",\"cats\":{}},\"whys\":{\"problema\":\"\",\"chain\":[]},\"flow\":[],\"w2h\":[]}";
        mvc.perform(put("/api/workspace").cookie(cookies).header("X-CSRF-TOKEN",login.getResponse().getHeader("X-CSRF-TOKEN"))
                .contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isOk()).andExpect(jsonPath("$.problems").isArray());
        mvc.perform(get("/api/workspace").cookie(cookies)).andExpect(status().isOk()).andExpect(jsonPath("$.problems",hasSize(0)));
    }

    private List<String> cookies(MvcResult result) { return new ArrayList<>(result.getResponse().getHeaders("Set-Cookie").stream().map(c->c.split(";",2)[0]).toList()); }
    private jakarta.servlet.http.Cookie[] adminCookieObjects() { return adminCookies.stream().map(c->{String[] p=c.split("=",2);return new jakarta.servlet.http.Cookie(p[0],p[1]);}).toArray(jakarta.servlet.http.Cookie[]::new); }
}
