package com.sistema.qualidade.workspace;

import com.sistema.qualidade.auth.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name="sgq_workspaces")
public class WorkspaceDocument {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false, unique=true)
    private UserAccount user;
    @Column(nullable=false, columnDefinition="TEXT") private String document;
    protected WorkspaceDocument() { }
    public WorkspaceDocument(UserAccount user, String document) { this.user=user; this.document=document; }
    public Long getId() { return id; }
    public UserAccount getUser() { return user; }
    public String getDocument() { return document; }
    public void setDocument(String document) { this.document=document; }
}
