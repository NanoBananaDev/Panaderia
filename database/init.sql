CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    categoria VARCHAR(40) NOT NULL CHECK (categoria IN ('Panes', 'Pastelería', 'Salados', 'Galletas', 'Especialidades')),
    imagen TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS productos_nombre_unico ON productos (nombre);

INSERT INTO productos (nombre, descripcion, precio, categoria, imagen, stock)
SELECT datos.nombre, datos.descripcion, datos.precio, datos.categoria, datos.imagen, datos.stock
FROM (VALUES
    ('Pan Francés', 'Crujiente por fuera y suave por dentro, horneado cada mañana.', 1.50, 'Panes', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85', 40),
    ('Croissant', 'Hojaldre dorado y mantequilloso para acompañar tu café.', 6.00, 'Pastelería', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85', 18),
    ('Pan Integral', 'Pan nutritivo de granos seleccionados y sabor casero.', 8.00, 'Panes', 'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?auto=format&fit=crop&w=900&q=85', 14),
    ('Empanada de Queso', 'Masa ligera rellena de queso, recién salida del horno.', 5.50, 'Salados', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85', 22),
    ('Torta de Chocolate', 'Bizcocho húmedo de cacao con una cobertura sedosa.', 18.00, 'Pastelería', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', 6),
    ('Cuñapé', 'Tradicional bocado boliviano de almidón de yuca y queso.', 3.00, 'Especialidades', 'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=900&q=85', 25),
    ('Galletas Artesanales', 'Galletas de mantequilla hechas en pequeños lotes.', 4.50, 'Galletas', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', 30),
    ('Pan de Chocolate', 'Masa tierna con trozos de chocolate en cada mordida.', 7.00, 'Especialidades', 'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=900&q=85', 12)
) AS datos(nombre, descripcion, precio, categoria, imagen, stock)
ON CONFLICT (nombre) DO NOTHING;
