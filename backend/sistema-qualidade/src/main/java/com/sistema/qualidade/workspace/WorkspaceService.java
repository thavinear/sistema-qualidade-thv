package com.sistema.qualidade.workspace;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import com.sistema.qualidade.auth.Role;
import com.sistema.qualidade.auth.UserAccount;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkspaceService {
    private static final Map<String,String> MODULE_BY_FIELD=Map.of("problems","gut","pareto","pareto","ishikawa","ishikawa","whys","porques","flow","fluxo","w2h","w2h");
    private final WorkspaceRepository documents;
    private final ObjectMapper mapper;
    public WorkspaceService(WorkspaceRepository documents,ObjectMapper mapper) { this.documents=documents; this.mapper=mapper; }
    @Transactional(readOnly=true)
    public JsonNode get(UserAccount user) {
        JsonNode data=documents.findByUserId(user.getId()).map(doc->parse(doc.getDocument())).orElseGet(this::emptyWorkspace);
        if(user.getRole()==Role.ADMIN) return data;
        ObjectNode visible=(ObjectNode)emptyWorkspace();
        MODULE_BY_FIELD.forEach((field,module)->{ if(can(user,module,"view") && data.has(field)) visible.set(field,data.get(field)); });
        if(data.has("ishikawa") && can(user,"ishikawa","view")) visible.set("ishikawa",data.get("ishikawa"));
        if(data.has("whys") && can(user,"porques","view")) visible.set("whys",data.get("whys"));
        return visible;
    }
    @Transactional
    public JsonNode save(UserAccount user,JsonNode incoming) {
        if(incoming==null || !incoming.isObject()) throw new IllegalArgumentException("O conteúdo do espaço de trabalho deve ser um objeto JSON.");
        validateShape(incoming);
        WorkspaceDocument doc=documents.findByUserId(user.getId()).orElseGet(()->new WorkspaceDocument(user,write(emptyWorkspace())));
        ObjectNode current=(ObjectNode)parse(doc.getDocument());
        for(var entry:MODULE_BY_FIELD.entrySet()) {
            String field=entry.getKey(), module=entry.getValue();
            if(!incoming.has(field) || !can(user,module,"edit")) continue;
            JsonNode next=incoming.get(field), previous=current.get(field);
            if(!next.equals(previous) && containsRemoval(previous,next) && !can(user,module,"delete")) continue;
            current.set(field,next);
        }
        String serialized=write(current);
        if(serialized.length()>2_000_000) throw new IllegalArgumentException("O conteúdo do espaço de trabalho excede o limite de 2 MB.");
        doc.setDocument(serialized);
        documents.save(doc);
        return get(user);
    }
    private boolean containsRemoval(JsonNode previous,JsonNode next) {
        if(previous==null || next==null) return false;
        if(previous.isArray() && next.isArray()) {
            if(next.size()<previous.size()) return true;
            for(JsonNode oldItem:previous) {
                JsonNode matching=null;
                if(oldItem.isObject() && oldItem.has("id")) {
                    for(JsonNode newItem:next) if(newItem.isObject() && oldItem.get("id").equals(newItem.get("id"))) { matching=newItem; break; }
                    if(matching==null) return true;
                } else if(oldItem.isValueNode()) {
                    boolean exists=false; for(JsonNode newItem:next) if(oldItem.equals(newItem)) { exists=true; break; }
                    if(!exists) return true;
                }
                if(matching!=null && containsRemoval(oldItem,matching)) return true;
            }
            return false;
        }
        if(previous.isObject() && next.isObject()) {
            for(var field:previous.properties()) if(!next.has(field.getKey()) || containsRemoval(field.getValue(),next.get(field.getKey()))) return true;
        }
        return false;
    }
    private void validateShape(JsonNode data) {
        for(String field:java.util.List.of("problems","pareto","flow","w2h")) if(data.has(field) && !data.get(field).isArray()) throw new IllegalArgumentException("Campo inválido: "+field+".");
        for(String field:java.util.List.of("ishikawa","whys")) if(data.has(field) && !data.get(field).isObject()) throw new IllegalArgumentException("Campo inválido: "+field+".");
    }
    private boolean can(UserAccount user,String module,String action) {
        return user.getRole()==Role.ADMIN || (user.getPermissions().contains(module+":view") && ("view".equals(action) || user.getPermissions().contains(module+":"+action)));
    }
    private JsonNode emptyWorkspace() {
        ObjectNode root=mapper.createObjectNode();
        root.putArray("problems"); root.putArray("pareto"); root.putArray("flow"); root.putArray("w2h");
        ObjectNode cats=mapper.createObjectNode(); cats.putArray("metodo"); cats.putArray("maquina"); cats.putArray("medida");
        cats.putArray("meioAmbiente"); cats.putArray("maoDeObra"); cats.putArray("materiaPrima");
        ObjectNode ishikawa=mapper.createObjectNode(); ishikawa.put("problema",""); ishikawa.set("cats",cats); root.set("ishikawa",ishikawa);
        ObjectNode whys=mapper.createObjectNode(); whys.put("problema",""); whys.putArray("chain"); root.set("whys",whys);
        return root;
    }
    private JsonNode parse(String json) { try { return mapper.readTree(json); } catch(Exception ex) { return emptyWorkspace(); } }
    private String write(JsonNode node) { try { return mapper.writeValueAsString(node); } catch(Exception ex) { throw new IllegalStateException("Não foi possível serializar os dados.",ex); } }
}
