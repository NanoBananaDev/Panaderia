# Panadería Delicia

Aplicación web educativa para mostrar y administrar productos de una panadería. Está construida con Node.js, Express, EJS, Bootstrap y PostgreSQL. Los dos servicios se ejecutan en Docker Compose y PostgreSQL guarda sus datos en un volumen nombrado.

## Objetivo

Demostrar una aplicación web funcional conectada a una base de datos relacional dentro de Docker, con operaciones para crear, consultar, editar y eliminar productos. La interfaz ofrece un catálogo público y un panel administrativo sencillo.

## Tecnologías

- Node.js 22 y Express 4 como servidor y framework web.
- EJS para renderizar vistas en el servidor.
- Bootstrap 5 y CSS personalizado para la interfaz adaptable.
- PostgreSQL 16 como base de datos.
- Dockerfile para construir la imagen web y Docker Compose para coordinar web y db.
- Volumen nombrado `panaderia_data` para conservar los datos de PostgreSQL.

## Estructura

```text
.
├── database/
│   └── init.sql                 # tabla y ocho productos de ejemplo
├── src/
│   ├── controllers/             # consultas y validaciones del catálogo
│   ├── database/                # pool y reintentos de conexión
│   ├── routes/                  # rutas de Express
│   ├── views/                   # vistas EJS y parciales
│   └── app.js                   # configuración e inicio del servidor
├── public/css/                  # estilos propios (CDN de Vercel y Express local)
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Arquitectura y rutas

El navegador solicita páginas a Express. Las rutas delegan las operaciones a un controlador, que usa `pg` para consultar PostgreSQL y entrega los datos a EJS. En la red privada de Compose, la aplicación alcanza PostgreSQL usando el host `db`, que es el nombre del servicio; dentro de Docker no se usa `localhost` para esa conexión.

| Ruta | Uso |
| --- | --- |
| `GET /` | Catálogo público obtenido desde PostgreSQL |
| `GET /admin` | Tabla de administración |
| `GET /admin/productos/nuevo` | Formulario de alta |
| `POST /admin/productos` | Crear producto |
| `GET /admin/productos/:id/editar` | Formulario de edición |
| `PUT /admin/productos/:id` | Guardar cambios |
| `DELETE /admin/productos/:id` | Eliminar producto |

Los formularios validan campos obligatorios, categoría, URL de imagen, precio y stock. Las consultas usan parámetros para no concatenar valores del formulario en SQL. El esquema SQL idempotente se verifica al arrancar; la práctica no incluye autenticación.

## Dockerfile y Compose

El `Dockerfile` parte de la imagen oficial `node:22-alpine`, instala dependencias de producción, copia `src`, expone el puerto 3000 y ejecuta Express como el usuario sin privilegios `node`.

`docker-compose.yml` define dos servicios:

- `web`: construye la aplicación y publica `3000:3000`. Espera al healthcheck de la base de datos y además reintenta la conexión al arrancar.
- `db`: usa `postgres:16-alpine`, crea la base y usuario configurados, y monta `database/init.sql` para inicialización.

El archivo `.env.example` muestra las variables necesarias. Para personalizar las credenciales, copia ese archivo como `.env` y cambia `POSTGRES_PASSWORD`. El `.gitignore` excluye `.env`; no guardes credenciales personales en el repositorio. Si no creas `.env`, Compose usa credenciales locales de demostración definidas en el YAML.

## Demo pública en Vercel

Vercel ejecuta Express como una función y sirve `public/` como contenido estático. La demo en Vercel muestra los productos de `src/database/sampleProducts.js` y el panel en modo de solo lectura; no usa base de datos ni conserva cambios. El proyecto Docker local sí usa PostgreSQL, el volumen `panaderia_data` y el CRUD completo. Así, el enlace público sirve para mostrar la página desde cualquier lugar, y Docker demuestra la base de datos y persistencia de la práctica.

Para desplegar desde la carpeta con Vercel CLI, ejecuta `vercel` para vista previa y `vercel --prod` para publicar. El proyecto `panaderia-delicia` se puede desplegar directamente desde CLI; no requiere publicar el código a GitHub.

## Ejecutar

Requisitos: Docker Desktop (o Docker Engine) con el complemento Docker Compose.

```bash
docker compose up --build
```

Cuando los servicios estén listos, abre [http://localhost:3000](http://localhost:3000) y [http://localhost:3000/admin](http://localhost:3000/admin). Para ejecutar en segundo plano:

```bash
docker compose up -d --build
```

## Comprobar contenedores y registros

```bash
docker compose ps
docker compose logs
docker compose logs web
docker compose logs db
```

Ambos contenedores deben aparecer en ejecución; la base también debe indicar estado `healthy`.

## PostgreSQL

Entrar en la base desde el contenedor:

```bash
docker compose exec db psql -U panaderia_user -d panaderia
```

Consultas útiles en `psql`:

```sql
\dt
SELECT id, nombre, categoria, precio, stock FROM productos ORDER BY id;
\q
```

Si cambiaste usuario o base en `.env`, usa esos mismos valores en el comando `psql`. `database/init.sql` se ejecuta automáticamente solo cuando PostgreSQL crea por primera vez el directorio de datos vacío. Para volver a ejecutar la inicialización desde cero hay que borrar el volumen, lo que también borra los datos guardados.

## Volúmenes y persistencia

Compose monta el volumen nombrado `panaderia_data` en `/var/lib/postgresql/data`, donde PostgreSQL guarda sus archivos:

```bash
docker volume ls
docker compose down
docker compose up -d
```

`docker compose down` elimina los contenedores y la red del proyecto, pero **no elimina el volumen**. `docker compose down -v` **sí elimina los volúmenes** y los datos persistidos; úsalo solo si deseas reiniciar la base por completo.

### Demostración de persistencia

1. Inicia con `docker compose up --build`.
2. Abre `/admin`, elige **Agregar producto** y crea, por ejemplo: Pan de Queso Especial; descripción “Pan artesanal relleno de queso.”; precio `8.50`; categoría `Especialidades`; stock `15`; agrega una URL de imagen pública.
3. Comprueba que aparece en `/` y consulta la fila con `SELECT * FROM productos WHERE nombre = 'Pan de Queso Especial';`.
4. Detén los servicios con `docker compose down`.
5. Inicia otra vez con `docker compose up` y revisa `/admin` o repite la consulta SQL. El producto seguirá allí porque `panaderia_data` permanece.

## Git y GitHub

El `.gitignore` excluye dependencias instaladas, `.env`, logs y archivos temporales. El proyecto está preparado para versionarse en `https://github.com/NanoBananaDev/Panaderia`. La ejecución local de esta práctica no publica cambios ni hace push automáticamente.
