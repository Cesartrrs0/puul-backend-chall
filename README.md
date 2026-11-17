# API de Tareas – Challenge Puul

API para gestionar usuarios y tareas de un equipo. Permite crear usuarios, asignarles tareas (una tarea puede tener varios usuarios) y ver estadísticas del avance del equipo.

**Tecnologías:** Node.js, NestJS, TypeScript, PostgreSQL y TypeORM.

## Cómo correrlo

1. Instalar dependencias:
   ```
   npm install
   ```
2. Crear una base de datos en PostgreSQL llamada `puul_tasks`.
3. Crear un archivo `.env` en la raíz con los datos de conexión:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña
   DB_NAME=puul_tasks
   ```
4. Correr la API:
   ```
   npm run start:dev
   ```

La API queda en `http://localhost:3000`. Las tablas se crean solas al iniciar porque usé `synchronize: true` de TypeORM (para producción usaría migraciones).

## Estructura

El proyecto está dividido en dos módulos, `users` y `tasks`. Cada uno tiene:
- **entity**: la tabla en la base de datos
- **dto**: los datos que recibe cada endpoint y sus validaciones
- **controller**: las rutas
- **service**: la lógica y las consultas

Usuarios y tareas tienen una relación muchos a muchos, guardada en la tabla intermedia `task_assignees`.

## Endpoints

### Usuarios

**`POST /users`** – Crear usuario
```json
{ "name": "Ana López", "email": "ana@puul.mx", "role": "admin" }
```
El rol puede ser `member` o `admin`. Si el correo ya existe regresa 409.

**`GET /users`** – Listar usuarios
- Filtros opcionales: `name`, `email`, `role`. Ejemplo: `/users?role=member&email=puul`
- Cada usuario incluye `finishedTasks` (tareas terminadas) y `finishedTasksCost` (suma del costo de esas tareas).

### Tareas

**`POST /tasks`** – Crear tarea
```json
{
  "title": "Diseñar login",
  "description": "Pantalla de inicio de sesión",
  "estimatedHours": 8,
  "dueDate": "2026-11-30",
  "status": "active",
  "cost": 1500,
  "assignedUserIds": [1, 2]
}
```
`description` y `status` son opcionales (el estado por defecto es `active`). Si algún usuario asignado no existe regresa 400.

**`GET /tasks`** – Listar tareas
- Ordenadas de la más reciente a la menos reciente.
- Filtros opcionales y combinables: `dueDate`, `title`, `userId`, `userName`, `userEmail`. Ejemplo: `/tasks?title=login&userName=ana`

**`PATCH /tasks/:id`** – Actualizar tarea
Se mandan solo los campos que se quieren cambiar. Para reasignar usuarios se manda `assignedUserIds` con la nueva lista.
```json
{ "estimatedHours": 10, "assignedUserIds": [3] }
```

**`DELETE /tasks/:id`** – Eliminar tarea

**`GET /tasks/analytics`** – Estadísticas

## Analítica

Elegí dos estadísticas que le sirven a quien lleva el equipo:

1. **Avance del equipo (`summary`)**: cuántas tareas están activas, cuántas terminadas y cuántas están vencidas (activas con fecha de entrega pasada). Sirve para ver rápido si el equipo va atrasado.
2. **Carga de trabajo por usuario (`workloadByUser`)**: para cada usuario, cuántas tareas activas tiene y cuántas horas estimadas le faltan, ordenado de mayor a menor. Sirve para ver quién está saturado y repartir mejor las tareas.

```json
{
  "summary": { "activeTasks": 1, "finishedTasks": 2, "overdueTasks": 1 },
  "workloadByUser": [
    { "userId": 3, "name": "Carla Díaz", "activeTasks": 1, "pendingHours": 10 }
  ]
}
```

## Notas

- Las validaciones se hacen con `class-validator` en los DTOs; si un dato no es válido la API regresa 400.
- Para el costo usé `float` para mantenerlo simple. En un sistema real usaría `numeric` para evitar errores de redondeo con dinero.
