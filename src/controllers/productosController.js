const { pool, hasDatabase } = require('../database/pool');
const productosDeMuestra = require('../database/sampleProducts');

const CATEGORIAS = ['Panes', 'Pastelería', 'Salados', 'Galletas', 'Especialidades'];

function validarProducto(body) {
  const producto = {
    nombre: String(body.nombre || '').trim(),
    descripcion: String(body.descripcion || '').trim(),
    precio: Number(body.precio),
    categoria: String(body.categoria || ''),
    imagen: String(body.imagen || '').trim(),
    stock: Number(body.stock)
  };
  const errores = [];
  if (!producto.nombre || producto.nombre.length > 120) errores.push('El nombre es obligatorio y debe tener máximo 120 caracteres.');
  if (!producto.descripcion) errores.push('La descripción es obligatoria.');
  if (String(body.precio ?? '').trim() === '') errores.push('El precio es obligatorio.');
  if (!Number.isFinite(producto.precio) || producto.precio < 0) errores.push('El precio debe ser un número igual o mayor a cero.');
  if (!CATEGORIAS.includes(producto.categoria)) errores.push('Selecciona una categoría válida.');
  if (!producto.imagen || !/^https?:\/\//i.test(producto.imagen)) errores.push('La imagen debe ser una URL que empiece por http:// o https://.');
  if (String(body.stock ?? '').trim() === '') errores.push('El stock es obligatorio.');
  if (!Number.isInteger(producto.stock) || producto.stock < 0) errores.push('El stock debe ser un número entero igual o mayor a cero.');
  return { producto, errores };
}

function mensaje(req) {
  return req.query.mensaje ? { tipo: req.query.tipo === 'error' ? 'danger' : 'success', texto: req.query.mensaje } : null;
}

async function listarProductos() {
  if (!hasDatabase) return productosDeMuestra;
  const { rows } = await pool.query('SELECT * FROM productos ORDER BY id');
  return rows;
}

function soloLectura(req, res) {
  if (hasDatabase) return false;
  res.status(503).render('admin/demo-read-only');
  return true;
}

async function inicio(req, res, next) {
  try {
    const productos = await listarProductos();
    res.render('inicio', { productos });
  } catch (error) { next(error); }
}

async function admin(req, res, next) {
  try {
    const productos = await listarProductos();
    res.render('admin/index', { productos, aviso: mensaje(req), readOnlyDemo: !hasDatabase });
  } catch (error) { next(error); }
}

function nuevo(req, res) {
  if (soloLectura(req, res)) return;
  res.render('admin/formulario', { titulo: 'Agregar producto', accion: '/admin/productos', producto: {}, categorias: CATEGORIAS, errores: [] });
}

async function crear(req, res, next) {
  if (soloLectura(req, res)) return;
  const { producto, errores } = validarProducto(req.body);
  if (errores.length) return res.status(400).render('admin/formulario', { titulo: 'Agregar producto', accion: '/admin/productos', producto, categorias: CATEGORIAS, errores });
  try {
    await pool.query('INSERT INTO productos (nombre, descripcion, precio, categoria, imagen, stock) VALUES ($1, $2, $3, $4, $5, $6)', Object.values(producto));
    res.redirect('/admin?mensaje=' + encodeURIComponent('Producto agregado correctamente.'));
  } catch (error) { next(error); }
}

async function editar(req, res, next) {
  if (soloLectura(req, res)) return;
  try {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).render('404');
    res.render('admin/formulario', { titulo: 'Editar producto', accion: `/admin/productos/${req.params.id}/editar`, producto: rows[0], categorias: CATEGORIAS, errores: [] });
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  if (soloLectura(req, res)) return;
  const { producto, errores } = validarProducto(req.body);
  if (errores.length) return res.status(400).render('admin/formulario', { titulo: 'Editar producto', accion: `/admin/productos/${req.params.id}/editar`, producto: { ...producto, id: req.params.id }, categorias: CATEGORIAS, errores });
  try {
    const result = await pool.query('UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, categoria=$4, imagen=$5, stock=$6 WHERE id=$7', [...Object.values(producto), req.params.id]);
    if (!result.rowCount) return res.status(404).render('404');
    res.redirect('/admin?mensaje=' + encodeURIComponent('Producto actualizado correctamente.'));
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  if (soloLectura(req, res)) return;
  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
    res.redirect('/admin?mensaje=' + encodeURIComponent(result.rowCount ? 'Producto eliminado correctamente.' : 'El producto ya no existe.') + (result.rowCount ? '' : '&tipo=error'));
  } catch (error) { next(error); }
}

module.exports = { inicio, admin, nuevo, crear, editar, actualizar, eliminar };
