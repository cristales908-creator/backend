# Arquitectura del backend

## Vista general

El backend es una aplicación Node.js con Express y Sequelize. Express recibe las peticiones HTTP, los routers validan la operación y la sesión, los modelos Sequelize representan los datos y PostgreSQL los persiste.

```mermaid
flowchart LR
    Browser[Frontend HTML] -->|HTTP / JSON| Express[Express: src/app.js]
    Express --> Auth[Middleware de autenticación y roles]
    Auth --> Routes[Routers de src/routes]
    Routes --> Models[Modelos Sequelize de src/models]
    Models --> PostgreSQL[(PostgreSQL)]
    Routes --> Catalog[Catálogo nutricional]
```

## Estructura

```text
backend/
  src/
    app.js                  Configuración de Express, relaciones y montaje de routers
    config/database.js      Conexión a PostgreSQL y carga de backend/.env
    middleware/auth.js      Tokens de sesión y autorización por rol
    controllers/            Lógica de autenticación y operaciones de cada módulo
    models/                 Entidades y tablas Sequelize
    routes/                 Endpoints agrupados por área funcional
    utils/
      nutritionCatalog.js   Opciones controladas de patologías, dietas y comidas
      password.js           Hash y verificación de contraseñas
  test/                     Pruebas automatizadas de seguridad y catálogo nutricional
  docs/architecture.md      Este documento
```

## Relaciones de datos

`ConsumoMenu` es la entidad de asignación. Cada registro conecta un paciente con un menú para una fecha y comida. Un acompañante añade una porción calculada al guardar la asignación.

```mermaid
erDiagram
    USUARIO ||--o{ HISTORIAL_INTERNACION : registra
    PACIENTE ||--o{ HISTORIAL_INTERNACION : acumula
    PACIENTE ||--o{ CONSUMO_MENU : recibe
    MENU ||--o{ CONSUMO_MENU : se_asigna
    PACIENTE ||--o{ CONSUMO : consumo_legacy
    ALIMENTO ||--o{ CONSUMO : consumo_legacy
    USUARIO ||--o{ HISTORIAL_ALMACEN : registra
```

Campos importantes de `consumos_menu`:

- `pacienteId` y `menuId`: claves foráneas obligatorias.
- `fecha` y `comida`: momento del servicio.
- `porciones_paciente`: normalmente una porción.
- `porciones_acompanante`: una porción adicional cuando el paciente tiene acompañante.
- Una restricción única por `pacienteId`, `fecha` y `comida` evita asignaciones duplicadas; una nueva asignación actualiza la existente.

`menus` guarda nombre, dieta, composición y estado activo. La aplicación valida que la dieta del menú coincida con la indicada para el paciente. La patología no selecciona automáticamente una dieta; esa decisión corresponde a Nutrición.

Los nuevos pacientes deben registrarse con una habitación (hasta 30 caracteres). El campo en la base de datos permite valores nulos para conservar pacientes preexistentes; la planificación y el reporte imprimible muestran `-` si un paciente antiguo aún no tiene habitación.

Cada alimento tiene un `stock_minimo` en la misma unidad que su cantidad disponible. Enfermería puede editar ese mínimo; los productos existentes parten de cero y generan una alerta cuando se agotan. El panel de Enfermería revisa el stock al cargar y cada minuto, muestra los productos para reponer y notifica cuando alguno cruza el mínimo.

`consumos` conserva registros históricos del flujo anterior de consumo individual. El flujo vigente permite registrar el uso de ingredientes mediante `POST /api/alimentos/consumo`: Enfermera, Nutricionista y Cocinera pueden seleccionar un alimento, cantidad y unidad. Para alimentos en gramos o kilogramos, el retiro se puede ingresar en cualquiera de esas dos unidades y se convierte a la unidad del stock antes del descuento. La operación descuenta el stock dentro de una transacción y registra la cantidad y unidad utilizadas en el historial del almacén.

## Flujo de una petición

1. `src/app.js` carga variables de entorno, crea Express, declara asociaciones y monta cada router bajo `/api`.
2. Los routers funcionales pasan por `requireAuth`; las operaciones de escritura agregan `allowRoles` según el perfil.
3. Las rutas asocian cada método y URL con el controlador correspondiente; los controladores validan la petición y usan modelos Sequelize.
4. Las operaciones que deben mantenerse consistentes, como asignaciones o cambios de internación, usan transacciones.
5. Sequelize convierte las operaciones a consultas PostgreSQL y devuelve el resultado al cliente como JSON.

## Autenticación y roles

- `POST /api/auth/registrar` requiere `STAFF_REGISTRATION_KEY` y limita los roles a Enfermera, Nutricionista y Cocinera.
- `POST /api/auth/login` verifica la contraseña y entrega un token firmado con vencimiento de ocho horas.
- Las contraseñas nuevas usan `scrypt`; contraseñas antiguas en texto plano se convierten al formato hash cuando el usuario inicia sesión correctamente.
- Las rutas privadas esperan `Authorization: Bearer <token>`.
- Nutricionista crea menús; Enfermera y Nutricionista administran pacientes, internaciones, stock y asignaciones. Cocina consulta el panel y el resumen.
- `SESSION_SECRET` y `STAFF_REGISTRATION_KEY` son variables privadas de `backend/.env`; no se documentan sus valores ni se sube ese archivo al repositorio.
- Login y registro aplican límites de intentos por IP. El almacenamiento predeterminado es local al proceso; despliegues con varias instancias requieren un almacén compartido.
- El backend exige `SESSION_SECRET` de al menos 32 bytes y rechaza el valor de ejemplo. La clave de registro también debe ser privada y tener al menos 32 caracteres.

## Routers principales

| Prefijo | Responsabilidad |
| --- | --- |
| `/api/auth` | Registro de personal e inicio de sesión |
| `/api/pacientes` | Consulta, alta, alta médica, reingreso y consumos históricos |
| `/api/historial-pacientes` | Historial de internaciones y altas |
| `/api/alimentos` | Consulta, ingreso y retiro de stock, además del historial de movimientos |
| `/api/menus` | Catálogo clínico, menús, asignaciones y cantidades para cocina |

Endpoints del módulo de menús:

| Método y ruta | Función |
| --- | --- |
| `GET /api/menus/opciones` | Catálogo de patologías, dietas y comidas |
| `GET /api/menus` | Lista menús activos; acepta `?dieta=` |
| `POST /api/menus` | Crea un menú (Nutricionista) |
| `GET /api/menus/asignaciones?fecha=AAAA-MM-DD` | Lista asignaciones del día con nombre, habitación, dieta y acompañante del paciente |
| `POST /api/menus/asignaciones` | Crea o actualiza una asignación por paciente, fecha y comida |
| `GET /api/menus/resumen?fecha=AAAA-MM-DD` | Agrupa por comida, dieta y menú y calcula las porciones. El frontend combina el resumen con las asignaciones para listar destinatarios y habitaciones, e imprimir el menú diario. |

## Configuración y ejecución

Las variables se leen desde `backend/.env` o desde la configuración del servicio de despliegue. Para PostgreSQL local se usan `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`. Para una conexión mediante `DATABASE_URL`, `DB_SSL_MODE` acepta `verify-full` (predeterminado; valida certificados) o `require` (cifra la conexión sin validar el certificado autofirmado). En Render, usa la URL interna cuando el servicio y la base estén en la misma región y configura `DB_SSL_MODE=require`; para conexiones externas, conserva `verify-full`. `DB_SSL_CA` permite proporcionar una CA privada cuando se requiere validación. No copies credenciales ni secretos a este documento.

Desde la carpeta del backend:

```powershell
npm start
```

Las pruebas automatizadas se ejecutan con:

```powershell
npm test
```

## Sincronización del esquema

Al iniciar, Sequelize ejecuta `sequelize.sync({ alter: true })` usando los modelos y sus asociaciones. Esta opción puede modificar columnas e índices existentes; respalda la base antes de desplegar cambios y prefiere migraciones revisadas en entornos con datos importantes. La sincronización no transforma valores de negocio existentes, como nombres de dietas heredados. La conexión configurada con `DATABASE_URL` valida certificados TLS; para una CA privada, proporciona el PEM en `DB_SSL_CA`.
