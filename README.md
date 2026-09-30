# SGQ Senac — Sistema de Gestão da Qualidade

Sistema web para gestão da qualidade baseado no ciclo **PDCA**, com Matriz GUT, Pareto, Ishikawa, 5 Porquês, 5W2H, Fluxograma e Checklist.

Projeto Integrador — Curso de Desenvolvimento de Sistemas, SENAC.

---

## 🛠️ Tecnologias

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Java 17 + Spring Boot
- **Banco:** H2
- **Mobile:** Expo + React Native

---

## 📦 Pré-requisitos

- [Java 17+](https://adoptium.net/)
- [Node.js 18+](https://nodejs.org/)

Verifique se tem instalado:

```powershell
java -version
node --version
```

---

## 🚀 Como rodar

### 1. Backend

```powershell
cd backend\sistema-qualidade
.\gradlew.bat bootRun
```

Sobe em `http://localhost:8080`.

**Teste:**
```powershell
curl http://localhost:8080/api/teste
```

Deve retornar: `Backend do Sistema de Qualidade funcionando!`

### 2. Frontend

Em **outro terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Sobe em `http://localhost:5173`.

---

## 📚 Como usar

Depois de tudo rodando, abra `http://localhost:5173`.

**Menu lateral:**

| Nº | Ferramenta | O que faz |
|----|-----------|-----------|
| 00 | Painel PDCA | Visão geral do ciclo |
| 01 | Fluxograma | Etapas do processo + POP + Checklist |
| 02 | Matriz GUT | Prioriza problemas por Gravidade × Urgência × Tendência |
| 03 | Pareto | Gráfico 80/20 |
| 04 | Ishikawa | Causas nas 6 categorias (6M) |
| 05 | 5 Porquês | Cadeia até a causa raiz |
| 06 | 5W2H | Plano de ação com responsável e prazo |