package com.sistema.qualidade.auth;

import static com.sistema.qualidade.auth.AuthDtos.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.sistema.qualidade.workspace.WorkspaceRepository;

@Service
public class AdminUserService {
    private static final Set<String> MODULES = Set.of("dashboard", "fluxo", "gut", "pareto", "ishikawa", "porques", "w2h", "reports");
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final WorkspaceRepository workspaces;
    public AdminUserService(UserRepository users, PasswordEncoder passwords, WorkspaceRepository workspaces) { this.users=users; this.passwords=passwords; this.workspaces=workspaces; }
    @Transactional(readOnly=true) public List<UserResponse> list() { return users.findAll().stream().map(UserResponse::from).toList(); }
    @Transactional
    public UserResponse create(UserCreateRequest request) {
        validatePermissions(request.permissions());
        String email=AuthService.normalize(request.email());
        if(users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail já cadastrado.");
        if(request.password()==null || request.password().length()<10) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A senha deve ter pelo menos 10 caracteres.");
        UserAccount user=new UserAccount(request.name().trim(),email,passwords.encode(request.password()),request.role());
        user.setActive(request.active()); if(request.role()==Role.USER) user.setPermissions(request.permissions());
        return UserResponse.from(users.save(user));
    }
    @Transactional
    public UserResponse update(long id, UserRequest request, UserAccount actor) {
        validatePermissions(request.permissions());
        UserAccount user=find(id);
        if(user.getId().equals(actor.getId()) && (request.role()!=Role.ADMIN || !request.active()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Não é permitido remover ou desativar o próprio acesso administrativo.");
        if(user.getRole()==Role.ADMIN && user.isActive() && (request.role()!=Role.ADMIN || !request.active())
                && users.findAll().stream().filter(u->u.getRole()==Role.ADMIN && u.isActive()).count()<=1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"O sistema precisa manter ao menos um administrador ativo.");
        String email=AuthService.normalize(request.email());
        if(!user.getEmail().equalsIgnoreCase(email) && users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail já cadastrado.");
        user.setName(request.name().trim()); user.setEmail(email); user.setRole(request.role()); user.setActive(request.active());
        if(request.password()!=null && !request.password().isBlank()) {
            if(request.password().length()<10) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A senha deve ter pelo menos 10 caracteres.");
            user.setPasswordHash(passwords.encode(request.password()));
        }
        user.setPermissions(request.role()==Role.USER ? request.permissions() : Set.of());
        return UserResponse.from(users.save(user));
    }
    @Transactional
    public void delete(long id, UserAccount actor) {
        UserAccount user=find(id);
        if(user.getId().equals(actor.getId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Não é permitido excluir a própria conta.");
        if(user.getRole()==Role.ADMIN && users.findAll().stream().filter(u->u.getRole()==Role.ADMIN && u.isActive()).count()<=1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"O sistema precisa manter ao menos um administrador ativo.");
        workspaces.deleteForUser(user.getId());
        users.delete(user);
    }
    private UserAccount find(long id) { return users.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Usuário não encontrado.")); }
    private void validatePermissions(Set<String> permissions) {
        if(permissions==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe as permissões.");
        boolean valid=permissions.stream().allMatch(p->{ String[] parts=p.split(":",-1); return parts.length==2 && MODULES.contains(parts[0]) && Set.of("view","edit","delete").contains(parts[1]); });
        if(!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Permissão inválida.");
    }
}
